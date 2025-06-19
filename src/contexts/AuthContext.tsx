
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app'; // Import FirebaseError

type UserRole = 'user' | 'admin' | 'developer';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt?: any;
  // Add other profile fields as needed
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: UserRole | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserDisplayName: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEVELOPER_EMAIL = "thimira.vishwa2003@gmail.com";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data() as UserProfile;
          const updates: Partial<UserProfile> = {};
          let needsFirestoreUpdate = false;

          // Sync displayName from Auth to Firestore if different or Firestore is null
          if (firebaseUser.displayName !== profileData.displayName) {
            updates.displayName = firebaseUser.displayName;
            needsFirestoreUpdate = true;
          }
          // Sync photoURL from Auth to Firestore if different or Firestore is null
          if (firebaseUser.photoURL !== profileData.photoURL) {
            updates.photoURL = firebaseUser.photoURL;
            needsFirestoreUpdate = true;
          }
          // Sync email from Auth to Firestore if different (should rarely happen but good to check)
          if (firebaseUser.email && firebaseUser.email !== profileData.email) {
            updates.email = firebaseUser.email;
            needsFirestoreUpdate = true;
          }

          const currentProfile = {
            ...profileData,
            // Ensure local state reflects Firebase Auth first, then apply Firestore updates
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            email: firebaseUser.email,
          };
          
          if (needsFirestoreUpdate) {
            try {
              await updateDoc(userDocRef, updates);
              setUserProfile({ ...currentProfile, ...updates }); // Reflect Firestore updates
              setRole(currentProfile.role); // Role comes from Firestore
            } catch (error) {
              console.error("Error updating user profile in Firestore:", error);
              setUserProfile(currentProfile); // Fallback to current (Auth-synced) data
              setRole(currentProfile.role);
            }
          } else {
            setUserProfile(currentProfile);
            setRole(currentProfile.role);
          }
        } else {
          // New user, create profile in Firestore
          const determinedRole: UserRole = firebaseUser.email === DEVELOPER_EMAIL ? 'developer' : 'user';
          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: determinedRole,
            createdAt: serverTimestamp(),
          };
          try {
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
            setRole(determinedRole);
          } catch (error) {
             console.error("Error creating new user profile in Firestore:", error);
             setUserProfile({ // Minimal profile on error
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: determinedRole
             });
             setRole(determinedRole);
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle profile creation. We can also update the profile immediately here.
      // For new email sign-ups, displayName and photoURL will be null initially from Firebase Auth.
      // We can set a default displayName if desired, e.g., based on email.
      // For now, it will be null, and the user can update it on the profile page.
      router.push('/');
      return userCredential.user;
    } catch (error) {
      console.error("Error signing up with email:", error);
      if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
        throw new Error("This email address is already registered. Please log in or use a different email.");
      }
      // For other errors, or if it's not a FirebaseError with the specific code, re-throw the original error.
      // This helps in debugging if the error structure is unexpected.
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in with email:", error);
       if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error("Invalid email or password. Please try again.");
      }
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    router.push('/');
  };

  const updateUserDisplayName = async (newName: string) => {
    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: newName });

      // Update Firestore profile
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { displayName: newName });

      // Update local state
      setUserProfile(prevProfile => prevProfile ? { ...prevProfile, displayName: newName } : null);
      // Also update the user object itself if necessary for immediate reflection, though onAuthStateChanged might handle this.
      // For direct update of user:
      // setUser(prevUser => prevUser ? { ...prevUser, displayName: newName } as FirebaseUser : null);

    } catch (error) {
      console.error("Error updating display name:", error);
      throw new Error("Failed to update display name.");
    }
  };


  return (
    <AuthContext.Provider value={{ user, userProfile, loading, role, signInWithGoogle, signUpWithEmail, signInWithEmail, sendPasswordReset, logout, updateUserDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

