
// This file is for server-side Firebase operations (e.g., in API routes)
// It uses the Firebase Admin SDK for elevated privileges.

import admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

// Ensure these environment variables are set in your hosting environment (e.g., Vercel, Netlify).
// They should be JSON strings.
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
let serviceAccount: admin.ServiceAccount | null = null;

if (serviceAccountString) {
  try {
    const parsedServiceAccount = JSON.parse(serviceAccountString);
    // The private_key in an environment variable often has its newlines escaped.
    // We need to replace "\\n" with "\n" for the SDK to parse the PEM key correctly.
    if (parsedServiceAccount.private_key) {
      parsedServiceAccount.private_key = parsedServiceAccount.private_key.replace(/\\n/g, '\n');
    }
    serviceAccount = parsedServiceAccount;
  } catch (e) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT JSON. Check your environment variables.", e);
  }
}


if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // This is a fallback for local development without the service account env var.
    // It won't work in production.
    console.warn(
      "Firebase Admin SDK not initialized. FIREBASE_SERVICE_ACCOUNT env var is missing or invalid. API routes using firebase-admin will fail."
    );
  }
}

const db: Firestore | null = admin.apps.length ? admin.firestore() : null;

export { db };
