
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload, Trash2, AlertTriangle } from 'lucide-react';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const SETTINGS_DOC_REF = doc(db, 'settings', 'homepage');

export default function ManageHomepageImagePage() {
    const { toast } = useToast();
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCurrentImage = async () => {
            setIsLoading(true);
            try {
                const docSnap = await getDoc(SETTINGS_DOC_REF);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCurrentImageUrl(data.imageUrl || null);
                    setCurrentImagePath(data.imagePath || null);
                }
            } catch (err) {
                console.error("Error fetching homepage settings:", err);
                toast({ title: "Error", description: "Could not fetch current homepage settings.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchCurrentImage();
    }, [toast]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setNewImageFile(null);
            setPreviewUrl(null);
            return;
        }

        setError(null);
        if (file.size > MAX_FILE_SIZE_BYTES) {
            setError(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Invalid file type. Please use JPG, PNG, or WEBP.');
            return;
        }
        
        setNewImageFile(file);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        if (!newImageFile) return;
        setIsUploading(true);
        setError(null);

        // 1. Delete old image if it exists
        if (currentImagePath) {
            try {
                const oldImageRef = ref(storage, currentImagePath);
                await deleteObject(oldImageRef);
            } catch (err: any) {
                 if (err.code !== 'storage/object-not-found') {
                    console.error("Could not delete old image, proceeding anyway:", err);
                    toast({ title: "Warning", description: "Could not delete the old image, but will proceed with upload.", variant: "default" });
                }
            }
        }

        // 2. Upload new image
        const newImagePath = `homepage/promo_${Date.now()}.${newImageFile.name.split('.').pop()}`;
        const newImageRef = ref(storage, newImagePath);
        const uploadTask = uploadBytesResumable(newImageRef, newImageFile);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (err) => {
                console.error("Upload failed:", err);
                setError("Upload failed. Please check storage permissions and try again.");
                setIsUploading(false);
            },
            async () => {
                // 3. Get URL and update Firestore
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                await setDoc(SETTINGS_DOC_REF, {
                    imageUrl: downloadURL,
                    imagePath: newImagePath,
                    updatedAt: new Date(),
                });
                
                setCurrentImageUrl(downloadURL);
                setCurrentImagePath(newImagePath);
                setNewImageFile(null);
                setPreviewUrl(null);
                setIsUploading(false);
                toast({ title: "Success", description: "Homepage image updated successfully." });
            }
        );
    };

    const handleDelete = async () => {
        if (!currentImagePath) {
            toast({ title: "No Image", description: "There is no image to delete.", variant: "default" });
            return;
        }
        setIsDeleting(true);
        setError(null);
        try {
            const imageRef = ref(storage, currentImagePath);
            await deleteObject(imageRef);
            await updateDoc(SETTINGS_DOC_REF, {
                imageUrl: deleteField(),
                imagePath: deleteField(),
                updatedAt: deleteField()
            });
            
            setCurrentImageUrl(null);
            setCurrentImagePath(null);
            toast({ title: "Success", description: "Homepage image has been deleted." });

        } catch (err: any) {
            if (err.code === 'storage/object-not-found') {
                // The file is already gone from storage, so just clear Firestore
                await updateDoc(SETTINGS_DOC_REF, { imageUrl: null, imagePath: null, updatedAt: new Date() });
                setCurrentImageUrl(null);
                setCurrentImagePath(null);
                toast({ title: "Image Cleared", description: "Image was not found in storage, but database link was removed." });
            } else {
                 console.error("Deletion failed:", err);
                 setError("Could not delete the image. Please check permissions and try again.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading settings...</div>;
    }

    return (
        <div className="space-y-6 opacity-0 animate-fadeInUp">
            <Button asChild variant="outline">
                <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>

            <PageHeader
                title="Manage Homepage Image"
                description="Upload, replace, or delete the main promotional image on the homepage."
            />

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Current Image</CardTitle>
                </CardHeader>
                <CardContent>
                    {currentImageUrl ? (
                        <div className="space-y-4">
                            <Image src={currentImageUrl} alt="Current homepage image" width={800} height={400} className="rounded-md border-2 border-primary/20 w-full h-auto" />
                            <Button onClick={handleDelete} variant="destructive" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>} Delete Current Image
                            </Button>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No image is currently set for the homepage.</p>
                    )}
                </CardContent>
            </Card>
            
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Upload New Image</CardTitle>
                    <CardDescription>Select a new image to replace the current one. Max size: {MAX_FILE_SIZE_MB}MB.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="homepage-image-upload">Select Image File</Label>
                        <Input id="homepage-image-upload" type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} disabled={isUploading}/>
                    </div>
                    {previewUrl && (
                        <div>
                             <p className="text-sm font-medium mb-2">New Image Preview:</p>
                             <Image src={previewUrl} alt="New image preview" width={400} height={200} className="rounded-md border w-auto h-auto" />
                        </div>
                    )}
                    {isUploading && (
                        <div className="space-y-2">
                            <Label className="text-sm">Uploading...</Label>
                            <Progress value={uploadProgress} />
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleUpload} disabled={!newImageFile || isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>} 
                        {isUploading ? 'Uploading...' : 'Upload and Replace'}
                    </Button>
                </CardFooter>
            </Card>

            {error && (
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

        </div>
    );
}
