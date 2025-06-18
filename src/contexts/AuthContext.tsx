
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

type UserRole = 'user' | 'admin' | 'developer';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt?: any;
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
      setLoading(true); // Set loading to true at the start of auth state change
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data() as UserProfile;
          const updates: Partial<UserProfile> = {};
          let needsUpdate = false;

          // Sync displayName
          if (firebaseUser.displayName !== profileData.displayName) {
            updates.displayName = firebaseUser.displayName;
            needsUpdate = true;
          }
          // Sync photoURL
          if (firebaseUser.photoURL !== profileData.photoURL) {
            updates.photoURL = firebaseUser.photoURL;
            needsUpdate = true;
          }
          // Sync email
          if (firebaseUser.email && firebaseUser.email !== profileData.email) {
            updates.email = firebaseUser.email;
            needsUpdate = true;
          }

          if (needsUpdate) {
            try {
              await updateDoc(userDocRef, updates);
              const updatedProfile = { ...profileData, ...updates };
              setUserProfile(updatedProfile);
              setRole(updatedProfile.role);
            } catch (error) {
              console.error("Error updating user profile in Firestore:", error);
              setUserProfile(profileData); // Fallback to existing data on error
              setRole(profileData.role);
            }
          } else {
            setUserProfile(profileData);
            setRole(profileData.role);
          }
        } else {
          // New user, create profile in Firestore
          const determinedRole: UserRole = firebaseUser.email === DEVELOPER_EMAIL ? 'developer' : 'user';
          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email, // From firebaseUser, should be present
            displayName: firebaseUser.displayName, // From firebaseUser, could be null
            photoURL: firebaseUser.photoURL,       // From firebaseUser, could be null
            role: determinedRole,
            createdAt: serverTimestamp(),
          };
          try {
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
            setRole(determinedRole);
          } catch (error) {
             console.error("Error creating new user profile in Firestore:", error);
             // Set profile to a minimal state or null if creation fails
             setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: determinedRole // Or a default 'user' role
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
      // onAuthStateChanged will handle profile creation/update & navigation
      router.push('/');
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle profile creation & navigation
      router.push('/');
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing up with email:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("This email address is already registered. Please log in or use a different email.");
      }
      throw error; // Re-throw other errors
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will update user state & navigation
      router.push('/');
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in with email:", error);
       if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error("Invalid email or password. Please try again.");
      }
      throw error; // Re-throw other errors
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
    // onAuthStateChanged will clear user state
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, role, signInWithGoogle, signUpWithEmail, signInWithEmail, sendPasswordReset, logout }}>
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

