
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, writeBatch, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';

export type UserRole = 'user' | 'admin' | 'developer';
export type NicVerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

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
  nicFrontUrl?: string | null;
  nicBackUrl?: string | null;
  nicVerificationStatus?: NicVerificationStatus;
  createdAt?: any;
  updatedAt?: any;
}

interface MaintenanceStatus {
  isDown: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: UserRole | null;
  maintenanceStatus: MaintenanceStatus | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserDisplayName: (newName: string) => Promise<void>;
  updateUserRoleByEmail: (targetUserEmail: string, newRole: UserRole) => Promise<void>;
  updateUserExtendedProfile: (data: { nic?: string | null; phone?: string | null; address?: string | null }) => Promise<void>;
  updateNicVerificationDetails: (details: { nicFrontUrl?: string; nicBackUrl?: string; nicVerificationStatus: NicVerificationStatus }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEVELOPER_EMAIL = "thimira.vishwa2003@gmail.com";
const NORMALIZED_DEVELOPER_EMAIL = DEVELOPER_EMAIL.toLowerCase();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
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

          if (profileDataFromFirestore.nicFrontUrl === undefined) firestoreUpdates.nicFrontUrl = null;
          if (profileDataFromFirestore.nicBackUrl === undefined) firestoreUpdates.nicBackUrl = null;
          if (profileDataFromFirestore.nicVerificationStatus === undefined) firestoreUpdates.nicVerificationStatus = 'none';


          if (needsFirestoreUpdate) {
            try {
              await updateDoc(userDocRef, {...firestoreUpdates, updatedAt: serverTimestamp()});
            } catch (error) {
              console.error("Error updating user profile in Firestore:", error);
            }
          }

          const updatedUserProfileState: UserProfile = {
            ...profileDataFromFirestore,
            ...profileDataFromAuth,
            role: effectiveRole,
            isProfileComplete,
            nic: currentNic,
            phone: currentPhone,
            address: currentAddress,
            nicFrontUrl: profileDataFromFirestore.nicFrontUrl || null,
            nicBackUrl: profileDataFromFirestore.nicBackUrl || null,
            nicVerificationStatus: profileDataFromFirestore.nicVerificationStatus || 'none',
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
            isProfileComplete: false,
            nicFrontUrl: null,
            nicBackUrl: null,
            nicVerificationStatus: 'none',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(userDocRef, newUserProfileData);
            setUserProfile(newUserProfileData);
          } catch (error) {
             console.error("Error creating new user profile in Firestore:", error);
             setUserProfile({ ...newUserProfileData, createdAt: new Date(), updatedAt: new Date() });
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

    // Listen for maintenance mode changes
    const statusDocRef = doc(db, 'app_config', 'site_status');
    const unsubscribeStatus = onSnapshot(statusDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setMaintenanceStatus({ isDown: docSnap.data().isDown || false });
        } else {
            // If doc doesn't exist, site is not in maintenance
            setMaintenanceStatus({ isDown: false });
        }
    }, (error) => {
        console.error("Error listening to maintenance status:", error);
        // Fail safe: assume site is up
        setMaintenanceStatus({ isDown: false });
    });


    return () => {
        unsubscribeAuth();
        unsubscribeStatus();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
       if (error instanceof FirebaseError && error.code === 'auth/account-exists-with-different-credential') {
        throw new Error("An account with this email already exists. Please sign in with your password to link your Google account.");
      }
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

  const updateNicVerificationDetails = async (details: { nicFrontUrl?: string; nicBackUrl?: string; nicVerificationStatus: NicVerificationStatus }) => {
    if (!user) {
      throw new Error("You must be logged in to update NIC verification details.");
    }
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updates: Partial<UserProfile> = {
        nicVerificationStatus: details.nicVerificationStatus,
        updatedAt: serverTimestamp(),
      };
      if (details.nicFrontUrl) updates.nicFrontUrl = details.nicFrontUrl;
      if (details.nicBackUrl) updates.nicBackUrl = details.nicBackUrl;

      await updateDoc(userDocRef, updates);
      setUserProfile(prevProfile => prevProfile ? { ...prevProfile, ...updates, updatedAt: new Date() } : null);
    } catch (error) {
      console.error("Error updating NIC verification details:", error);
      throw new Error("Failed to update NIC verification details.");
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
      maintenanceStatus,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      sendPasswordReset,
      logout,
      updateUserDisplayName,
      updateUserRoleByEmail,
      updateUserExtendedProfile,
      updateNicVerificationDetails
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
