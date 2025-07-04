
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, Suspense, useRef } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, writeBatch, onSnapshot, orderBy, type Timestamp, deleteDoc } from 'firebase/firestore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import Link from 'next/link';
import { type Route } from 'next';


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

export interface AppNotification {
  id: string;
  type: 'new_booking' | 'nic_verification' | 'tracking_update';
  message: string;
  link: string;
  isRead: boolean;
  createdAt: Timestamp;
  userId?: string;
  recipient?: 'admins';
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
  notifications: AppNotification[];
  removeNotification: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEVELOPER_EMAIL = "thimira.vishwa2003@gmail.com";
const NORMALIZED_DEVELOPER_EMAIL = DEVELOPER_EMAIL.toLowerCase();

function AuthRedirectHandler({ user, loading }: { user: FirebaseUser | null; loading: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (!loading && user) {
      // If a redirect URL is specified (e.g., from being sent to login from a protected page)
      if (redirect) {
        router.push(redirect);
      } 
      // If user is on the auth page (meaning they just logged in/signed up directly)
      else if (pathname === '/auth') {
        router.push('/');
      }
    }
  }, [user, loading, redirect, router, pathname]);

  return null;
}

const getNotificationTitle = (type: AppNotification['type']): string => {
    switch (type) {
        case 'new_booking': return 'New Booking Received';
        case 'nic_verification': return 'New NIC Verification';
        case 'tracking_update': return 'Tracking Number Updated';
        default: return 'New Notification';
    }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { toast } = useToast();
  const notifiedIdsRef = useRef(new Set<string>());
  
  const profileUnsubscribe = useRef<(() => void) | null>(null);
  const notificationsUnsubscribe = useRef<(() => void) | null>(null);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Unsubscribe from any existing profile listener before proceeding.
      if (profileUnsubscribe.current) {
        profileUnsubscribe.current();
        profileUnsubscribe.current = null;
      }
       if (notificationsUnsubscribe.current) {
        notificationsUnsubscribe.current();
        notificationsUnsubscribe.current = null;
      }
      
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        profileUnsubscribe.current = onSnapshot(userDocRef, (userDocSnap) => {
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

            const currentNic = profileDataFromFirestore.nic || null;
            const currentPhone = profileDataFromFirestore.phone || null;
            const currentAddress = profileDataFromFirestore.address || null;
            const isProfileComplete = !!(currentNic && currentNic.trim() !== '' &&
                                       currentPhone && currentPhone.trim() !== '' &&
                                       currentAddress && currentAddress.trim() !== '');

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
            setLoading(false);
          } else {
            // New user - create profile
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
            setDoc(userDocRef, newUserProfileData).then(() => {
              setUserProfile(newUserProfileData);
              setRole(determinedRoleForNewUser);
              setLoading(false);
            }).catch(error => {
              console.error("Error creating new user profile in Firestore:", error);
              setLoading(false);
            });
          }
        }, (error) => {
          console.error("Error on user profile snapshot:", error);
          toast({
            title: "Profile Access Error",
            description: "Could not fetch your profile due to a permissions issue. This can sometimes happen with new accounts. Please refresh.",
            variant: "destructive",
            duration: 10000,
          });
          setUser(null);
          setUserProfile(null);
          setRole(null);
          setLoading(false);
        });

      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        if (profileUnsubscribe.current) {
            profileUnsubscribe.current();
        }
        if (notificationsUnsubscribe.current) {
            notificationsUnsubscribe.current();
        }
    };
  }, [toast]);

  // Effect for listening to notifications
  useEffect(() => {
     if (notificationsUnsubscribe.current) {
        notificationsUnsubscribe.current();
        notificationsUnsubscribe.current = null;
    }

    if (!user || !role) {
      setNotifications([]);
      if(notifiedIdsRef.current.size > 0) notifiedIdsRef.current.clear();
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    let q;

    if (role === 'admin' || role === 'developer') {
        q = query(notificationsRef, where('recipient', '==', 'admins'), where('isRead', '==', false), orderBy('createdAt', 'desc'));
    } else { // 'user' role
        q = query(notificationsRef, where('userId', '==', user.uid), where('isRead', '==', false), orderBy('createdAt', 'desc'));
    }

    notificationsUnsubscribe.current = onSnapshot(q, (snapshot) => {
      const unreadNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));

      // For any new notification that we haven't shown a toast for, show one.
      unreadNotifications.forEach(n => {
        if (!notifiedIdsRef.current.has(n.id)) {
          toast({
            title: getNotificationTitle(n.type),
            description: n.message,
            action: (
              <ToastAction altText="View" asChild>
                <Link href={n.link as Route}>View</Link>
              </ToastAction>
            ),
            duration: 15000,
          });
          notifiedIdsRef.current.add(n.id);
        }
      });
      setNotifications(unreadNotifications);
    }, (error) => {
        console.error("Firestore snapshot error on notifications:", error);
    });

    return () => {
        if (notificationsUnsubscribe.current) {
            notificationsUnsubscribe.current();
        }
    };
  }, [user, role, toast]);


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
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
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in with email:", error);
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error("Login failed. The email or password you entered is incorrect. Please try again.");
      }
      throw new Error("An unexpected error occurred during login. Please try again later.");
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
    setNotifications([]);
    notifiedIdsRef.current.clear();
    router.push('/');
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "default",
    });
  };

  const updateUserDisplayName = async (newName: string) => {
    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }
    try {
      await updateProfile(user, { displayName: newName });
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { displayName: newName, updatedAt: serverTimestamp() });
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

      updatesToFirestore.isProfileComplete = !!(currentNic && currentNic.trim() !== '' &&
                               currentPhone && currentPhone.trim() !== '' &&
                               currentAddress && currentAddress.trim() !== '');

      await updateDoc(userDocRef, updatesToFirestore);
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

  const removeNotification = async (id: string) => {
    const notificationRef = doc(db, 'notifications', id);
    try {
        await deleteDoc(notificationRef);
    } catch (error) {
        console.error("Error removing notification:", error);
        toast({
            title: "Error",
            description: "Could not remove notification.",
            variant: "destructive"
        })
    }
  };

  const value = {
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
      updateUserExtendedProfile,
      notifications,
      removeNotification
    };
    
    return (
      <AuthContext.Provider value={value}>
        <Suspense>
            <AuthRedirectHandler user={user} loading={loading}/>
        </Suspense>
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
