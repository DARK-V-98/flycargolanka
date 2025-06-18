
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase configuration will now be primarily sourced from environment variables
// Ensure these are prefixed with NEXT_PUBLIC_ to be available client-side
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;

// Check if all required Firebase config values are present
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.warn(
    `Firebase configuration is missing the following keys from environment variables: ${missingKeys.join(', ')}. 
    Please ensure they are set in your .env.local file (e.g., NEXT_PUBLIC_FIREBASE_API_KEY). 
    Using placeholder values for now, but Firebase will likely not function correctly.`
  );
  // Provide default placeholder values if any are missing to prevent crashing,
  // though Firebase will not initialize correctly.
  missingKeys.forEach(key => {
    (firebaseConfig as any)[key] = `YOUR_MISSING_${key.toUpperCase()}`;
  });
}


if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
