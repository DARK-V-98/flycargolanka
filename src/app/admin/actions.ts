
'use server';

import { db } from '@/lib/firebase-admin';

if (!db) {
  throw new Error("Firestore Admin SDK is not initialized. Check server configuration for FIREBASE_SERVICE_ACCOUNT.");
}
