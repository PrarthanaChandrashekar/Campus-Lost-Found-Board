# Firebase Spark-only setup

This project uses Firebase Hosting, Firebase Authentication, and Cloud Firestore only. It does not use Firebase Storage, Cloud Functions, or a Blaze plan.

## Firebase Console

1. Create or select a Firebase project.
2. Register a Web app and copy the Web configuration.
3. Enable Authentication providers **Email/Password** and **Email link**.
4. Create a Cloud Firestore database.
5. Do not initialize Firebase Storage.

## Deploy

Create a local `.env` from `.env.example`, paste the Firebase Web values, and keep `.env` private. From the project root run:

```bash
npm install -g firebase-tools
npm install -g pnpm
firebase login
firebase use --add
pnpm install
pnpm build
firebase deploy --only hosting,firestore
```

Never use `firebase deploy --only hosting,firestore,storage`. Storage is intentionally absent from `firebase.json`.

## Authentication

New users select **Create an account** and enter their ID, personal Gmail, and password. An unregistered user cannot request a sign-in link. Sign-in checks the registered ID/Gmail pair, visual CAPTCHA, and Firebase email verification link.

Admin identity:

```text
Username: Admin
Gmail: dishac890477@gmail.com
```

Register it once, then sign in with the same values. The Admin button appears after verification.

## Real image upload without Firebase Storage

The report form accepts a real image file from desktop or mobile camera. The browser resizes it to a maximum 720px dimension and compresses it below approximately 720 KB before saving it as an image data URL inside the Firestore report document. The Firestore rules reject oversized image fields.

If an image is too large or detailed, select a smaller photo. This is a Spark-compatible workaround for a classroom project; Firestore document-size limits still apply.

## Dashboard welcome

After login, the roster name appears in 36px above **Find what you’re looking for**. The lower status line only says: **Only verified campus users can submit reports.**

## Admin portal

The Admin portal includes metrics, live user activity with name, USN, role, Gmail, and last login time, and a report audit table with reporter name, reporter USN, item, description, contact, type, status, location, date/time, filters, and CSV export.

## Mobile access

Open the Firebase Hosting URL on a phone. Sign in with Gmail verification, tap **Report an item**, choose a camera image, complete the report, and publish it. Use **Add to Home Screen** for app-like access.

## Spark limitations

This Spark build does not include Firebase Storage, Cloud Functions, server-side scheduled jobs, custom numeric email OTP, WhatsApp bots, or Telegram bots. Firebase email-link authentication, Firestore reports, compressed image-file uploads, admin monitoring, CAPTCHA, roster names, CRUD, notifications, chat foundations, matching foundations, and Hosting work without Blaze.
