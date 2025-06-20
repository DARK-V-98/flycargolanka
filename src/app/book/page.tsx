
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const bookingSchema = z.object({
  // Sender Details
  senderName: z.string().min(2, "Sender name is required."),
  senderAddress: z.string().min(5, "Sender address is required."),
  senderPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number."), // Consider using a more flexible regex if needed
  senderEmail: z.string().email("Invalid email address."),

  // Receiver Details
  receiverName: z.string().min(2, "Receiver name is required."),
  receiverAddress: z.string().min(5, "Receiver address is required."),
  receiverPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number."),
  receiverEmail: z.string().email("Invalid email address.").optional().or(z.literal('')),

  // Package Details
  packageDescription: z.string().min(5, "Package description is required."),
  packageWeight: z.coerce.number().positive("Weight must be a positive number."),
  packageLength: z.coerce.number().positive("Length must be positive."),
  packageWidth: z.coerce.number().positive("Width must be positive."),
  packageHeight: z.coerce.number().positive("Height must be positive."),
  serviceType: z.enum(['international', 'local', 'freight', 'vacuum_packing'], { required_error: "Please select a service type." }),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookingPage() {
  const { toast } = useToast();
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileCompletionAlert, setShowProfileCompletionAlert] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      senderName: '',
      senderAddress: '',
      senderPhone: '',
      senderEmail: '',
      receiverName: '',
      receiverAddress: '',
      receiverPhone: '',
      receiverEmail: '',
      packageDescription: '',
      packageWeight: undefined,
      packageLength: undefined,
      packageWidth: undefined,
      packageHeight: undefined,
      serviceType: undefined,
    },
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      } else if (userProfile && !userProfile.isProfileComplete) {
        setShowProfileCompletionAlert(true);
        // Pre-fill available details even if profile is incomplete
        if (userProfile.displayName) form.setValue('senderName', userProfile.displayName, { shouldValidate: true });
        if (userProfile.email) form.setValue('senderEmail', userProfile.email, { shouldValidate: true });
      } else if (userProfile && userProfile.isProfileComplete) {
        setShowProfileCompletionAlert(false);
        // Pre-fill sender details from completed profile
        if (userProfile.displayName) form.setValue('senderName', userProfile.displayName, { shouldValidate: true });
        if (userProfile.address) form.setValue('senderAddress', userProfile.address, { shouldValidate: true });
        if (userProfile.phone) form.setValue('senderPhone', userProfile.phone, { shouldValidate: true });
        if (userProfile.email) form.setValue('senderEmail', userProfile.email, { shouldValidate: true });
      }
    }
  }, [user, userProfile, loading, router, form]);


  const onSubmit: SubmitHandler<BookingFormValues> = async (data) => {
    if (isSubmitting || showProfileCompletionAlert) return;
    setIsSubmitting(true);
    try {
      const bookingData = {
        ...data,
        userId: user ? user.uid : null,
        status: 'Pending', 
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'bookings'), bookingData);
      
      toast({
        title: "Booking Submitted!",
        description: "Your courier booking has been received. We will contact you shortly.",
        variant: "default",
        action: <CheckCircle2 className="text-green-500" />,
      });
      form.reset(); // Reset form, pre-fill will re-apply if still relevant
      // Re-trigger pre-fill based on current profile state after reset
      if (userProfile && userProfile.isProfileComplete) {
        if (userProfile.displayName) form.setValue('senderName', userProfile.displayName);
        if (userProfile.address) form.setValue('senderAddress', userProfile.address);
        if (userProfile.phone) form.setValue('senderPhone', userProfile.phone);
        if (userProfile.email) form.setValue('senderEmail', userProfile.email);
      } else if (userProfile) {
         if (userProfile.displayName) form.setValue('senderName', userProfile.displayName);
         if (userProfile.email) form.setValue('senderEmail', userProfile.email);
      }

    } catch (error) {
      console.error("Error submitting booking:", error);
      toast({
        title: "Booking Submission Failed",
        description: "There was an error submitting your booking. Please try again.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalidSubmit = (errors: any) => {
    console.log("Form errors:", errors);
    toast({
        title: "Error in Booking Form",
        description: "Please correct the errors highlighted in the form.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />,
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading booking page...</p></div>;
  }

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-screen space-y-4 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4"/>
        <h2 className="text-2xl font-semibold">Authentication Required</h2>
        <p className="text-muted-foreground">Please log in to book a courier service.</p>
        <Button asChild size="lg">
          <Link href={`/auth?redirect=${encodeURIComponent("/book")}`}>Login / Sign Up</Link>
        </Button>
      </div>
    );
  }
  

  return (
    <div className="opacity-0 animate-fadeInUp">
      <PageHeader
        title="Book Your Courier"
        description="Fill in the details below to schedule your shipment."
      />

      {showProfileCompletionAlert && (
        <Alert variant="destructive" className="mb-8 opacity-0 animate-fadeInUp">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-semibold">Action Required: Profile Incomplete</AlertTitle>
          <AlertDescription className="mt-1">
            To proceed with your booking, please complete your profile with your NIC, Phone Number, and Address.
            <Button asChild variant="link" className="px-1 py-0 h-auto ml-1 text-destructive hover:text-destructive/80 font-semibold underline">
              <Link href="/profile">Go to Profile Page</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-12 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-accent">Sender Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="senderName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="senderAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Textarea placeholder="123 Main St, City, Country" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="senderPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input type="tel" placeholder="+1234567890" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="senderEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-accent">Receiver Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="receiverName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="Jane Smith" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="receiverAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Textarea placeholder="456 Oak Ave, City, Country" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="receiverPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input type="tel" placeholder="+0987654321" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="receiverEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address (Optional)</FormLabel>
                    <FormControl><Input type="email" placeholder="jane.smith@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-accent">Package Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="packageDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description of Goods</FormLabel>
                  <FormControl><Textarea placeholder="e.g., Books, Electronics, Clothing" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="packageWeight" render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl><Input type="number" step="0.1" placeholder="e.g., 2.5" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormLabel>Dimensions (cm)</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="packageLength" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Length</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="e.g., 30" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="packageWidth" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Width</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="e.g., 20" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="packageHeight" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Height</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="e.g., 10" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="international">International</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="freight">Freight Forwarding</SelectItem>
                        <SelectItem value="vacuum_packing">Vacuum Packing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg" size="lg" disabled={isSubmitting || showProfileCompletionAlert}>
            {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Submitting...</>
              ) : (
                "Submit Booking"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
