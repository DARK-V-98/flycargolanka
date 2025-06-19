
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
          const profileDataFromFirestore = userDocSnap.data() as UserProfile;
          let effectiveRole = profileDataFromFirestore.role; // Start with Firestore role

          // Developer override: if email matches, role IS 'developer'
          if (normalizedUserEmail === NORMALIZED_DEVELOPER_EMAIL) {
            effectiveRole = 'developer';
          }

          const firestoreUpdates: Partial<UserProfile> = {};
          let needsFirestoreUpdate = false;

          // Sync displayName from auth to Firestore if different
          if (firebaseUser.displayName !== profileDataFromFirestore.displayName) {
            firestoreUpdates.displayName = firebaseUser.displayName;
            needsFirestoreUpdate = true;
          }
          // Sync photoURL from auth to Firestore if different
          if (firebaseUser.photoURL !== profileDataFromFirestore.photoURL) {
            firestoreUpdates.photoURL = firebaseUser.photoURL;
            needsFirestoreUpdate = true;
          }
          // Sync email from auth to Firestore if different
          // Store original cased email from auth
          if (firebaseUser.email !== profileDataFromFirestore.email) {
             firestoreUpdates.email = firebaseUser.email; // Use actual email from auth
             needsFirestoreUpdate = true;
          }
          
          // Sync determined effectiveRole to Firestore if different
          if (profileDataFromFirestore.role !== effectiveRole) {
            firestoreUpdates.role = effectiveRole;
            needsFirestoreUpdate = true;
          }

          if (needsFirestoreUpdate) {
            try {
              await updateDoc(userDocRef, firestoreUpdates);
            } catch (error) {
              console.error("Error updating user profile in Firestore:", error);
              // Continue with local state update even if Firestore fails, using best available info
            }
          }
          
          // Profile to set in React state (reflects auth info + effectiveRole)
          const updatedUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email, // from auth
            displayName: firebaseUser.displayName, // from auth
            photoURL: firebaseUser.photoURL, // from auth
            role: effectiveRole, // the determined role
            createdAt: profileDataFromFirestore.createdAt || serverTimestamp(),
          };
          setUserProfile(updatedUserProfile);
          setRole(effectiveRole);

        } else {
          // New user: create profile in Firestore
          const determinedRoleForNewUser: UserRole = normalizedUserEmail === NORMALIZED_DEVELOPER_EMAIL ? 'developer' : 'user';
          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email, // from auth
            displayName: firebaseUser.displayName, // from auth
            photoURL: firebaseUser.photoURL, // from auth
            role: determinedRoleForNewUser,
            createdAt: serverTimestamp(),
          };
          try {
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
          } catch (error) {
             console.error("Error creating new user profile in Firestore:", error);
             // Fallback profile data for local state if Firestore setDoc fails
             setUserProfile({ 
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: determinedRoleForNewUser 
             });
          }
          setRole(determinedRoleForNewUser);
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
    // Firestore queries are case-sensitive. For robust email matching, consider storing emails in a consistent case (e.g., lowercase).
    // For this implementation, we'll query for the exact email first, then attempt a case-insensitive scan if needed.
    const q = query(usersRef, where("email", "==", targetUserEmail)); 
    
    try {
      let userToUpdateRef: any;
      let userToUpdateData: any;
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Found user(s) with case-sensitive email match
        const matchedDoc = querySnapshot.docs[0]; // Assuming email is unique
        userToUpdateRef = matchedDoc.ref;
        userToUpdateData = matchedDoc.data();
      } else {
        // Fallback: Case-insensitive search if direct match fails
        // This can be less performant on large datasets.
        const allUsersSnapshot = await getDocs(usersRef);
        let foundUserDoc: typeof querySnapshot.docs[0] | undefined;
        allUsersSnapshot.forEach(doc => {
            const docEmail = doc.data().email;
            if(docEmail && typeof docEmail === 'string' && docEmail.toLowerCase() === normalizedTargetUserEmail) {
                foundUserDoc = doc;
            }
        });

        if (!foundUserDoc) {
            throw new Error(`User with email ${targetUserEmail} not found.`);
        }
        userToUpdateRef = foundUserDoc.ref;
        userToUpdateData = foundUserDoc.data();
      }

      // Perform checks on the identified user
      if (userToUpdateRef.id === user.uid) {
          throw new Error("Cannot change your own role through this interface.");
      }
      // Check if the user being updated is the primary developer
      const targetEmailInFirestore = userToUpdateData.email;
      if (targetEmailInFirestore && typeof targetEmailInFirestore === 'string' && 
          targetEmailInFirestore.toLowerCase() === NORMALIZED_DEVELOPER_EMAIL && newRole !== 'developer') {
          throw new Error(`Cannot change the role of the primary developer account (${DEVELOPER_EMAIL}) to ${newRole}.`);
      }
      
      // Proceed with update
      await updateDoc(userToUpdateRef, { role: newRole });
      
    } catch (error: any) {
      console.error("Error updating user role by email:", error);
      throw error; // Re-throw to be caught by the calling component
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


    