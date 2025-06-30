
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type NicVerificationStatus } from '@/contexts/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle2, UploadCloud, ShieldCheck, Info, Fingerprint } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from '@/components/ui/progress';


const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function VerifyNicPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [nic, setNic] = useState('');
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [frontImageUrlPreview, setFrontImageUrlPreview] = useState<string | null>(null);
  const [backImageUrlPreview, setBackImageUrlPreview] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
        router.push('/auth?redirect=/book/verify-nic');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.nic) {
        setNic(userProfile.nic);
      }
      if (userProfile.nicVerificationStatus === 'verified' || userProfile.nicVerificationStatus === 'pending') {
        toast({
          title: `NIC Status: ${userProfile.nicVerificationStatus}`,
          description: "Your NIC is already verified or pending verification. You will be redirected.",
          variant: "default",
        });
        router.push('/my-bookings');
      }
    }
  }, [userProfile, router, toast]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear previous errors on new file selection
      setFormError(null);

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const errorMsg = `File size for ${type} image should not exceed ${MAX_FILE_SIZE_MB}MB.`;
        toast({ title: "File Too Large", description: errorMsg, variant: "destructive" });
        setFormError(errorMsg);
        if (type === 'front') { setFrontImageFile(null); setFrontImageUrlPreview(null); } 
        else { setBackImageFile(null); setBackImageUrlPreview(null); }
        e.target.value = '';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        const errorMsg = `Please use JPG, PNG, or WEBP for the ${type} image.`;
        toast({ title: "Invalid File Type", description: errorMsg, variant: "destructive" });
        setFormError(errorMsg);
        if (type === 'front') { setFrontImageFile(null); setFrontImageUrlPreview(null); }
        else { setBackImageFile(null); setBackImageUrlPreview(null); }
        e.target.value = '';
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      if (type === 'front') {
        setFrontImageFile(file);
        setFrontImageUrlPreview(previewUrl);
      } else {
        setBackImageFile(file);
        setBackImageUrlPreview(previewUrl);
      }
    }
  };

  const uploadImage = (file: File, side: 'front' | 'back', onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!user) {
        return reject(new Error("User not authenticated."));
      }
      const fileExtension = file.name.split('.').pop();
      const storageRef = ref(storage, `nic_verification/${user.uid}/nic_${side}_${Date.now()}.${fileExtension}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          console.error(`Upload failed for ${side}:`, error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          }).catch(reject);
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!user || !userProfile) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    if (!frontImageFile || !backImageFile) {
      setFormError("Please upload both front and back images of your NIC.");
      return;
    }
    if (!nicRegex.test(nic.trim())) {
      setFormError("Invalid NIC format. Please enter a valid 12-digit or 9-digit + V/X NIC number.");
      return;
    }

    setIsUploading(true);

    try {
      setUploadStatus("Uploading front image...");
      const frontUrl = await uploadImage(frontImageFile, 'front', setUploadProgress);
      
      setUploadStatus("Uploading back image...");
      const backUrl = await uploadImage(backImageFile, 'back', setUploadProgress);

      setUploadStatus("Finalizing submission...");
      setUploadProgress(100);
      
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        nic: nic.trim(),
        nicFrontUrl: frontUrl,
        nicBackUrl: backUrl,
        nicVerificationStatus: 'pending' as NicVerificationStatus,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        type: 'nic_verification',
        message: `NIC submitted for verification by ${userProfile.displayName || user.email}.`,
        link: '/admin/verify-nic',
        isRead: false,
        recipient: 'admins',
        createdAt: serverTimestamp()
      });

      toast({
        title: "NIC Images Submitted",
        description: "Your NIC details have been uploaded for verification. You can check the status on your My Bookings page.",
        variant: "default",
        duration: 7000,
      });
      router.push('/my-bookings');

    } catch (error: any) {
      console.error("Error uploading NIC images:", error);
      let errorMessage = "Could not upload NIC images. Please try again.";
      let detailedError: string | null = null;

      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = "Permission Denied. Your Firebase Storage rules may be preventing the upload.";
            detailedError = "Please check your `storage.rules` file and ensure they are deployed correctly."
            break;
          case 'storage/canceled':
            errorMessage = "Upload was canceled. Please try again.";
            break;
          case 'storage/unknown':
            errorMessage = "A CORS configuration error occurred on your Firebase backend.";
            detailedError = "This is a server configuration issue that must be fixed. In your project's terminal, please run the following command to allow your website to upload files: `gsutil cors set cors.json gs://flycargolanka-35017.appspot.com`";
            break;
          default:
            errorMessage = `An error occurred: ${error.message}`;
            break;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ title: "Upload Failed", description: errorMessage, variant: "destructive", duration: 15000 });
      setFormError(`${errorMessage}${detailedError ? ` ${detailedError}` : ''}`);

    } finally {
      setIsUploading(false);
      setUploadStatus('');
      setUploadProgress(0);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading Verification Page...</p>
      </div>
    );
  }

  return (
    <div className="opacity-0 animate-fadeInUp container mx-auto px-4 py-8">
      <PageHeader
        title="Verify Your Identity"
        description="Please provide your NIC number and upload clear images of your National Identity Card."
      />
      <Card className="max-w-lg mx-auto shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-accent flex items-center">
            <ShieldCheck className="mr-2 h-6 w-6 text-primary" /> NIC Verification
          </CardTitle>
          <CardDescription>
            Enter your NIC number and upload photos to complete verification.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="nicNumber" className="text-base flex items-center"><Fingerprint className="mr-2 h-4 w-4"/>NIC Number</Label>
                <Input 
                    id="nicNumber" 
                    type="text" 
                    placeholder="e.g., 199012345V or 200012345678"
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nicFront" className="text-base">NIC Front Image</Label>
              <Input id="nicFront" type="file" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleFileChange(e, 'front')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              {frontImageUrlPreview && (
                <div className="mt-2 border rounded-md p-2 inline-block">
                  <Image src={frontImageUrlPreview} alt="NIC Front Preview" width={200} height={120} className="object-contain rounded" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nicBack" className="text-base">NIC Back Image</Label>
              <Input id="nicBack" type="file" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleFileChange(e, 'back')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              {backImageUrlPreview && (
                <div className="mt-2 border rounded-md p-2 inline-block">
                  <Image src={backImageUrlPreview} alt="NIC Back Preview" width={200} height={120} className="object-contain rounded" />
                </div>
              )}
            </div>
            {formError && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                </Alert>
            )}
             <Alert variant="default" className="bg-secondary/50 border-secondary">
                <Info className="h-5 w-5"/>
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                    Ensure images are clear, well-lit, and all details are readable. Max file size: {MAX_FILE_SIZE_MB}MB. Accepted formats: JPG, PNG, WEBP.
                </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex-col">
            <Button type="submit" className="w-full" size="lg" disabled={isUploading || !frontImageFile || !backImageFile || !nic}>
              {isUploading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
              ) : (
                <><UploadCloud className="mr-2 h-5 w-5" /> Submit for Verification</>
              )}
            </Button>
            {isUploading && (
                <div className="w-full space-y-2 mt-4 text-center">
                    <p className="text-sm text-muted-foreground">{uploadStatus}</p>
                    <Progress value={uploadProgress} className="w-full" />
                </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
