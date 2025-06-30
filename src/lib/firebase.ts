
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Added Storage

// Your new Firebase configuration, hardcoded from your details.
const firebaseConfig = {
  apiKey: "AIzaSyAqy6K5OHi9w9MDhl6fZtT3gk_XNdT_KWQ",
  authDomain: "flycargolanka-35017.firebaseapp.com",
  projectId: "flycargolanka-35017",
  storageBucket: "flycargolanka-35017.appspot.com",
  messagingSenderId: "259174581889",
  appId: "1:259174581889:web:376e007e75321e493aef80",
};

let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app); // Initialize Storage

export { app, auth, db, storage }; // Export Storage
