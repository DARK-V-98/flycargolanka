
import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { db } from '@/lib/firebase-admin';
import { serverTimestamp } from 'firebase-admin/firestore';

// Ensure the admin app is initialized before using its services
if (!db) {
  throw new Error("Firestore Admin SDK is not initialized. Check server configuration for FIREBASE_SERVICE_ACCOUNT.");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const frontImageFile = formData.get('frontImage') as File | null;
    const backImageFile = formData.get('backImage') as File | null;
    const nic = formData.get('nic') as string | null;
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Authorization token not provided.' }, { status: 401 });
    }

    if (!frontImageFile || !backImageFile || !nic) {
        return NextResponse.json({ error: 'Front image, back image, and NIC number are required.' }, { status: 400 });
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
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const filePath = `nic_verification/${userId}/nic_${side}_${Date.now()}.${fileExtension}`;
        const blob = bucket.file(filePath);
        
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Save the file to the bucket
        await blob.save(fileBuffer, {
            metadata: {
                contentType: file.type,
            },
        });
        
        // Return the file path, not a public URL
        return filePath;
    };

    const frontPath = await uploadFile(frontImageFile, 'front');
    const backPath = await uploadFile(backImageFile, 'back');

    // Update user document in Firestore
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.update({
        nic: nic.trim(),
        nicFrontPath: frontPath,
        nicBackPath: backPath,
        nicVerificationStatus: 'pending',
        updatedAt: serverTimestamp(),
    });

    // Create a notification for admins
    const userProfile = (await userDocRef.get()).data();
    await db.collection('notifications').add({
        type: 'nic_verification',
        message: `NIC submitted for verification by ${userProfile?.displayName || decodedToken.email}.`,
        link: '/admin/verify-nic',
        isRead: false,
        recipient: 'admins',
        createdAt: serverTimestamp()
    });
    
    return NextResponse.json({ success: true, message: 'Files uploaded and verification request submitted.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error in API route /api/upload-nic:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: 'Invalid or expired authentication token. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'An unexpected server error occurred during file upload.', details: error.message }, { status: 500 });
  }
}
