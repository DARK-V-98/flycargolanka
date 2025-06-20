
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Loader2, Package, FileText, Clock, Zap, Home, Navigation, Building, User, MailIcon, MapPin, Hash, Globe, Phone, MessageSquare, Info, AlertCircle, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, type Timestamp, where } from 'firebase/firestore';
import type { CountryRate, WeightRate } from '@/types/shippingRates';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const bookingSchema = z.object({
  shipmentType: z.enum(['parcel', 'document'], { required_error: "Please select a shipment type." }),
  serviceType: z.enum(['economy', 'express'], { required_error: "Please select a service type." }),
  locationType: z.enum(['pickup', 'dropoff_maharagama', 'dropoff_galle'], { required_error: "Please select a location type." }),
  
  approxWeight: z.coerce.number().positive("Approximate weight must be a positive number.").min(0.01, "Weight must be at least 0.01 KG."), // min changed to 0.01
  approxValue: z.coerce.number().positive("Approximate value of goods must be a positive number.").min(1, "Value must be at least 1 USD."),

  receiverFullName: z.string().min(2, "Receiver full name is required (as per passport).").max(100),
  receiverEmail: z.string().email("Invalid receiver email address.").max(100),
  receiverAddress: z.string().min(5, "Receiver address is required.").max(200),
  receiverDoorCode: z.string().max(50).optional().or(z.literal('')),
  receiverCountry: z.string().min(1, "Receiver country is required."), // This will be country NAME
  receiverZipCode: z.string().min(1, "Receiver ZIP/Postal code is required.").max(20),
  receiverCity: z.string().min(1, "Receiver city is required.").max(50),
  receiverContactNo: z.string().regex(phoneRegex, "Invalid receiver contact number (include country code)."),
  receiverWhatsAppNo: z.string().regex(phoneRegex, "Invalid WhatsApp number (include country code).").optional().or(z.literal('')),

  senderFullName: z.string().min(2, "Sender full name is required.").max(100),
  senderAddress: z.string().min(5, "Sender address is required.").max(200),
  senderContactNo: z.string().regex(phoneRegex, "Invalid sender contact number (include country code)."),
  senderWhatsAppNo: z.string().regex(phoneRegex, "Invalid WhatsApp number (include country code).").optional().or(z.literal('')),
  
  declaration1: z.boolean().refine(val => val === true, { message: "You must agree to the first declaration." }),
  declaration2: z.boolean().refine(val => val === true, { message: "You must agree to the second declaration." }),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookingPage() {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileCompletionAlert, setShowProfileCompletionAlert] = useState(false);
  
  const [availableCountries, setAvailableCountries] = useState<CountryRate[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  
  const [availableWeights, setAvailableWeights] = useState<WeightRate[]>([]);
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState<string | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      shipmentType: undefined,
      serviceType: undefined,
      locationType: undefined,
      approxWeight: undefined,
      approxValue: undefined,
      receiverFullName: '',
      receiverEmail: '',
      receiverAddress: '',
      receiverDoorCode: '',
      receiverCountry: '',
      receiverZipCode: '',
      receiverCity: '',
      receiverContactNo: '',
      receiverWhatsAppNo: '',
      senderFullName: '',
      senderAddress: '',
      senderContactNo: '',
      senderWhatsAppNo: '',
      declaration1: false,
      declaration2: false,
    },
  });

  // Fetch countries for dropdown
  useEffect(() => {
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
        setAvailableCountries(fetchedCountries);
        if (fetchedCountries.length === 0) {
            setCalculationError("No destination countries configured for shipping.");
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast({ title: "Error", description: "Could not load destination countries.", variant: "destructive" });
        setCalculationError("Could not load destination countries.");
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, [toast]);

  // Auth and profile completion checks
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      } else if (userProfile) {
        setShowProfileCompletionAlert(!userProfile.isProfileComplete);
        if (userProfile.isProfileComplete) {
            form.setValue('senderFullName', userProfile.displayName || '', { shouldValidate: true });
            form.setValue('senderAddress', userProfile.address || '', { shouldValidate: true });
            form.setValue('senderContactNo', userProfile.phone || '', { shouldValidate: true });
        }
      }
    }
  }, [user, userProfile, authLoading, router, form]);

  const watchedReceiverCountryName = form.watch('receiverCountry');

  // Fetch weights when receiverCountry changes
  useEffect(() => {
    const fetchWeights = async () => {
      if (!watchedReceiverCountryName) {
        setAvailableWeights([]);
        return;
      }
      setLoadingWeights(true);
      setAvailableWeights([]);
      setCalculatedCost(null);
      setCalculationError(null);

      const selectedCountry = availableCountries.find(c => c.name === watchedReceiverCountryName);
      if (!selectedCountry) {
        setCalculationError("Selected country not found for rate fetching.");
        setLoadingWeights(false);
        return;
      }

      try {
        const weightsColRef = collection(db, 'shipping_rates', selectedCountry.id, 'weights');
        const q = query(weightsColRef, orderBy('weightValue', 'asc'));
        const snapshot = await getDocs(q);
        const fetchedWeights = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as WeightRate));
        setAvailableWeights(fetchedWeights);
        if (fetchedWeights.length === 0) {
          setCalculationError(`No shipping weights configured for ${selectedCountry.name}.`);
        }
      } catch (error) {
        console.error("Error fetching weights:", error);
        setCalculationError(`Could not load weights for ${selectedCountry.name}.`);
        toast({ title: "Error", description: `Could not load weights for ${selectedCountry.name}.`, variant: "destructive" });
      } finally {
        setLoadingWeights(false);
      }
    };

    if (watchedReceiverCountryName && availableCountries.length > 0) {
        fetchWeights();
    }
  }, [watchedReceiverCountryName, availableCountries, toast]);


  const watchedShipmentType = form.watch('shipmentType');
  const watchedServiceType = form.watch('serviceType');
  const watchedApproxWeight = form.watch('approxWeight');

  // Calculate cost when relevant fields change
  useEffect(() => {
    const calculateCost = () => {
      setCalculatedCost(null);
      setCalculationError(null);

      if (!watchedShipmentType || !watchedServiceType || !watchedReceiverCountryName || !watchedApproxWeight || availableWeights.length === 0) {
        if (watchedReceiverCountryName && watchedApproxWeight && availableWeights.length === 0 && !loadingWeights) {
             // Handled by fetchWeights error
        } else if (watchedReceiverCountryName && watchedApproxWeight && availableWeights.length > 0) {
            // Waiting for other selections
        }
        return;
      }

      if (watchedApproxWeight <= 0) {
        setCalculationError("Approximate weight must be positive.");
        return;
      }

      const sortedWeights = [...availableWeights].sort((a, b) => a.weightValue - b.weightValue);
      let selectedWeightBand: WeightRate | undefined = undefined;

      for (const band of sortedWeights) {
        if (watchedApproxWeight <= band.weightValue) {
          selectedWeightBand = band;
          break;
        }
      }
      
      // If weight is greater than the max band, use the max band.
      if(!selectedWeightBand && sortedWeights.length > 0) {
        selectedWeightBand = sortedWeights[sortedWeights.length - 1];
         setCalculationError(`Entered weight exceeds max configured band. Using rate for ${selectedWeightBand.weightLabel}.`);
      }


      if (!selectedWeightBand) {
        setCalculationError(`No suitable weight band found for ${watchedApproxWeight}kg.`);
        return;
      }

      let price: number | null | undefined = null;
      let serviceAvailable = false;
      const currency = "LKR";

      if (watchedShipmentType === 'parcel') { // 'parcel' matches 'non-document' in WeightRate
        if (watchedServiceType === 'economy') {
          serviceAvailable = selectedWeightBand.isNdEconomyEnabled ?? false;
          price = selectedWeightBand.ndEconomyPrice;
        } else if (watchedServiceType === 'express') {
          serviceAvailable = selectedWeightBand.isNdExpressEnabled ?? false;
          price = selectedWeightBand.ndExpressPrice;
        }
      } else if (watchedShipmentType === 'document') {
        if (watchedServiceType === 'economy') {
          serviceAvailable = selectedWeightBand.isDocEconomyEnabled ?? false;
          price = selectedWeightBand.docEconomyPrice;
        } else if (watchedServiceType === 'express') {
          serviceAvailable = selectedWeightBand.isDocExpressEnabled ?? false;
          price = selectedWeightBand.docExpressPrice;
        }
      }

      if (!serviceAvailable) {
        setCalculatedCost(null); // Clear previous cost
        setCalculationError(`The selected ${watchedServiceType} service for ${watchedShipmentType} is not available for this weight/destination.`);
      } else if (price === null || price === undefined) {
        setCalculatedCost(null); // Clear previous cost
        setCalculationError(`Price not configured for ${watchedShipmentType} ${watchedServiceType} service at ${selectedWeightBand.weightLabel}.`);
      } else {
        setCalculatedCost(`Estimated Cost: ${price.toLocaleString()} ${currency}`);
      }
    };

    if (!loadingCountries && !loadingWeights) {
        calculateCost();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedShipmentType, watchedServiceType, watchedReceiverCountryName, watchedApproxWeight, availableWeights, loadingCountries, loadingWeights]);


  const onSubmit: SubmitHandler<BookingFormValues> = async (data) => {
    if (isSubmitting || showProfileCompletionAlert || !user) return;
    setIsSubmitting(true);
    try {
      const bookingData = {
        ...data,
        userId: user.uid,
        userEmail: user.email,
        status: 'Pending' as 'Pending' | 'In Transit' | 'Delivered' | 'Cancelled',
        createdAt: serverTimestamp(),
        // For easier querying/display on admin orders page
        packageDescription: `Shipment of ${data.shipmentType}, approx ${data.approxWeight}kg, value $${data.approxValue}`,
        packageWeight: data.approxWeight, // Ensure this is the number
        senderName: data.senderFullName,
        receiverName: data.receiverFullName,
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      
      toast({
        title: "Booking Submitted!",
        description: "Your shipment details have been received. We will contact you shortly.",
        variant: "default",
        action: <CheckCircle2 className="text-green-500" />,
      });
      form.reset();
      setCalculatedCost(null);
      setCalculationError(null);
      if (userProfile && userProfile.isProfileComplete) {
        form.setValue('senderFullName', userProfile.displayName || '');
        form.setValue('senderAddress', userProfile.address || '');
        form.setValue('senderContactNo', userProfile.phone || '');
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
    const firstErrorKey = Object.keys(errors)[0];
    const firstErrorMessage = errors[firstErrorKey]?.message || "Please correct the form errors.";
    toast({
        title: "Error in Booking Form",
        description: firstErrorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />,
    });
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading booking page...</p></div>;
  }

  if (!user && !authLoading) {
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
        title="Submit Your Shipment Details"
        description="Fill in all required information to process your shipment. An estimated cost will be shown below."
      />

      {showProfileCompletionAlert && (
        <Alert variant="destructive" className="mb-8 opacity-0 animate-fadeInUp">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">Action Required: Profile Incomplete</AlertTitle>
          <AlertDescription className="mt-1">
            To ensure smooth processing of your booking, please complete your profile with your NIC, Phone Number, and Address.
            <Button asChild variant="link" className="px-1 py-0 h-auto ml-1 text-destructive hover:text-destructive/80 font-semibold underline">
              <Link href="/profile">Go to Profile Page</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-8 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-accent flex items-center"><Package className="mr-2 h-6 w-6 text-primary" />Shipment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="shipmentType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">Shipment Type</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="parcel" id="parcel" /></FormControl><FormLabel htmlFor="parcel" className="font-normal">Parcel</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="document" id="document" /></FormControl><FormLabel htmlFor="document" className="font-normal">Document</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl><FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="serviceType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">Service Type</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="economy" id="economy" /></FormControl><FormLabel htmlFor="economy" className="font-normal flex items-center"><Clock className="mr-1.5 h-4 w-4 text-muted-foreground"/>Economy Service</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="express" id="express" /></FormControl><FormLabel htmlFor="express" className="font-normal flex items-center"><Zap className="mr-1.5 h-4 w-4 text-muted-foreground"/>Express Service</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl><FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="locationType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">Pickup / Drop-off Location</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2">
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="pickup" id="pickup" /></FormControl><FormLabel htmlFor="pickup" className="font-normal flex items-center"><Home className="mr-1.5 h-4 w-4 text-muted-foreground"/>Pickup</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="dropoff_maharagama" id="dropoff_maharagama" /></FormControl><FormLabel htmlFor="dropoff_maharagama" className="font-normal flex items-center"><Building className="mr-1.5 h-4 w-4 text-muted-foreground"/>Drop Off – Maharagama</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="dropoff_galle" id="dropoff_galle" /></FormControl><FormLabel htmlFor="dropoff_galle" className="font-normal flex items-center"><Navigation className="mr-1.5 h-4 w-4 text-muted-foreground"/>Drop Off – Galle</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl><FormMessage />
                  </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-accent flex items-center"><Info className="mr-2 h-6 w-6 text-primary"/>Shipment Info &amp; Cost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="approxWeight" render={({ field }) => (
                <FormItem>
                  <FormLabel>Approximate Weight (KG)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min="0.01" placeholder="e.g., 2.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="approxValue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Approximate Value of Goods (USD)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="e.g., 50.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormDescription>For customs clearance purposes only.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
                {(calculatedCost || calculationError || loadingWeights) && (
                    <CardFooter className={`mt-4 p-4 rounded-md ${calculationError ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <div className="text-center w-full">
                        {loadingWeights ? (
                            <div className="flex items-center justify-center text-muted-foreground">
                                <Loader2 className="mr-2 h-5 w-5 animate-spin"/> Loading rates...
                            </div>
                        ) : calculationError ? (
                            <p className="text-destructive flex items-center justify-center"><AlertTriangle className="mr-2 h-5 w-5"/> {calculationError}</p>
                        ) : calculatedCost ? (
                            <h3 className="text-lg font-semibold text-accent">{calculatedCost}</h3>
                        ) : null}
                        </div>
                    </CardFooter>
                )}
            </CardContent>
          </Card>


          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-accent flex items-center"><FileText className="mr-2 h-6 w-6 text-primary"/>Airway Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center"><User className="mr-2 h-5 w-5"/>Receiver Details</h3>
                <div className="space-y-4">
                  <FormField control={form.control} name="receiverFullName" render={({ field }) => ( <FormItem><FormLabel>Full Name (as per passport)</FormLabel><FormControl><Input placeholder="John Michael Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="receiverEmail" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="receiver@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="receiverAddress" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="123 Global St, Apt 4B" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="receiverDoorCode" render={({ field }) => ( <FormItem><FormLabel>Door Code / Access Code / Floor Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., #1234, Floor 5" {...field} /></FormControl><FormDescription className="text-xs">Address without door code will be delivered to the nearest parcel point.</FormDescription><FormMessage /></FormItem> )} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="receiverCountry" render={({ field }) => (
                      <FormItem><FormLabel>Country</FormLabel>
                        <Select onValueChange={(value) => {field.onChange(value); setAvailableWeights([]); setCalculatedCost(null); setCalculationError(null);}} defaultValue={field.value} disabled={loadingCountries || availableCountries.length === 0}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={ loadingCountries ? "Loading countries..." : availableCountries.length === 0 ? "No countries available" : "Select country" } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCountries.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="receiverZipCode" render={({ field }) => ( <FormItem><FormLabel>ZIP / Postal Code</FormLabel><FormControl><Input placeholder="e.g., 90210" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                  <FormField control={form.control} name="receiverCity" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Springfield" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="receiverContactNo" render={({ field }) => ( <FormItem><FormLabel>Contact No (with country code)</FormLabel><FormControl><Input type="tel" placeholder="+1 555 123 4567" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="receiverWhatsAppNo" render={({ field }) => ( <FormItem><FormLabel>WhatsApp No (with country code, Optional)</FormLabel><FormControl><Input type="tel" placeholder="+1 555 123 4567" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                </div>
              </div>
              
              <hr className="my-6 border-border/50" />

              <div>
                <h3 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center"><User className="mr-2 h-5 w-5"/>Sender Details</h3>
                <div className="space-y-4">
                  <FormField control={form.control} name="senderFullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} readOnly={!!userProfile?.displayName && !!userProfile.isProfileComplete} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="senderAddress" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Your Address" {...field} readOnly={!!userProfile?.address && !!userProfile.isProfileComplete} /></FormControl><FormMessage /></FormItem> )} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="senderContactNo" render={({ field }) => ( <FormItem><FormLabel>Contact No (with country code)</FormLabel><FormControl><Input type="tel" placeholder="Your Contact No." {...field} readOnly={!!userProfile?.phone && !!userProfile.isProfileComplete} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="senderWhatsAppNo" render={({ field }) => ( <FormItem><FormLabel>WhatsApp No (with country code, Optional)</FormLabel><FormControl><Input type="tel" placeholder="Your WhatsApp No." {...field} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-accent flex items-center"><FileText className="mr-2 h-6 w-6 text-primary"/>Document Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80"> Please forward invoices, bills, and tracking details to the following number: </p>
              <p className="font-semibold text-lg text-primary mt-1 flex items-center"> <Phone className="mr-2 h-5 w-5"/> +94 770 663 108 </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-accent flex items-center"><CheckCircle2 className="mr-2 h-6 w-6 text-primary"/>Declarations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="declaration1" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal"> I have read and checked the Important Guide, Amendment Fees & Terms-Conditions, and Remote Area Postal Codes for Economy Service – Europe, and I am fully aware of the additional charges if applicable to my parcel/document. </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
              )} />
              <FormField control={form.control} name="declaration2" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal"> I have read and agreed to the Terms & Conditions and wish to proceed with my shipment via CFC Express. </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
              )} />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg" size="lg" disabled={isSubmitting || showProfileCompletionAlert}>
            {isSubmitting ? ( <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Submitting...</> ) : ( "Submit Shipment" )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
