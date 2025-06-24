
// This file is for server-side Firebase operations (e.g., in API routes)
// It uses the Firebase Admin SDK for elevated privileges.

import admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

// Ensure these environment variables are set in your hosting environment (e.g., Vercel, Netlify).
// They should be JSON strings.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // This is a fallback for local development without the service account env var.
    // It won't work in production.
    console.warn(
      "Firebase Admin SDK not initialized. FIREBASE_SERVICE_ACCOUNT env var is missing. API routes using firebase-admin will fail."
    );
  }
}

const db: Firestore | null = admin.apps.length ? admin.firestore() : null;

export { db };
