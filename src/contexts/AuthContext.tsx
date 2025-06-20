
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app'; 

export type UserRole = 'user' | 'admin' | 'developer';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  nic?: string | null;
  phone?: string | null;
  address?: string | null;
  isProfileComplete?: boolean;
  createdAt?: any;
  updatedAt?: any;
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
  updateUserExtendedProfile: (data: { nic?: string | null; phone?: string | null; address?: string | null }) => Promise<void>;
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

        let profileDataFromAuth = {
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            email: firebaseUser.email,
        };

        if (userDocSnap.exists()) {
          const profileDataFromFirestore = userDocSnap.data() as UserProfile;
          let effectiveRole = profileDataFromFirestore.role;

          if (normalizedUserEmail === NORMALIZED_DEVELOPER_EMAIL) {
            effectiveRole = 'developer';
          }

          const firestoreUpdates: Partial<UserProfile> = {};
          let needsFirestoreUpdate = false;

          if (profileDataFromAuth.displayName !== profileDataFromFirestore.displayName) {
            firestoreUpdates.displayName = profileDataFromAuth.displayName;
            needsFirestoreUpdate = true;
          }
          if (profileDataFromAuth.photoURL !== profileDataFromFirestore.photoURL) {
            firestoreUpdates.photoURL = profileDataFromAuth.photoURL;
            needsFirestoreUpdate = true;
          }
          if (profileDataFromAuth.email !== profileDataFromFirestore.email) {
             firestoreUpdates.email = profileDataFromAuth.email;
             needsFirestoreUpdate = true;
          }
          if (profileDataFromFirestore.role !== effectiveRole) {
            firestoreUpdates.role = effectiveRole;
            needsFirestoreUpdate = true;
          }

          const currentNic = profileDataFromFirestore.nic || null;
          const currentPhone = profileDataFromFirestore.phone || null;
          const currentAddress = profileDataFromFirestore.address || null;
          const isProfileComplete = !!(currentNic && currentNic.trim() !== '' &&
                                     currentPhone && currentPhone.trim() !== '' &&
                                     currentAddress && currentAddress.trim() !== '');

          if (profileDataFromFirestore.isProfileComplete !== isProfileComplete) {
            firestoreUpdates.isProfileComplete = isProfileComplete;
            needsFirestoreUpdate = true;
          }
          
          // Ensure new fields are at least initialized if not present in older documents
          if (profileDataFromFirestore.nic === undefined) firestoreUpdates.nic = null;
          if (profileDataFromFirestore.phone === undefined) firestoreUpdates.phone = null;
          if (profileDataFromFirestore.address === undefined) firestoreUpdates.address = null;


          if (needsFirestoreUpdate) {
            try {
              await updateDoc(userDocRef, {...firestoreUpdates, updatedAt: serverTimestamp()});
            } catch (error) {
              console.error("Error updating user profile in Firestore:", error);
            }
          }
          
          const updatedUserProfileState: UserProfile = {
            ...profileDataFromFirestore, // Base from Firestore
            ...profileDataFromAuth,     // Override with fresh auth data
            role: effectiveRole,        // Determined role
            isProfileComplete,          // Calculated completeness
            nic: currentNic,
            phone: currentPhone,
            address: currentAddress,
          };
          setUserProfile(updatedUserProfileState);
          setRole(effectiveRole);

        } else {
          // New user
          const determinedRoleForNewUser: UserRole = normalizedUserEmail === NORMALIZED_DEVELOPER_EMAIL ? 'developer' : 'user';
          const newUserProfileData: UserProfile = {
            uid: firebaseUser.uid,
            ...profileDataFromAuth,
            role: determinedRoleForNewUser,
            nic: null,
            phone: null,
            address: null,
            isProfileComplete: false, // New users are not complete by default
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(userDocRef, newUserProfileData);
            setUserProfile(newUserProfileData);
          } catch (error) {
             console.error("Error creating new user profile in Firestore:", error);
             setUserProfile({ ...newUserProfileData, createdAt: new Date(), updatedAt: new Date() }); // Fallback local state
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
      await updateDoc(userDocRef, { displayName: newName, updatedAt: serverTimestamp() });
      setUserProfile(prevProfile => prevProfile ? { ...prevProfile, displayName: newName, updatedAt: new Date() } : null);
    } catch (error) {
      console.error("Error updating display name:", error);
      throw new Error("Failed to update display name.");
    }
  };
  
  const updateUserExtendedProfile = async (data: { nic?: string | null; phone?: string | null; address?: string | null }) => {
    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updatesToFirestore: Partial<UserProfile> = { ...data, updatedAt: serverTimestamp() };

      const currentNic = data.nic !== undefined ? data.nic : userProfile?.nic;
      const currentPhone = data.phone !== undefined ? data.phone : userProfile?.phone;
      const currentAddress = data.address !== undefined ? data.address : userProfile?.address;
      
      const isNowComplete = !!(currentNic && currentNic.trim() !== '' &&
                               currentPhone && currentPhone.trim() !== '' &&
                               currentAddress && currentAddress.trim() !== '');
      
      updatesToFirestore.isProfileComplete = isNowComplete;

      await updateDoc(userDocRef, updatesToFirestore);
      setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        return {
          ...prevProfile,
          nic: data.nic !== undefined ? data.nic : prevProfile.nic,
          phone: data.phone !== undefined ? data.phone : prevProfile.phone,
          address: data.address !== undefined ? data.address : prevProfile.address,
          isProfileComplete: isNowComplete,
          updatedAt: new Date() 
        };
      });
    } catch (error) {
      console.error("Error updating extended profile:", error);
      throw new Error("Failed to update profile details.");
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
    const q = query(usersRef, where("email", "==", targetUserEmail)); 
    
    try {
      let userToUpdateRef: any;
      let userToUpdateData: any;
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const matchedDoc = querySnapshot.docs[0];
        userToUpdateRef = matchedDoc.ref;
        userToUpdateData = matchedDoc.data();
      } else {
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

      if (userToUpdateRef.id === user.uid) {
          throw new Error("Cannot change your own role through this interface.");
      }
      const targetEmailInFirestore = userToUpdateData.email;
      if (targetEmailInFirestore && typeof targetEmailInFirestore === 'string' && 
          targetEmailInFirestore.toLowerCase() === NORMALIZED_DEVELOPER_EMAIL && newRole !== 'developer') {
          throw new Error(`Cannot change the role of the primary developer account (${DEVELOPER_EMAIL}) to ${newRole}.`);
      }
      
      await updateDoc(userToUpdateRef, { role: newRole, updatedAt: serverTimestamp() });
      
    } catch (error: any) {
      console.error("Error updating user role by email:", error);
      throw error; 
    }
  };


  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      role, 
      signInWithGoogle, 
      signUpWithEmail, 
      signInWithEmail, 
      sendPasswordReset, 
      logout, 
      updateUserDisplayName, 
      updateUserRoleByEmail,
      updateUserExtendedProfile 
    }}>
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
