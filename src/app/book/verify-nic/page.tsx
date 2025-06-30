
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
import { Loader2, AlertTriangle, CheckCircle2, UploadCloud, ShieldCheck, Info, Fingerprint } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;

export default function VerifyNicPage() {
  const { user, userProfile, loading: authLoading, updateUserExtendedProfile, updateNicVerificationDetails } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [nic, setNic] = useState('');
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
      } else if (userProfile) {
        if (userProfile.nic) {
          setNic(userProfile.nic);
        }
        if (userProfile.nicVerificationStatus === 'verified' || userProfile.nicVerificationStatus === 'pending') {
          toast({
            title: `NIC Status: ${userProfile.nicVerificationStatus}`,
            description: "Your NIC is already verified or pending verification.",
            variant: "default",
          });
          router.push('/my-bookings');
        }
      }
    }
  }, [user, userProfile, authLoading, router, toast]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setFormError(`File size for ${type} image should not exceed 5MB.`);
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
    if (!nicRegex.test(nic.trim())) {
      setFormError("Invalid NIC format. Please enter a valid 12-digit or 9-digit + V/X NIC number.");
      return;
    }


    setIsUploading(true);
    try {
      if (nic.trim() !== userProfile.nic) {
        await updateUserExtendedProfile({ nic: nic.trim() });
      }

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
        description: "Your NIC details have been uploaded. Verification will take some time. You can check the status on your My Bookings page.",
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
                    Ensure images are clear, well-lit, and all details are readable. Max file size: 5MB. Accepted formats: JPG, PNG, WEBP.
                </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isUploading || !frontImageFile || !backImageFile || !nic}>
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
