import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { getAuth, isSignInWithEmailLink, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailAndPassword, signInWithEmailLink, signOut, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, User } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";

export type ItemType = "lost" | "found";
export type ItemStatus = "open" | "claimed" | "archived";
export type UserRole = "student" | "faculty";
export type AuthUser = { uid: string; usn: string; email: string; role: UserRole; name: string };
export type CampusActivity = { uid: string; usn: string; email: string; name: string; role: UserRole; lastLoginAt?: string };

export type LostFoundItem = {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  location: string;
  address: string;
  date: string;
  time: string;
  contact: string;
  category: string;
  status: ItemStatus;
  imageUrl?: string;
  reportedBy?: string;
  reportedByUsn?: string;
  reportedByName?: string;
  claimedAt?: string;
  createdAt: string;
};

const starterItems: LostFoundItem[] = [
  { id: "demo-1", type: "lost", name: "Black leather wallet", description: "Slim wallet with a blue student ID card inside.", location: "Central Library · 1st floor", address: "Main campus, Library Road", date: "2026-09-10", time: "08:45", contact: "rhea.cse@example.com", category: "Personal", status: "open", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80", reportedByUsn: "1JS25MC002", createdAt: "2026-09-10T08:45:00.000Z" },
  { id: "demo-2", type: "found", name: "Silver water bottle", description: "Matte silver bottle with a small mountain sticker.", location: "Student Cafeteria", address: "Main campus, Student Center", date: "2026-09-11", time: "11:20", contact: "arjun.me@example.com", category: "Accessories", status: "open", imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80", reportedByUsn: "1JS25MC005", createdAt: "2026-09-11T11:20:00.000Z" },
  { id: "demo-3", type: "found", name: "Wireless earbuds case", description: "White charging case, no earbuds inside. Found near room B-204.", location: "Engineering Block · B-204", address: "Engineering Block, second floor", date: "2026-09-09", time: "15:10", contact: "meera.it@example.com", category: "Electronics", status: "claimed", imageUrl: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80", reportedByUsn: "1JS25MC011", createdAt: "2026-09-09T15:10:00.000Z" },
  { id: "demo-4", type: "lost", name: "Blue geometry pouch", description: "Navy pouch with a white zip and two mechanical pencils.", location: "Main Auditorium", address: "Academic Square, Auditorium entrance", date: "2026-09-08", time: "13:05", contact: "dev.bca@example.com", category: "Study", status: "open", imageUrl: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=900&q=80", reportedByUsn: "1JS25MC020", createdAt: "2026-09-08T13:05:00.000Z" },
  { id: "demo-5", type: "found", name: "Red campus hoodie", description: "Red hooded sweatshirt with a small white emblem on the chest.", location: "Sports Ground", address: "North campus sports complex", date: "2026-09-12", time: "17:40", contact: "kiran.mca@example.com", category: "Clothing", status: "open", imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80", reportedByUsn: "1JS25MC031", createdAt: "2026-09-12T17:40:00.000Z" },
];

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const collegeDomain = import.meta.env.VITE_COLLEGE_EMAIL_DOMAIN || "college.edu";
const localItemsKey = "campus-lost-found-items";
const localUserKey = "campus-lost-found-user";
export const ADMIN_USN = "Admin";
export const ADMIN_EMAIL = "dishac890477@gmail.com";
const rosterNames: Record<string, string> = {
  "1JS25MC001": "AKSHATHA Y C", "1JS25MC002": "ANITHA K", "1JS25MC003": "ASHISH SINGH", "1JS25MC004": "B PRIYA REDDY", "1JS25MC005": "BHAVANA P K", "1JS25MC006": "BHAVANA S", "1JS25MC007": "CHAITANYA D PATIL", "1JS25MC008": "CHANDANA BS", "1JS25MC009": "DAYANANDA H", "1JS25MC010": "DHARMARAJ S", "1JS25MC011": "DIVYA NAYANA H M", "1JS25MC012": "HEMANT S E", "1JS25MC013": "HEMANTH KUMAR HM", "1JS25MC014": "KOUSHIK S", "1JS25MC015": "KUSHAL B R", "1JS25MC016": "LOKESH R", "1JS25MC017": "MADHURA R P", "1JS25MC018": "MEGHANA T S", "1JS25MC019": "MEGHASHREE G P", "1JS25MC020": "MOHAMMED SHAIK TAHIR HUSSAIN", "1JS25MC021": "MOHAN G", "1JS25MC022": "MONIKA J", "1JS25MC023": "NANDHINI S", "1JS25MC024": "NARA VARSHINI", "1JS25MC025": "NAVYA SHREE C M", "1JS25MC026": "NIDHISHA", "1JS25MC027": "NISCHITHA R", "1JS25MC029": "NITHEESH KUMAR S", "1JS25MC030": "NITHISH BABU K P", "1JS25MC031": "OMKAR RAJENDRA GUDASE", "1JS25MC032": "PAVAN PUNITH KUMAR B", "1JS25MC033": "POOJA B", "1JS25MC034": "POOJA SHIVANAND HAPPALI", "1JS25MC035": "POOJITHA NS", "1JS25MC036": "PRAGNA PRAKASH M", "1JS25MC037": "PRARTHANA C", "1JS25MC038": "PREKSHITHA J", "1JS25MC039": "SANA TAWAKKAL SOUDAGAR", "1JS25MC040": "SANTHOSH H H", "1JS25MC041": "SHARAN", "1JS25MC042": "SHILPA T K", "1JS25MC043": "SINCHANA GANAPATI HEGDE", "1JS25MC044": "SRIGIRI AMRUTHA LAKSHMI M", "1JS25MC045": "SUCHI H M", "1JS25MC046": "SUJAL KUMAR", "1JS25MC047": "TEJASHWINI A", "1JS25MC048": "VANDHANA L", "1JS25MC049": "VIKAS V SHET", "1JS25MC050": "VINIT BADIGER", "1JS25MC051": "VITTAL T S"
};

function app() { return getApps().length ? getApps()[0] : initializeApp(firebaseConfig); }
function db() { return getFirestore(app()); }
function auth() { return getAuth(app()); }
function readLocalItems(): LostFoundItem[] { try { const saved = localStorage.getItem(localItemsKey); if (saved) return JSON.parse(saved); } catch {} localStorage.setItem(localItemsKey, JSON.stringify(starterItems)); return starterItems; }
function writeLocalItems(items: LostFoundItem[]) { localStorage.setItem(localItemsKey, JSON.stringify(items)); }
function normalizeUSN(value: string) { return value.trim().toUpperCase(); }
function validateCampusId(value: string) { const normalized = normalizeUSN(value); if (normalized === ADMIN_USN.toUpperCase()) return normalized; if (!normalized.includes("JS")) throw new Error("Your ID must contain JS for JSS Academy access, or use the authorized Admin username."); return normalized; }
function validateGmail(value: string) { const email = value.trim().toLowerCase(); if (!/^[^\s@]+@gmail\.com$/.test(email)) throw new Error("Enter the student's actual personal Gmail address ending in @gmail.com."); return email; }
function emailForUSN(usn: string) { return `${normalizeUSN(usn).toLowerCase()}@${collegeDomain}`; }
function userFromFirebase(user: User): AuthUser { const identity = user.displayName || user.email?.split("@")[0] || "student"; const parts = identity.split(":"); const maybeUsn = parts.length >= 3 ? parts[2] : parts[1]; const usn = (maybeUsn || parts[0] || "").toUpperCase(); const role = usn === ADMIN_USN.toUpperCase() ? "faculty" : rosterNames[usn] ? "student" : "faculty"; return { uid: user.uid, usn, email: user.email || "", role, name: usn === ADMIN_USN.toUpperCase() ? "Admin" : rosterNames[usn] || (parts.length >= 3 ? parts[0] : "Campus user") }; }

export function isFirebaseConfigured() { return hasFirebaseConfig; }
export function collegeEmailDomain() { return collegeDomain; }
export function getCurrentLocalUser(): AuthUser | null { try { const saved = localStorage.getItem(localUserKey); return saved ? JSON.parse(saved) : null; } catch { return null; } }

export async function beginEmailLinkSignIn(usn: string, personalEmail: string) { const normalized = validateCampusId(usn); const email = validateGmail(personalEmail); if (!hasFirebaseConfig) throw new Error("Email verification requires Firebase mode. Configure the Firebase VITE_* values before signing in securely."); const actionSettings = { url: `${window.location.origin}/`, handleCodeInApp: true }; await sendSignInLinkToEmail(auth(), email, actionSettings); localStorage.setItem("campus-signin-email", email); localStorage.setItem("campus-signin-usn", normalized); }
export function hasEmailSignInLink() { return hasFirebaseConfig && isSignInWithEmailLink(auth(), window.location.href); }
export async function completeEmailLinkSignIn() { const email = localStorage.getItem("campus-signin-email"); if (!email) throw new Error("Open the sign-in link on the same browser where you started sign-in, then enter your Gmail again if prompted."); const usn = localStorage.getItem("campus-signin-usn") || ""; const user = (await signInWithEmailLink(auth(), email, window.location.href)).user; try { await setDoc(doc(db(), "campus_users", user.uid), { uid: user.uid, name: usn === ADMIN_USN.toUpperCase() ? "Admin" : rosterNames[usn] || "Campus user", usn, email, role: usn === ADMIN_USN.toUpperCase() ? "faculty" : rosterNames[usn] ? "student" : "faculty", lastLoginAt: serverTimestamp() }, { merge: true }); } catch (profileError) { console.warn("Campus profile update was not permitted; continuing with authenticated Firebase user.", profileError); } localStorage.removeItem("campus-signin-email"); localStorage.removeItem("campus-signin-usn"); window.history.replaceState({}, document.title, window.location.origin + window.location.pathname); return { ...userFromFirebase(user), usn: usn || userFromFirebase(user).usn, name: usn === ADMIN_USN.toUpperCase() ? "Admin" : rosterNames[usn] || userFromFirebase(user).name }; }

export function subscribeAuth(onUser: (user: AuthUser | null) => void) {
  if (!hasFirebaseConfig) { onUser(getCurrentLocalUser()); return () => undefined; }
  return onAuthStateChanged(auth(), (user) => onUser(user ? userFromFirebase(user) : null));
}

export async function signInUSN(usn: string, password: string, personalEmail?: string) {
  const normalized = validateCampusId(usn);
  if (!normalized || normalized.length < 4) throw new Error("Enter a valid student or employee ID.");
  const email = validateGmail(personalEmail || "");
  if (hasFirebaseConfig) { const credential = await signInWithEmailAndPassword(auth(), email, password); const signedIn = userFromFirebase(credential.user); try { await setDoc(doc(db(), "campus_users", credential.user.uid), { uid: credential.user.uid, name: signedIn.name, usn: normalized, email, role: signedIn.role, lastLoginAt: serverTimestamp() }, { merge: true }); } catch (error) { console.warn("Could not update optional campus login activity", error); } return { ...signedIn, usn: normalized }; }
  const user = { uid: `demo-${normalized}`, usn: normalized, email, role: normalized === ADMIN_USN.toUpperCase() ? "faculty" as UserRole : rosterNames[normalized] ? "student" as UserRole : "faculty" as UserRole, name: normalized === ADMIN_USN.toUpperCase() ? "Admin" : rosterNames[normalized] || "Campus user" };
  localStorage.setItem(localUserKey, JSON.stringify(user));
  return user;
}

export async function registerUSN(usn: string, password: string, personalEmail: string) {
  const normalized = validateCampusId(usn);
  if (!normalized || normalized.length < 4) throw new Error("Enter a valid college USN.");
  if (password.length < 6) throw new Error("Use at least 6 characters for the password.");
  const email = validateGmail(personalEmail);
  if (hasFirebaseConfig) {
    const result = await createUserWithEmailAndPassword(auth(), email, password);
    await updateProfile(result.user, { displayName: `student:${normalized}` });
    const name = normalized === ADMIN_USN.toUpperCase() ? "Admin" : rosterNames[normalized] || "Campus user";
    const role = normalized === ADMIN_USN.toUpperCase() ? "faculty" : rosterNames[normalized] ? "student" : "faculty";
    await setDoc(doc(db(), "campus_users", result.user.uid), { uid: result.user.uid, name, usn: normalized, email, role, approved: true, lastLoginAt: serverTimestamp(), createdAt: serverTimestamp() });
    return { ...userFromFirebase(result.user), name, role: (rosterNames[normalized] ? "student" : "faculty") as UserRole };
  }
  const user = { uid: `demo-${normalized}`, usn: normalized, email, role: normalized === ADMIN_USN.toUpperCase() ? "faculty" as UserRole : rosterNames[normalized] ? "student" as UserRole : "faculty" as UserRole, name: normalized === ADMIN_USN.toUpperCase() ? "Admin" : rosterNames[normalized] || "Campus user" };
  localStorage.setItem(localUserKey, JSON.stringify(user));
  return user;
}

export async function sendPasswordResetUSN(usn: string, personalEmail: string) {
  const normalized = validateCampusId(usn);
  const email = validateGmail(personalEmail);
  if (hasFirebaseConfig) { await sendPasswordResetEmail(auth(), email); return; }
  throw new Error(`Email reset is unavailable because this deployment is in Demo mode. Add the Firebase VITE_* configuration and enable Email/Password Authentication to send a real reset link to ${email}.`);
}

export async function signOutUser() { if (hasFirebaseConfig) await signOut(auth()); localStorage.removeItem(localUserKey); }

export function subscribeItems(onItems: (items: LostFoundItem[]) => void, onMode: (mode: "firebase" | "demo") => void) {
  if (!hasFirebaseConfig) { onMode("demo"); onItems(readLocalItems()); return () => undefined; }
  try {
    const itemsQuery = query(collection(db(), "lost_found_items"), orderBy("createdAt", "desc"));
    return onSnapshot(itemsQuery, (snapshot) => {
      onMode("firebase");
      onItems(snapshot.docs.map((snapshotDoc) => { const data = snapshotDoc.data(); const createdAt = data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(); const claimedAt = data.claimedAt?.toDate?.()?.toISOString?.() ?? data.claimedAt ?? ""; const expired = data.status === "claimed" && claimedAt && Date.now() - new Date(claimedAt).getTime() >= 48 * 60 * 60 * 1000; return { id: snapshotDoc.id, type: data.type ?? "lost", name: data.name ?? "Untitled item", description: data.description ?? "", location: data.location ?? "", address: data.address ?? "", date: data.date ?? createdAt.slice(0, 10), time: data.time ?? "", contact: data.contact ?? "", category: data.category ?? "Other", status: expired ? "archived" : data.status ?? "open", imageUrl: data.imageUrl ?? "", reportedBy: data.reportedBy ?? "", reportedByUsn: data.reportedByUsn ?? "", reportedByName: data.reportedByName ?? rosterNames[data.reportedByUsn ?? ""] ?? "", claimedAt, createdAt } as LostFoundItem; }));
    }, () => { onMode("demo"); onItems(readLocalItems()); });
  } catch { onMode("demo"); onItems(readLocalItems()); return () => undefined; }
}

export function subscribeCampusUsers(onUsers: (users: CampusActivity[]) => void) {
  if (!hasFirebaseConfig) { onUsers([]); return () => undefined; }
  return onSnapshot(collection(db(), "campus_users"), (snapshot) => onUsers(snapshot.docs.map((entry) => { const data = entry.data(); return { uid: entry.id, usn: data.usn || "", email: data.email || "", name: data.name || "Campus user", role: data.role === "faculty" ? "faculty" : "student", lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString?.() || "" }; })));
}

export async function createItem(item: Omit<LostFoundItem, "id" | "createdAt">, user?: AuthUser | null) {
  const imageUrl = item.imageUrl || "";
  if (hasFirebaseConfig) { await addDoc(collection(db(), "lost_found_items"), { ...item, imageUrl, reportedBy: user?.uid || "", reportedByUsn: user?.usn || "", reportedByName: user?.name || "", createdAt: serverTimestamp() }); return; }
  writeLocalItems([{ ...item, imageUrl, reportedBy: user?.uid, id: `local-${Date.now()}`, createdAt: new Date().toISOString() }, ...readLocalItems()]);
}

export async function seedDemoReports(user: AuthUser) {
  if (!hasFirebaseConfig) { writeLocalItems(starterItems); return starterItems.length; }
  for (const item of starterItems) {
    const { id: _demoId, createdAt: _demoCreatedAt, ...report } = item;
    await addDoc(collection(db(), "lost_found_items"), { ...report, reportedBy: user.uid, reportedByUsn: item.reportedByUsn || user.usn, reportedByName: rosterNames[item.reportedByUsn || ""] || user.name, createdAt: serverTimestamp() });
  }
  return starterItems.length;
}

export async function updateItemStatus(id: string, status: ItemStatus) { const changes = status === "claimed" ? { status, claimedAt: new Date().toISOString() } : { status, claimedAt: "" }; if (hasFirebaseConfig) { await updateDoc(doc(db(), "lost_found_items", id), changes); return; } writeLocalItems(readLocalItems().map((item) => item.id === id ? { ...item, ...changes } : item)); }
export async function updateItem(id: string, changes: Partial<Omit<LostFoundItem, "id" | "createdAt">>) { if (hasFirebaseConfig) { await updateDoc(doc(db(), "lost_found_items", id), changes); return; } writeLocalItems(readLocalItems().map((item) => item.id === id ? { ...item, ...changes } : item)); }
export async function deleteItem(id: string) { if (hasFirebaseConfig) { await deleteDoc(doc(db(), "lost_found_items", id)); return; } writeLocalItems(readLocalItems().filter((item) => item.id !== id)); }
