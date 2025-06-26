
'use server';

import { db } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

if (!db) {
  throw new Error("Firestore Admin SDK is not initialized. Check server configuration for FIREBASE_SERVICE_ACCOUNT.");
}

const statusDocRef = db.collection('app_config').doc('site_status');

/**
 * Sets the maintenance mode for the entire application.
 * @param isDown - A boolean to set the site's maintenance status.
 */
export async function setMaintenanceMode(isDown: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real production app, you would add a robust security check here
    // to verify that the caller is a developer. For this prototype, we rely
    // on the UI being hidden as the primary security layer.
    
    await statusDocRef.set({ isDown: isDown, updatedAt: new Date() }, { merge: true });
    
    // Revalidate the root layout to ensure all pages pick up the change
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error("Error setting maintenance mode:", error);
    return { success: false, error: error.message || "Failed to update maintenance status." };
  }
}

/**
 * Retrieves the current maintenance status.
 * @returns An object with the current maintenance status.
 */
export async function getMaintenanceStatus(): Promise<{ isDown: boolean }> {
    try {
        const docSnap = await statusDocRef.get();
        if (docSnap.exists) {
            return { isDown: docSnap.data()?.isDown || false };
        }
        // If the document doesn't exist, assume the site is up.
        return { isDown: false };
    } catch (error) {
        console.error("Error getting maintenance status:", error);
        // On error, fail safe (assume site is up).
        return { isDown: false };
    }
}
