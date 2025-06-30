
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type UserProfile } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, UploadCloud, ShieldCheck, Info, Fingerprint, FileImage, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from '@/components/ui/progress';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection, getDoc } from 'firebase/firestore';

const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface UploadProgress {
  progress: number;
  fileName: string;
}

export default function VerifyNicPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [nic, setNic] = useState('');
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [frontImageUrlPreview, setFrontImageUrlPreview] = useState<string | null>(null);
  const [backImageUrlPreview, setBackImageUrlPreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to submit.", variant: "destructive" });
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

    setIsSubmitting(true);

    try {
        const handleUpload = (file: File, path: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                const storageRef = ref(storage, path);
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress({ progress, fileName: file.name });
                    },
                    (error: any) => {
                        console.error("Upload error:", error);
                        // Catch specific CORS / permissions errors
                        if (error.code === 'storage/unauthorized' || error.code === 'storage/object-not-found') {
                            const corsErrorMsg = "A permissions error occurred. This is likely due to a CORS configuration issue on the Firebase Storage bucket. Please contact support and mention this error.";
                            setFormError(corsErrorMsg);
                            reject(new Error(corsErrorMsg));
                        } else {
                           reject(new Error(`Failed to upload ${file.name}. Please check your connection and storage rules.`));
                        }
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                            resolve(downloadURL);
                        }).catch(error => {
                            console.error("Error getting download URL:", error);
                            reject(new Error(`Could not get URL for ${file.name}.`));
                        });
                    }
                );
            });
        };

        const fileExtensionFront = frontImageFile.name.split('.').pop() || 'jpg';
        const fileExtensionBack = backImageFile.name.split('.').pop() || 'jpg';

        const frontPath = `nic_verification/${user.uid}/nic_front_${Date.now()}.${fileExtensionFront}`;
        const backPath = `nic_verification/${user.uid}/nic_back_${Date.now()}.${fileExtensionBack}`;

        const frontUrl = await handleUpload(frontImageFile, frontPath);
        const backUrl = await handleUpload(backImageFile, backPath);
        
        setUploadProgress(null);

        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            nic: nic.trim(),
            nicFrontUrl: frontUrl,
            nicBackUrl: backUrl,
            nicVerificationStatus: 'pending',
            updatedAt: serverTimestamp(),
        });

        // Create a notification for admins
        const userDocSnap = await getDoc(userDocRef);
        const updatedUserProfile = userDocSnap.data() as UserProfile | undefined;

        await addDoc(collection(db, 'notifications'), {
            type: 'nic_verification',
            message: `NIC submitted for verification by ${updatedUserProfile?.displayName || user.email}.`,
            link: '/admin/verify-nic',
            isRead: false,
            recipient: 'admins',
            createdAt: serverTimestamp()
        });

        toast({
            title: "NIC Images Submitted",
            description: "Your NIC details have been uploaded for verification.",
            variant: "default",
            action: <CheckCircle2 className="text-green-500" />
        });

        router.push('/my-bookings');

    } catch (error: any) {
        console.error("Error during NIC submission process:", error);
        // Only update the form error if it hasn't been set by the uploader already
        if (!formError) {
            setFormError(error.message || 'An unexpected error occurred. Please try again.');
        }
        toast({ 
            title: "Submission Failed", 
            description: error.message || 'An unexpected error occurred.', 
            variant: "destructive",
            duration: 9000
        });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(null);
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
                    disabled={isSubmitting}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nicFront" className="text-base">NIC Front Image</Label>
              <Input id="nicFront" type="file" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleFileChange(e, 'front')} disabled={isSubmitting} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              {frontImageUrlPreview && (
                <div className="mt-2 border rounded-md p-2 inline-block">
                  <Image src={frontImageUrlPreview} alt="NIC Front Preview" width={200} height={120} className="object-contain rounded" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nicBack" className="text-base">NIC Back Image</Label>
              <Input id="nicBack" type="file" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleFileChange(e, 'back')} disabled={isSubmitting} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              {backImageUrlPreview && (
                <div className="mt-2 border rounded-md p-2 inline-block">
                  <Image src={backImageUrlPreview} alt="NIC Back Preview" width={200} height={120} className="object-contain rounded" />
                </div>
              )}
            </div>

            {isSubmitting && uploadProgress && (
                <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">{`Uploading: ${uploadProgress.fileName}`}</Label>
                    <Progress value={uploadProgress.progress} className="w-full" />
                    <p className="text-xs text-right text-muted-foreground">{Math.round(uploadProgress.progress)}%</p>
                </div>
            )}

            {formError && (
                <Alert variant="destructive" className="mt-4 whitespace-pre-wrap">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {formError}
                        {formError.includes("CORS") && (
                            <p className="mt-2 text-xs">
                                <strong>How to fix:</strong> This requires a one-time configuration on your Firebase project. Please ask support for instructions on how to set your Storage CORS policy.
                            </p>
                        )}
                    </AlertDescription>
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
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !frontImageFile || !backImageFile || !nic}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
              ) : (
                <><UploadCloud className="mr-2 h-5 w-5" /> Submit for Verification</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
