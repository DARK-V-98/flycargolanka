
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import type { SpecialOffer } from '@/types/specialOffers';
import type { CountryRate } from '@/types/shippingRates';

import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadFormDescription } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Trash2, Edit, PlusCircle, Save, Plane, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const offerSchema = z.object({
    country: z.string().min(1, "Country must be selected."),
    weightDescription: z.string().min(2, "Weight description is required.").max(50),
    rate: z.coerce.number().positive("Rate must be a positive number."),
    enabled: z.boolean().default(true),
});
type OfferFormValues = z.infer<typeof offerSchema>;

export default function ManageSpecialOffersPage() {
    const { toast } = useToast();
    const [offers, setOffers] = useState<SpecialOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    
    const [countries, setCountries] = useState<CountryRate[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(true);

    const form = useForm<OfferFormValues>({
        resolver: zodResolver(offerSchema),
        defaultValues: { country: '', weightDescription: '', rate: 0, enabled: true },
    });

    useEffect(() => {
        const fetchOffers = async () => {
            setIsLoading(true);
            try {
                const q = query(collection(db, 'special_offers'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedOffers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialOffer));
                setOffers(fetchedOffers);
            } catch (err) {
                console.error("Error fetching offers:", err);
                toast({ title: "Error", description: "Could not fetch special offers.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        const fetchCountries = async () => {
            setLoadingCountries(true);
            try {
                const ratesCol = collection(db, 'shipping_rates');
                const q = query(ratesCol, orderBy('name', 'asc'));
                const snapshot = await getDocs(q);
                const fetchedCountries = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as CountryRate));
                setCountries(fetchedCountries);
            } catch (error) {
                console.error("Error fetching countries:", error);
                toast({ title: "Error", description: "Could not fetch countries for the dropdown.", variant: "destructive" });
            } finally {
                setLoadingCountries(false);
            }
        };

        fetchOffers();
        fetchCountries();
    }, [toast]);


    const handleEditClick = (offer: SpecialOffer) => {
        setEditingOffer(offer);
        form.reset({
            country: offer.country,
            weightDescription: offer.weightDescription,
            rate: offer.rate,
            enabled: offer.enabled,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingOffer(null);
        form.reset({ country: '', weightDescription: '', rate: 0, enabled: true });
        setFormError(null);
    };

    const handleDelete = async (offerToDelete: SpecialOffer) => {
        try {
            await deleteDoc(doc(db, 'special_offers', offerToDelete.id));
            toast({ title: "Success", description: "Offer deleted successfully." });
            setOffers(offers.filter(o => o.id !== offerToDelete.id));
        } catch (err) {
            console.error("Error deleting offer:", err);
            toast({ title: "Error", description: "Could not delete offer.", variant: "destructive" });
        }
    };

    const onSubmit: SubmitHandler<OfferFormValues> = async (data) => {
        setIsSubmitting(true);
        setFormError(null);

        try {
            const offerData = { ...data, updatedAt: serverTimestamp() };

            if (editingOffer) {
                const offerDocRef = doc(db, 'special_offers', editingOffer.id);
                await updateDoc(offerDocRef, offerData);
                toast({ title: "Success", description: "Offer updated successfully." });
            } else {
                await addDoc(collection(db, 'special_offers'), { ...offerData, createdAt: serverTimestamp() });
                toast({ title: "Success", description: "New offer created." });
            }
            resetForm();
            // Re-fetch offers after submission
            const q = query(collection(db, 'special_offers'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            setOffers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialOffer)));


        } catch (err: any) {
            console.error("Error submitting offer:", err);
            setFormError(err.message || "An unexpected error occurred.");
            toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 opacity-0 animate-fadeInUp">
            <Button asChild variant="outline">
                <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <PageHeader
                title="Manage Special Offers"
                description="Create, edit, and manage the special bulk offers displayed on the homepage."
            />
            <Card className="max-w-2xl mx-auto">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={loadingCountries}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a country for the offer" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {loadingCountries ? (
                                                    <SelectItem value="loading" disabled>Loading countries...</SelectItem>
                                                ) : (
                                                    countries.map(country => (
                                                        <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField name="weightDescription" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Weight</FormLabel><FormControl><Input placeholder='e.g., "Up to 25kg"' {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="rate" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Rate (LKR)</FormLabel><FormControl><Input type="number" placeholder="e.g., 15000" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="enabled" control={form.control} render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5"><FormLabel>Enabled</FormLabel><ShadFormDescription>Show this offer on the homepage.</ShadFormDescription></div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )} />
                            {formError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert>}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingOffer ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                                {isSubmitting ? 'Saving...' : (editingOffer ? 'Update Offer' : 'Create Offer')}
                            </Button>
                            {editingOffer && <Button type="button" variant="ghost" onClick={resetForm}>Cancel Edit</Button>}
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            <div className="mt-12">
                <h3 className="text-2xl font-headline text-center mb-6">Existing Offers</h3>
                {isLoading ? <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    : offers.length === 0 ? <p className="text-center text-muted-foreground">No special offers created yet.</p>
                        : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {offers.map(offer => (
                                    <Card key={offer.id} className="flex flex-col text-center">
                                        <CardHeader>
                                            <div className="mx-auto p-4 bg-primary/10 rounded-full inline-block mb-4">
                                                <Plane className="h-10 w-10 text-primary" />
                                            </div>
                                            <CardTitle>{offer.country}</CardTitle>
                                            <CardDescription>{offer.weightDescription}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <p className="text-2xl font-bold text-primary">{offer.rate.toLocaleString()} LKR</p>
                                            <p className={`text-sm font-semibold mt-2 ${offer.enabled ? 'text-green-600' : 'text-red-600'}`}>
                                                {offer.enabled ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="gap-2 justify-center">
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(offer)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the offer for {offer.country}? This is irreversible.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(offer)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
            </div>
        </div>
    );
}
