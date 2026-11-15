# Campus Lost & Found — Firebase Spark-only deployment

This version uses Firebase Hosting, Firebase Authentication, and Cloud Firestore only. Firebase Storage and Cloud Functions are not used, so deployment stays on the Spark plan.

## 1. Install tools

```bash
npm install -g firebase-tools
npm install -g pnpm
firebase login
```

## 2. Firebase Console

Create or select a Firebase project. Register a Web app. Enable **Authentication** with Email/Password and Email link sign-in. Create **Cloud Firestore**. Do not create or deploy Firebase Storage.

In the project folder:

```bash
firebase use --add
pnpm install
pnpm build
firebase deploy --only hosting,firestore
```

The correct command is exactly:

```bash
firebase deploy --only hosting,firestore
```

Do not add `storage` or `functions`.

## 3. Firebase web configuration

Create a local `.env` from `.env.example` and paste the Firebase Web app values. Never commit `.env`. Then rebuild and deploy:

```bash
pnpm build
firebase deploy --only hosting,firestore
```

## 4. Spark photo upload

The report form accepts a real image file from desktop or mobile camera. The browser downsizes it to a 720px JPEG and compresses it below approximately 720 KB before saving it as a Firestore field. This avoids Firebase Storage entirely.

Use a normal phone photo. If the image is too detailed or large, the form asks the user to choose a smaller photo. Firestore has a document-size limit, so do not remove the compression guard.

## 5. Authentication

A new user must choose **Create an account** with their ID, personal Gmail, and password. An unregistered user cannot request a sign-in link. Sign-in checks the ID/Gmail pair, visual CAPTCHA, and Firebase email verification link.

Admin identity in this build:

```text
Username: Admin
Gmail: dishac890477@gmail.com
```

Register that account once, then sign in with the same values. The Admin portal shows user login activity and report audit details.

## 6. Admin portal

The admin view includes total/lost/found/resolved metrics, live user activity with name, USN, role, Gmail, and last login time, and a report audit table with reporter name, reporter USN, item, description, contact, type, status, location, date/time, filters, and CSV export.

## 7. Mobile access

Open the Firebase Hosting URL on a phone. Sign in with Gmail verification, tap **Report an item**, choose a camera photo, complete the report, and publish it. Use **Add to Home Screen** for app-like access.

## 8. Spark limitations

This version does not use Firebase Storage, Cloud Functions, server-side scheduled jobs, or custom numeric email OTP. Built-in Firebase email-link authentication, Firestore reports, compressed image fields, admin monitoring, CAPTCHA, roster names, CRUD, chat foundations, notifications, matching foundations, and Hosting work without Blaze.
