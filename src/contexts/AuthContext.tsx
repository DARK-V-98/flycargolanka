
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app'; 

export type UserRole = 'user' | 'admin' | 'developer';

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
  updateUserDisplayName: (newName: string) => Promise<void>;
  updateUserRoleByEmail: (targetUserEmail: string, newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEVELOPER_EMAIL = "thimira.vishwa2003@gmail.com";
const NORMALIZED_DEVELOPER_EMAIL = DEVELOPER_EMAIL.toLowerCase();

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
        const normalizedUserEmail = firebaseUser.email ? firebaseUser.email.toLowerCase() : null;

        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data() as UserProfile;
          let effectiveRole = profileData.role;

          if (normalizedUserEmail === NORMALIZED_DEVELOPER_EMAIL) {
            effectiveRole = 'developer';
          }

          const updates: Partial<UserProfile> = {};
          let needsFirestoreUpdate = false;

          if (firebaseUser.displayName !== profileData.displayName) {
            updates.displayName = firebaseUser.displayName;
            needsFirestoreUpdate = true;
          }
          if (firebaseUser.photoURL !== profileData.photoURL) {
            updates.photoURL = firebaseUser.photoURL;
            needsFirestoreUpdate = true;
          }
          // Ensure Firestore email matches auth email (normalized for comparison)
          const firestoreEmailNormalized = profileData.email ? profileData.email.toLowerCase() : null;
          if (normalizedUserEmail && normalizedUserEmail !== firestoreEmailNormalized) {
            updates.email = firebaseUser.email; // Store original cased email from auth
            needsFirestoreUpdate = true;
          }
          
          if (profileData.role !== effectiveRole) {
            updates.role = effectiveRole;
            needsFirestoreUpdate = true;
          }

          const currentProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email, // Store original cased email
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: effectiveRole,
            createdAt: profileData.createdAt || serverTimestamp(),
          };
          
          if (needsFirestoreUpdate) {
            try {
              await updateDoc(userDocRef, updates);
              setUserProfile({ ...currentProfile, ...updates }); 
            } catch (error) {
              console.error("Error updating user profile in Firestore:", error);
              setUserProfile(currentProfile); 
            }
          } else {
            setUserProfile(currentProfile);
          }
          setRole(effectiveRole);
        } else {
          // New user, create profile in Firestore
          const determinedRole: UserRole = normalizedUserEmail === NORMALIZED_DEVELOPER_EMAIL ? 'developer' : 'user';
          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email, // Store original cased email
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: determinedRole,
            createdAt: serverTimestamp(),
          };
          try {
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
          } catch (error) {
             console.error("Error creating new user profile in Firestore:", error);
             setUserProfile({ 
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: determinedRole
             });
          }
          setRole(determinedRole);
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
      router.push('/');
      return userCredential.user;
    } catch (error) {
      console.error("Error signing up with email:", error);
      if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
        throw new Error("This email address is already registered. Please log in or use a different email.");
      }
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
      await updateProfile(user, { displayName: newName });
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { displayName: newName });
      setUserProfile(prevProfile => prevProfile ? { ...prevProfile, displayName: newName } : null);
    } catch (error) {
      console.error("Error updating display name:", error);
      throw new Error("Failed to update display name.");
    }
  };

  const updateUserRoleByEmail = async (targetUserEmail: string, newRole: UserRole) => {
    if (!user || !role) {
      throw new Error("Authentication details not loaded or user not logged in.");
    }

    if (role === 'user') {
      throw new Error("Users do not have permission to change roles.");
    }
    
    if (role === 'admin' && newRole === 'developer') {
      throw new Error("Admins cannot assign developer role.");
    }
    
    const usersRef = collection(db, "users");
    const normalizedTargetUserEmail = targetUserEmail.toLowerCase();
    const q = query(usersRef, where("email", "==", targetUserEmail)); // Firestore queries are case-sensitive, so targetUserEmail must match stored case
    
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        // Attempt case-insensitive search if direct match fails, though Firestore doesn't support it directly efficiently.
        // This is a fallback, ideally emails are stored consistently.
        const allUsersSnapshot = await getDocs(usersRef);
        let foundUserDoc: typeof querySnapshot.docs[0] | undefined;
        allUsersSnapshot.forEach(doc => {
            if(doc.data().email && doc.data().email.toLowerCase() === normalizedTargetUserEmail) {
                foundUserDoc = doc;
            }
        });

        if (!foundUserDoc) {
            throw new Error(`User with email ${targetUserEmail} not found.`);
        }
        // If found via case-insensitive search, use this document
        const batch = writeBatch(db);
        const userToUpdateRef = foundUserDoc.ref;
        const userToUpdateData = foundUserDoc.data();

        if (userToUpdateRef.id === user.uid) {
            throw new Error("Cannot change your own role through this interface.");
        }
        if (userToUpdateData.email?.toLowerCase() === NORMALIZED_DEVELOPER_EMAIL && newRole !== 'developer') {
            throw new Error(`Cannot change the role of the primary developer account (${DEVELOPER_EMAIL}) to ${newRole}.`);
        }
        batch.update(userToUpdateRef, { role: newRole });
        await batch.commit();

      } else {
        // Original logic if direct case-sensitive match found
        const batch = writeBatch(db);
        querySnapshot.forEach(userDoc => {
            if (userDoc.id === user.uid) {
                throw new Error("Cannot change your own role through this interface.");
            }
            if (userDoc.data().email?.toLowerCase() === NORMALIZED_DEVELOPER_EMAIL && newRole !== 'developer') {
                throw new Error(`Cannot change the role of the primary developer account (${DEVELOPER_EMAIL}) to ${newRole}.`);
            }
            batch.update(userDoc.ref, { role: newRole });
        });
        await batch.commit();
      }
      
    } catch (error: any) {
      console.error("Error updating user role by email:", error);
      throw error;
    }
  };


  return (
    <AuthContext.Provider value={{ user, userProfile, loading, role, signInWithGoogle, signUpWithEmail, signInWithEmail, sendPasswordReset, logout, updateUserDisplayName, updateUserRoleByEmail }}>
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

