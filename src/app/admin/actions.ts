
'use server';

import { getStorage } from 'firebase-admin/storage';
import { db } from '@/lib/firebase-admin';

if (!db) {
  throw new Error("Firestore Admin SDK is not initialized. Check server configuration for FIREBASE_SERVICE_ACCOUNT.");
}

export async function getSignedUrlForNicImage(filePath: string): Promise<string> {
  if (!filePath) {
    throw new Error('File path is required.');
  }

  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error("Firebase Storage bucket name is not configured.");
    }
    const bucket = getStorage().bucket(bucketName);
    const file = bucket.file(filePath);

    // Generate a signed URL that expires in 15 minutes.
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return url;
  } catch (error: any) {
    console.error(`Failed to get signed URL for ${filePath}:`, error);
    // It's better to throw so the client knows it failed, rather than returning an empty string
    throw new Error(`Could not generate viewable link for the image. Error: ${error.message}`);
  }
}
