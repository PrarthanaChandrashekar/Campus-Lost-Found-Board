Campus Lost-and-Found Board

A cloud-based Lost-and-Found Board developed for JSS Academy students, faculty, staff, and campus support personnel.

Project Description

This project provides a centralized platform where campus users can report lost or found items. Users can add item details, location, date, time, contact information, and a compressed image. Other users can search the reports and contact the reporter.

The Admin can monitor reports, view reporter details, communicate with users, and mark reports as resolved.

Features

•
USN or campus-ID-based login

•
Gmail verification using Firebase Authentication

•
Visual CAPTCHA

•
Roster-based student name display

•
Report lost items

•
Report found items

•
Upload compressed item images

•
Search by item or location

•
Real-time Firestore updates

•
Admin monitoring dashboard

•
User login activity monitoring

•
Report status management

•
Admin-only Mark Resolved feature

•
Admin and user communication

•
CSV export

•
Mobile-responsive design

Technologies Used

•
React

•
TypeScript

•
Vite

•
Tailwind CSS

•
Firebase Authentication

•
Cloud Firestore

•
Firebase Hosting

•
JavaScript

•
HTML

•
CSS

Firebase Spark Plan

This project is designed for the Firebase Spark free plan.

It uses Firebase Authentication, Cloud Firestore, Firebase Hosting, and browser-side image compression. Firebase Storage and Cloud Functions are not required for the basic deployment.

Run Locally

Install dependencies:

Bash


pnpm install



Start the development server:

Bash


pnpm dev



Open the local URL shown in the terminal.

Firebase Deployment

Install Firebase CLI:

Bash


npm install -g firebase-tools



Log in to Firebase:

Bash


firebase login



Connect the project to Firebase:

Bash


firebase use --add



Build the project:

Bash


pnpm build



Deploy to Firebase:

Bash


firebase deploy --only hosting,firestore



Mobile Access

Open the Firebase Hosting URL on a mobile browser. Users can sign in, search for reports, submit lost or found items, and upload images from the phone camera or gallery.

The website can also be added to the mobile home screen using the browser's Add to Home Screen option.

Image Upload

The application supports actual image-file uploads. Images are resized and compressed in the browser before being saved with the Firestore report.

Admin Portal

The Admin can view reports, monitor reporter details and login activity, communicate with report owners, mark reports as resolved, and export report data as CSV.

Real-Time Synchronization

Cloud Firestore listeners allow reports and dashboard information to update without a complete page refresh.

Security Notes

•
Do not upload .env files to GitHub.

•
Do not upload passwords or private keys.

•
Do not upload node_modules.

•
Do not upload the dist folder.

•
Review Firestore security rules before production use.

•
Replace demonstration Admin credentials before real deployment.

Upload README to GitHub

If the project is already uploaded to GitHub, run these commands in the VS Code terminal:

Bash


git add README.md
git commit -m "Add project README"
git push origin main



If GitHub asks you to set the upstream branch, run:

Bash


git push -u origin main


Project Purpose

The purpose of this project is to provide a secure, searchable, and cloud-based platform for managing lost and found objects within a college campus.

License

This project is developed for academic and educational purposes.

