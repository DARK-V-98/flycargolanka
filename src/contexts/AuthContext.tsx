
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

          if (firebaseUser.displayName !== profileData.displayName) {
            updates.displayName = firebaseUser.displayName;
            needsFirestoreUpdate = true;
          }
          if (firebaseUser.photoURL !== profileData.photoURL) {
            updates.photoURL = firebaseUser.photoURL;
            needsFirestoreUpdate = true;
          }
          if (firebaseUser.email && firebaseUser.email !== profileData.email) {
            updates.email = firebaseUser.email;
            needsFirestoreUpdate = true;
          }
          
          // Special handling for developer role based on email
          const determinedRoleBasedOnEmail = firebaseUser.email === DEVELOPER_EMAIL ? 'developer' : profileData.role;
          if (profileData.role !== determinedRoleBasedOnEmail && firebaseUser.email === DEVELOPER_EMAIL) {
             updates.role = 'developer';
             needsFirestoreUpdate = true;
          }


          const currentProfile = {
            ...profileData,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            email: firebaseUser.email,
            role: updates.role || profileData.role, // Use updated role if changed by developer email logic
          };
          
          if (needsFirestoreUpdate) {
            try {
              await updateDoc(userDocRef, updates);
              setUserProfile({ ...currentProfile, ...updates }); 
              setRole(updates.role || currentProfile.role);
            } catch (error) {
              console.error("Error updating user profile in Firestore:", error);
              setUserProfile(currentProfile); 
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
             setUserProfile({ 
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
    
    // Developer can assign any role. Admin can assign 'admin' or 'user'.
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", targetUserEmail));
    
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error(`User with email ${targetUserEmail} not found.`);
      }
      
      const batch = writeBatch(db);
      querySnapshot.forEach(userDoc => {
        // Ensure not changing own role here again, primarily for developer not accidentally demoting self via UI
        if (userDoc.id === user.uid) {
            throw new Error("Cannot change your own role through this interface.");
        }
        // Prevent developer from changing the role of THE developer account (thimira.vishwa2003@gmail.com) to non-developer
        if (userDoc.data().email === DEVELOPER_EMAIL && newRole !== 'developer') {
            throw new Error(`Cannot change the role of the primary developer account (${DEVELOPER_EMAIL}) to ${newRole}.`);
        }
        batch.update(userDoc.ref, { role: newRole });
      });
      
      await batch.commit();
    } catch (error: any) {
      console.error("Error updating user role by email:", error);
      throw error; // Re-throw the error to be caught by the calling UI
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

