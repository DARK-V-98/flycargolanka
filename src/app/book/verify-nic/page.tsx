
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type NicVerificationStatus } from '@/contexts/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle2, UploadCloud, ShieldCheck, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function VerifyNicPage() {
  const { user, userProfile, loading: authLoading, updateNicVerificationDetails } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [frontImageUrlPreview, setFrontImageUrlPreview] = useState<string | null>(null);
  const [backImageUrlPreview, setBackImageUrlPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth?redirect=/book/verify-nic');
      } else if (userProfile && (!userProfile.nic || userProfile.nic.trim() === '')) {
        toast({
          title: "NIC Not Found",
          description: "Please update your NIC in your profile before proceeding with verification.",
          variant: "destructive",
        });
        router.push('/profile?redirect=/book/verify-nic');
      } else if (userProfile && (userProfile.nicVerificationStatus === 'verified' || userProfile.nicVerificationStatus === 'pending')) {
        toast({
          title: `NIC Status: ${userProfile.nicVerificationStatus}`,
          description: "Your NIC is already verified or pending verification.",
          variant: "default",
        });
        router.push('/my-bookings');
      }
    }
  }, [user, userProfile, authLoading, router, toast]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setFormError(`File size for ${type} image should not exceed 2MB.`);
        if (type === 'front') {
            setFrontImageFile(null);
            setFrontImageUrlPreview(null);
        } else {
            setBackImageFile(null);
            setBackImageUrlPreview(null);
        }
        e.target.value = ''; // Clear the input
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setFormError(`Invalid file type for ${type} image. Please use JPG, PNG, or WEBP.`);
         if (type === 'front') {
            setFrontImageFile(null);
            setFrontImageUrlPreview(null);
        } else {
            setBackImageFile(null);
            setBackImageUrlPreview(null);
        }
        e.target.value = ''; // Clear the input
        return;
      }

      setFormError(null); // Clear any previous error
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

    if (!user || !userProfile) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    if (!frontImageFile || !backImageFile) {
      setFormError("Please upload both front and back images of your NIC.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadImage = async (file: File, side: 'front' | 'back'): Promise<string> => {
        const fileExtension = file.name.split('.').pop();
        const storageRef = ref(storage, `nic_verification/${user.uid}/nic_${side}.${fileExtension}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      };

      const frontUrl = await uploadImage(frontImageFile, 'front');
      const backUrl = await uploadImage(backImageFile, 'back');

      await updateNicVerificationDetails({
        nicFrontUrl: frontUrl,
        nicBackUrl: backUrl,
        nicVerificationStatus: 'pending',
      });

      toast({
        title: "NIC Images Submitted",
        description: "Your NIC images have been uploaded. Verification will take some time. You can check the status on your My Bookings page.",
        variant: "default",
        duration: 7000,
      });
      router.push('/my-bookings');

    } catch (error: any) {
      console.error("Error uploading NIC images:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload NIC images. Please try again.",
        variant: "destructive",
      });
      setFormError(error.message || "Could not upload NIC images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading || !user || !userProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading Verification Page...</p>
      </div>
    );
  }
   if (!userProfile.nic || userProfile.nic.trim() === '') {
    // This case should ideally be caught by useEffect, but as a fallback:
    return (
        <div className="container mx-auto px-4 py-8 text-center">
             <Alert variant="destructive" className="max-w-lg mx-auto">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>NIC Not Set</AlertTitle>
                <AlertDescription>
                    Please set your NIC number in your profile before attempting verification.
                    <Button asChild variant="link" className="block mx-auto mt-2">
                        <Link href="/profile?redirect=/book/verify-nic">Go to Profile</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
  }
  if (userProfile.nicVerificationStatus === 'verified' || userProfile.nicVerificationStatus === 'pending') {
     // This case should also be caught by useEffect, but as a fallback:
    return (
        <div className="container mx-auto px-4 py-8 text-center">
             <Alert variant="default" className="max-w-lg mx-auto bg-primary/10 border-primary/30">
                <Info className="h-5 w-5 text-primary" />
                <AlertTitle className="text-primary">NIC Status: {userProfile.nicVerificationStatus}</AlertTitle>
                <AlertDescription>
                    Your NIC verification is already '{userProfile.nicVerificationStatus}'. No further action is needed here.
                    <Button asChild variant="link" className="block mx-auto mt-2">
                        <Link href="/my-bookings">Go to My Bookings</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
  }


  return (
    <div className="opacity-0 animate-fadeInUp">
      <PageHeader
        title="Verify Your NIC"
        description="Please upload clear images of the front and back of your National Identity Card."
      />
      <Card className="max-w-lg mx-auto shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-accent flex items-center">
            <ShieldCheck className="mr-2 h-6 w-6 text-primary" /> NIC Details
          </CardTitle>
          <CardDescription>
            Your NIC Number: <span className="font-semibold text-foreground">{userProfile.nic}</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
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
                    Ensure images are clear, well-lit, and all details are readable. Max file size: 2MB. Accepted formats: JPG, PNG, WEBP.
                </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isUploading || !frontImageFile || !backImageFile}>
              {isUploading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Uploading & Submitting...</>
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
