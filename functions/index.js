const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

initializeApp();
const db = getFirestore();
const resendApiKey = defineSecret('RESEND_API_KEY');
const otpFromEmail = defineSecret('OTP_FROM_EMAIL');
const STOP_WORDS = new Set(['the', 'and', 'with', 'near', 'item', 'lost', 'found']);
function tokens(text = '') { return [...new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word)))]; }
function digest(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function otpCode() { return String(crypto.randomInt(100000, 1000000)); }

exports.requestEmailOtp = onCall({ secrets: [resendApiKey, otpFromEmail] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in with your password before requesting an OTP.');
  const { usn, email } = request.data || {};
  if (request.auth.token.email !== String(email).trim().toLowerCase()) throw new HttpsError('permission-denied', 'The email does not match the signed-in account.');
  const profile = await getAuth().getUser(request.auth.uid);
  const identity = profile.displayName || '';
  if (!identity.toUpperCase().includes(String(usn).toUpperCase())) throw new HttpsError('permission-denied', 'The ID does not match the signed-in account.');
  const code = otpCode();
  const otpRef = db.collection('email_otps').doc(request.auth.uid);
  await otpRef.set({ uid: request.auth.uid, usn: String(usn).toUpperCase(), email: String(email).trim().toLowerCase(), codeHash: digest(code), expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0, createdAt: FieldValue.serverTimestamp() });
  // Configure RESEND_API_KEY and OTP_FROM_EMAIL as Firebase Secret Manager secrets.
  const apiKey = resendApiKey.value();
  const from = otpFromEmail.value();
  if (!apiKey || !from) throw new HttpsError('failed-precondition', 'OTP email delivery is not configured. Add RESEND_API_KEY and OTP_FROM_EMAIL to Firebase Functions secrets.');
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [email], subject: 'Campus Lost & Found verification code', text: `Your Campus Lost & Found verification code is ${code}. It expires in 10 minutes. If you did not sign in, ignore this message.` }) });
  if (!response.ok) throw new HttpsError('internal', 'The OTP email provider rejected the message. Check the sender domain and provider logs.');
  return { expiresInSeconds: 600 };
});

exports.verifyEmailOtp = onCall(async (request) => {
  const { usn, email, code } = request.data || {};
  const query = await db.collection('email_otps').where('usn', '==', String(usn).toUpperCase()).where('email', '==', String(email).trim().toLowerCase()).limit(1).get();
  if (query.empty) throw new HttpsError('not-found', 'This OTP has expired. Request a new code.');
  const ref = query.docs[0].ref; const data = query.docs[0].data();
  if (Date.now() > data.expiresAt) { await ref.delete(); throw new HttpsError('deadline-exceeded', 'This OTP has expired. Request a new code.'); }
  if ((data.attempts || 0) >= 5) { await ref.delete(); throw new HttpsError('resource-exhausted', 'Too many incorrect attempts. Request a new code.'); }
  if (digest(String(code).trim()) !== data.codeHash) { await ref.update({ attempts: FieldValue.increment(1) }); throw new HttpsError('invalid-argument', 'Incorrect OTP.'); }
  await ref.delete(); return { verified: true };
});

const telegramBotToken = defineSecret('TELEGRAM_BOT_TOKEN');
const whatsappToken = defineSecret('WHATSAPP_ACCESS_TOKEN');
const whatsappPhoneNumberId = defineSecret('WHATSAPP_PHONE_NUMBER_ID');

exports.sendTelegramAlert = onCall({ secrets: [telegramBotToken] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
  const { chatId, message } = request.data || {};
  if (!chatId || !message) throw new HttpsError('invalid-argument', 'Telegram chat ID and message are required.');
  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken.value()}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: message }) });
  if (!response.ok) throw new HttpsError('internal', 'Telegram rejected the message.');
  return { sent: true };
});

exports.sendWhatsAppAlert = onCall({ secrets: [whatsappToken, whatsappPhoneNumberId] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
  const { phone, message } = request.data || {};
  if (!phone || !message) throw new HttpsError('invalid-argument', 'WhatsApp phone and message are required.');
  const response = await fetch(`https://graph.facebook.com/v21.0/${whatsappPhoneNumberId.value()}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${whatsappToken.value()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: message } }) });
  if (!response.ok) throw new HttpsError('internal', 'WhatsApp rejected the message.');
  return { sent: true };
});

exports.archiveClaimedReports = onSchedule('every 60 minutes', async () => {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const snapshot = await db.collection('lost_found_items').where('status', '==', 'claimed').where('claimedAt', '<=', cutoff).get();
  const batch = db.batch(); snapshot.docs.forEach((item) => batch.update(item.ref, { status: 'archived', archivedAt: FieldValue.serverTimestamp() })); await batch.commit();
});

exports.matchNewReport = onDocumentCreated('lost_found_items/{itemId}', async (event) => {
  const item = event.data.data(); const words = tokens([item.name, item.description, item.category, item.location].join(' ')); if (!words.length) return;
  const opposite = item.type === 'lost' ? 'found' : 'lost'; const matches = await db.collection('lost_found_items').where('type', '==', opposite).where('status', '==', 'open').limit(50).get(); const batch = db.batch(); let count = 0;
  for (const match of matches.docs) { const candidate = match.data(); const overlap = words.filter((word) => tokens([candidate.name, candidate.description, candidate.category, candidate.location].join(' ')).includes(word)); if (overlap.length < 1 || !candidate.reportedBy || candidate.reportedBy === item.reportedBy) continue; const ref = db.collection('notifications').doc(); batch.set(ref, { recipientUid: candidate.reportedBy, kind: 'match', title: 'Possible lost & found match', body: `${item.name} matches: ${overlap.slice(0, 3).join(', ')}`, itemId: event.params.itemId, createdAt: FieldValue.serverTimestamp(), read: false }); count++; }
  if (item.reportedBy) { const ref = db.collection('notifications').doc(); batch.set(ref, { recipientUid: item.reportedBy, kind: 'report', title: 'Report published', body: `${item.name} is now live on the campus board.`, itemId: event.params.itemId, createdAt: FieldValue.serverTimestamp(), read: false }); }
  if (count || item.reportedBy) await batch.commit();
});
