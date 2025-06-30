
'use server';

import { getStorage } from 'firebase-admin/storage';
import { db } from '@/lib/firebase-admin';

// This Server Action securely generates a temporary signed URL for a file path.
export async function getSignedUrlForNicImage(filePath: string): Promise<string> {
    // Moved initialization checks inside the handler to prevent build-time errors.
    if (!db) {
        throw new Error("Firebase Admin SDK not initialized on the server. Check server environment variables.");
    }
    
    if (!filePath) {
        throw new Error("File path is required.");
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error("Firebase Storage bucket name is not configured in environment variables.");
    }
    const bucket = getStorage().bucket(bucketName);
    
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
        // This is a likely error if the service account is missing the "Service Account Token Creator" role.
        if (error.code === 'GaxiosError' && error.message.includes('iam.serviceAccountCredentials.generateAccessToken')) {
             throw new Error("Server configuration error: The service account is missing the 'Service Account Token Creator' role. Please add it in Google Cloud IAM.");
        }
        throw new Error("Could not generate a secure link to view the image.");
    }
}
