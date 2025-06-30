
'use server';

import { getStorage } from 'firebase-admin/storage';

// Ensure the admin app is initialized in firebase-admin.ts
const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

// This Server Action securely generates a temporary signed URL for a file path.
export async function getSignedUrlForNicImage(filePath: string): Promise<string> {
    if (!filePath) {
        throw new Error("File path is required.");
    }
    
    // Set the expiration for the URL to 15 minutes from now.
    const options = {
        version: 'v4' as 'v4',
        action: 'read' as 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    try {
        const [url] = await bucket.file(filePath).getSignedUrl(options);
        return url;
    } catch (error: any) {
        console.error(`Failed to get signed URL for ${filePath}:`, error);
        // Provide a more specific error message if the object doesn't exist.
        if (error.code === 404) {
             throw new Error("The requested image does not exist in storage.");
        }
        throw new Error("Could not generate a secure link to view the image.");
    }
}
