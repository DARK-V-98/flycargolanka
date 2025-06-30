
import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { db } from '@/lib/firebase-admin';

// Ensure the admin app is initialized before using its services
if (!db) {
  throw new Error("Firestore Admin SDK is not initialized. Check server configuration for FIREBASE_SERVICE_ACCOUNT.");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const frontImageFile = formData.get('frontImage') as File | null;
    const backImageFile = formData.get('backImage') as File | null;
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Authorization token not provided.' }, { status: 401 });
    }

    if (!frontImageFile || !backImageFile) {
        return NextResponse.json({ error: 'Both front and back images are required.' }, { status: 400 });
    }
    
    // Verify the user token
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error("Firebase Storage bucket name is not configured in environment variables.");
    }
    const bucket = getStorage().bucket(bucketName);

    const uploadFile = async (file: File, side: 'front' | 'back'): Promise<string> => {
        const fileExtension = file.name.split('.').pop();
        const filePath = `nic_verification/${userId}/nic_${side}_${Date.now()}.${fileExtension}`;
        const blob = bucket.file(filePath);
        
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Save the file to the bucket
        await blob.save(fileBuffer, {
            metadata: {
                contentType: file.type,
            },
        });
        
        // Generate a long-lived signed URL.
        const [signedUrl] = await blob.getSignedUrl({
            action: 'read',
            // Set an expiration date far in the future, making the URL effectively permanent.
            expires: '01-01-2100',
        });

        return signedUrl;
    };

    const frontUrl = await uploadFile(frontImageFile, 'front');
    const backUrl = await uploadFile(backImageFile, 'back');
    
    return NextResponse.json({ frontUrl, backUrl }, { status: 200 });

  } catch (error: any) {
    console.error('Error in API route /api/upload-nic:', error);
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: 'Invalid or expired authentication token. Please log in again.' }, { status: 401 });
    }
    
    if (error.message && (error.message.includes('permission') || error.message.includes('iam.serviceAccountTokenCreator'))) {
        const specificError = "Server configuration error: The service account is missing the 'Service Account Token Creator' IAM role. Please add this role in the Google Cloud Console to the service account used by your application to enable file uploads.";
        return NextResponse.json({ error: specificError }, { status: 500 });
    }
    
    // Pass a more useful error message to the client for other cases.
    return NextResponse.json({ error: `Server-side upload failed: ${error.message}` }, { status: 500 });
  }
}
