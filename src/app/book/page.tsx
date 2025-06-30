
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle2, Loader2, Package, FileText, Clock, Zap, Home, Building, User, MailIcon, MapPin, Hash, Globe, Phone, MessageSquare, Info, AlertCircle, DollarSign, Landmark, Box } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, setDoc, doc, serverTimestamp, query, orderBy, getDocs, type Timestamp, where, addDoc } from 'firebase/firestore';
import type { CountryRate, WeightRate } from '@/types/shippingRates';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const bookingSchema = z.object({
  shipmentType: z.enum(['parcel', 'document'], { required_error: "Please select a shipment type." }),
  serviceType: z.enum(['economy', 'express'], { required_error: "Please select a service type." }),
  locationType: z.enum(['pickup', 'dropoff_katunayake'], { required_error: "Please select a location type." }),

  receiverCountry: z.string().min(1, "Receiver country is required."),
  approxWeight: z.coerce.number().positive("Approximate weight must be a positive number.").min(0.01, "Weight must be at least 0.01 KG."),
  length: z.union([z.coerce.number().positive("Length must be a positive number."), z.literal('')]).optional(),
  width: z.union([z.coerce.number().positive("Width must be a positive number."), z.literal('')]).optional(),
  height: z.union([z.coerce.number().positive("Height must be a positive number."), z.literal('')]).optional(),
  approxValue: z.coerce.number().positive("Approximate value of goods must be a positive number.").min(1, "Value must be at least 1 USD."),

  receiverFullName: z.string().min(2, "Receiver full name is required (as per passport).").max(100),
  receiverEmail: z.string().email("Invalid receiver email address.").max(100).optional().or(z.literal('')),
  receiverAddress: z.string().min(5, "Receiver address is required.").max(200),
  receiverDoorCode: z.string().max(50).optional().or(z.literal('')),
  receiverZipCode: z.string().min(1, "Receiver ZIP/Postal code is required.").max(20),
  receiverCity: z.string().min(1, "Receiver city is required.").max(50),
  receiverContactNo: z.string().regex(phoneRegex, "Invalid receiver contact number (include country code)."),
  receiverWhatsAppNo: z.string().regex(phoneRegex, "Invalid WhatsApp number (include country code).").optional().or(z.literal('')),

  senderFullName: z.string().min(2, "Sender full name is required.").max(100),
  senderAddress: z.string().min(5, "Sender address is required.").max(200),
  senderContactNo: z.string().regex(phoneRegex, "Invalid sender contact number (include country code)."),
  senderWhatsAppNo: z.string().regex(phoneRegex, "Invalid WhatsApp number (include country code).").optional().or(z.literal('')),

  packageContents: z.string().min(3, "Please briefly describe the contents of your package.").max(200),
  courierPurpose: z.enum(['gift', 'commercial', 'personal', 'sample', 'return_for_repair', 'return_after_repair', 'custom'], { required_error: "Please select the purpose of this shipment." }),
  customPurpose: z.string().max(100).optional().or(z.literal('')),

  agreedToTerms: z.boolean().refine(val => val === true, {
    message: "You must read and agree to the Terms and Conditions to proceed.",
  }),
}).refine((data) => {
    const dims = [data.length, data.width, data.height];
    const providedCount = dims.filter(d => d !== undefined && d !== '').length;
    return providedCount === 0 || providedCount === 3;
}, {
    message: "Please enter all three dimensions or leave them all blank.",
    path: ['length'],
}).refine((data) => {
    if (data.courierPurpose === 'custom') {
        return data.customPurpose && data.customPurpose.trim().length > 2;
    }
    return true;
}, {
    message: "Please specify the custom purpose.",
    path: ['customPurpose'],
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const generateBookingId = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
  const randomNumbers = Math.floor(1000 + Math.random() * 9000).toString();
  return `${randomLetter}${randomNumbers}`;
};

const TermsContent = () => (
  <div className="space-y-4 text-sm text-foreground/90">
    <p className="font-semibold text-accent">
      These conditions of carriage EXCLUDE LIABILITY on the part of Fly Cargo Lanka and its employees or agents for loss, damage and delay in certain circumstances, LIMIT LIABILITY to stated amounts where liability is accepted and REQUIRE NOTICE OF CLAIMS within strict time limits. Senders should note these conditions carefully.
    </p>

    <h3 className="text-lg font-semibold text-accent pt-2">Rates and Quotations</h3>
    <p>
      Rates and service quotations by employees and agents of Fly Cargo Lanka will be based upon information provided by the sender but final rates and service may vary based upon the shipment actually tendered and the application of these conditions. Fly Cargo Lanka is not liable for, nor will any adjustment, refund or credit of any kind be made, as a result of any discrepancy in any rate or service quotation made prior to the tender of the shipment and the rates, and other charges invoiced to the customer.
    </p>

    <h3 className="text-lg font-semibold text-accent pt-2">Dimensional Weight</h3>
    <p>
      Charges may be assessed based on dimensional weight. Dimensional weight is determined by multiplying a package's length x height x width (all in centimetres) and dividing by 5000 or such other number as specified by Fly Cargo Lanka from time to time on fedex.com. If the result exceeds the actual weight, additional charges may be assessed based on the dimensional weight. There is no limit on the aggregate weight of a multiple piece shipment provided each individual package within the shipment does not exceed the per package weight limit specified for the destination. For the bulk shipments require advance arrangement with Fly Cargo Lanka. Details are available upon request.
    </p>

    <h3 className="text-lg font-semibold text-accent pt-2">Unacceptable Items for Carriage</h3>
    <p>The following items are not acceptable for carriage to any destination at any circumstance unless otherwise agreed to by Fly Cargo Lanka.</p>
    <ul className="list-disc pl-6 space-y-1">
      <li>Money (coins, cash, currency paper money and negotiable instruments equivalent to cash such as endorsed stocks, bonds and cash letters).</li>
      <li>Explosives fireworks and other items of an incendiary or flammable nature.</li>
      <li>Human corpses, organs or body parts, human and animal embryos, cremated or disinterred human remains.</li>
      <li>Firearms, weaponry, ammunition and their parts.</li>
      <li>Foodstuffs, perishable food articles and beverages requiring refrigeration or other environmental control.</li>
      <li>Hazardous waste, including, but not limited to, used hypodermic needles and/or syringes or medical waste.</li>
      <li>Shipments requiring to obtain any special license or permit for transportation, importation or exportation.</li>
      <li>Shipments the carriage, importation or exportation of which is prohibited by any law, statute or regulation.</li>
      <li>Packages that are wet, leaking or emit an odor of any kind.</li>
    </ul>

    <h3 className="text-lg font-semibold text-accent pt-2">Packaging and Marking</h3>
     <ul className="list-disc pl-6 space-y-1">
      <li>Packages that are wrapped in kraft paper.</li>
      <li>Each package within a shipment must be legibly and durably marked with the full name and complete postal address with the PIN code and telephone number of both the shipper and the recipient. Fly Cargo Lanka shall not be liable for non-delivery on account of incomplete or erroneous address being furnished by the shipper. Further, customer is fully liable to inform us if any erroneous in tracking number not later than twenty-four (24) hours since receive the tracking number.</li>
     </ul>

    <h3 className="text-lg font-semibold text-accent pt-2">Additional Conditions</h3>
    <ul className="list-disc pl-6 space-y-1">
      <li>Rates will be updated in each month based on US dollar and Sri Lanka rupee conversion.</li>
      <li>Non commercial items such as consumables and herbal remedies has high clearance risk in certain countries like Australia and Japan. Hence, an extra vigilance and support from the receiver end will be required.</li>
      <li>An additional charge will be applicable for large packages & shipments exceeding either: weight/length & dimension. Maximum Weight and Size Limits (per piece): Weight 70 kg, Length 274 cm, Size 419 cm in length and girth (2 x width) + (2 x height)) combined.</li>
      <li>Fly Cargo Lanka is not liable for any shipments that is been held at the destination country due to customs inspections and releasing them. Also, the charges shown in the calculator is only the shipping fee and does not include any duty charges or any other charges enforced in the destination country. These charges needs to be bared by the receiver of the parcel.</li>
    </ul>
  </div>
);


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
  const [chargeableWeight, setChargeableWeight] = useState<number | null>(null);


  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      shipmentType: undefined,
      serviceType: undefined,
      locationType: undefined,
      receiverCountry: '',
      approxWeight: '' as any,
      length: '',
      width: '',
      height: '',
      approxValue: '' as any,
      receiverFullName: '',
      receiverEmail: '',
      receiverAddress: '',
      receiverDoorCode: '',
      receiverZipCode: '',
      receiverCity: '',
      receiverContactNo: '',
      receiverWhatsAppNo: '',
      senderFullName: '',
      senderAddress: '',
      senderContactNo: '',
      senderWhatsAppNo: '',
      packageContents: '',
      courierPurpose: undefined,
      customPurpose: '',
      agreedToTerms: false,
    },
  });

  const watchedShipmentType = form.watch('shipmentType');
  const watchedServiceType = form.watch('serviceType');
  const watchedReceiverCountryName = form.watch('receiverCountry');
  const watchedApproxWeight = form.watch('approxWeight');
  const watchedLength = form.watch('length');
  const watchedWidth = form.watch('width');
  const watchedHeight = form.watch('height');
  const watchedCourierPurpose = form.watch('courierPurpose');

  const showRateCalculationFields = !!(watchedShipmentType && watchedServiceType);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const ratesCol = collection(db, 'shipping_rates');
        const q = query(ratesCol, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const fetchedCountries = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as CountryRate));
        setAvailableCountries(fetchedCountries);
        if (fetchedCountries.length === 0 && showRateCalculationFields) {
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
    if (showRateCalculationFields) { // Only fetch countries if section is visible
        fetchCountries();
    } else {
        setAvailableCountries([]);
        setLoadingCountries(false);
    }
  }, [toast, showRateCalculationFields]);

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
        } else {
            form.setValue('senderFullName', userProfile.displayName || '', { shouldValidate: false });
            form.setValue('senderAddress', userProfile.address || '', { shouldValidate: false });
            form.setValue('senderContactNo', userProfile.phone || '', { shouldValidate: false });
        }
      }
    }
  }, [user, userProfile, authLoading, router, form]);

  useEffect(() => {
    const fetchWeights = async () => {
      if (!showRateCalculationFields || !watchedReceiverCountryName) {
        setAvailableWeights([]);
        if (showRateCalculationFields && !watchedReceiverCountryName) {
          setCalculatedCost(null);
          setCalculationError(null);
        }
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
        const fetchedWeights = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
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

    if (availableCountries.length > 0 || !showRateCalculationFields) { // Run if countries are loaded OR if calc fields are hidden (to clear weights)
        fetchWeights();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRateCalculationFields, watchedReceiverCountryName, availableCountries, toast]);


  useEffect(() => {
    const calculateCost = () => {
      setCalculatedCost(null);
      setCalculationError(null);
      setChargeableWeight(null);

      if (!showRateCalculationFields || !watchedShipmentType || !watchedServiceType || !watchedReceiverCountryName || !watchedApproxWeight) {
        return;
      }
      
      const approxWeightValue = Number(form.getValues('approxWeight'));
      const { length, width, height } = form.getValues();
      
      if (!approxWeightValue || approxWeightValue <= 0) {
        setCalculationError("Approximate weight must be positive.");
        return;
      }

      if (availableCountries.length === 0 && !loadingCountries) {
          setCalculationError("No destination countries configured for shipping.");
          return;
      }

      if (availableWeights.length === 0 && !loadingWeights && watchedReceiverCountryName) {
          setCalculationError(`No shipping weights configured for ${watchedReceiverCountryName}.`);
          return;
      }

      if (!watchedReceiverCountryName && (loadingCountries || availableCountries.length > 0) ) {
          return;
      }

      if (availableWeights.length === 0 && !loadingWeights) {
        setCalculationError(`No shipping weights configured for ${watchedReceiverCountryName}.`);
        return;
      }
      
      let finalChargeableWeight = approxWeightValue;
      const l = Number(length);
      const w = Number(width);
      const h = Number(height);
      if (l > 0 && w > 0 && h > 0) {
          const volumetricWeight = (l * w * h) / 5000;
          finalChargeableWeight = Math.max(finalChargeableWeight, volumetricWeight);
      }
      setChargeableWeight(finalChargeableWeight);

      const sortedWeights = [...availableWeights].sort((a, b) => a.weightValue - b.weightValue);
      let selectedWeightBand: WeightRate | undefined = undefined;

      for (const band of sortedWeights) {
        if (finalChargeableWeight <= band.weightValue) {
          selectedWeightBand = band;
          break;
        }
      }

      if(!selectedWeightBand && sortedWeights.length > 0) {
        selectedWeightBand = sortedWeights[sortedWeights.length - 1];
         setCalculationError(`Weight exceeds max band. Using rate for ${selectedWeightBand.weightLabel}.`);
      }

      if (!selectedWeightBand) {
        setCalculationError(`No suitable weight band found for ${finalChargeableWeight.toFixed(2)}kg.`);
        return;
      }

      let price: number | null | undefined = null;
      let serviceAvailable = false;
      const currency = "LKR";

      if (watchedShipmentType === 'parcel') {
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
        setCalculatedCost(null);
        setCalculationError(`Selected ${watchedServiceType} service for ${watchedShipmentType} is not available for this weight band.`);
      } else if (price === null || price === undefined) {
        setCalculatedCost(null);
        setCalculationError(`Price not configured for ${watchedShipmentType} ${watchedServiceType} at ${selectedWeightBand.weightLabel}.`);
      } else {
        setCalculatedCost(`Estimated Cost: ${price.toLocaleString()} ${currency}`);
      }
    };

    if (!loadingCountries && !loadingWeights) {
        calculateCost();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
      showRateCalculationFields,
      watchedShipmentType,
      watchedServiceType,
      watchedReceiverCountryName,
      watchedApproxWeight,
      watchedLength,
      watchedWidth,
      watchedHeight,
      availableWeights,
      loadingCountries,
      loadingWeights,
      availableCountries
  ]);


  const onSubmit: SubmitHandler<BookingFormValues> = async (data) => {
    if (isSubmitting || showProfileCompletionAlert || !user || !userProfile) return;
    setIsSubmitting(true);

    let finalChargeableWeight = data.approxWeight;
    const { length, width, height } = data;
    if (length && width && height) {
        const volumetricWeight = (Number(length) * Number(width) * Number(height)) / 5000;
        finalChargeableWeight = Math.max(data.approxWeight, volumetricWeight);
    }

    let numericCost: number | null = null;
    if (calculatedCost && !calculationError) {
        const costMatch = calculatedCost.match(/Estimated Cost: ([\d,.]+)\s*LKR/);
        if (costMatch && costMatch[1]) {
            numericCost = parseFloat(costMatch[1].replace(/,/g, ''));
        }
    }

    try {
      const newBookingId = generateBookingId();
      const bookingData = {
        ...data,
        id: newBookingId,
        userId: user.uid,
        userEmail: user.email,
        status: 'Pending' as 'Pending' | 'In Transit' | 'Delivered' | 'Cancelled',
        createdAt: serverTimestamp(),
        packageDescription: `${data.courierPurpose}: ${data.packageContents.substring(0, 100)}`,
        packageWeight: data.approxWeight,
        chargeableWeight: finalChargeableWeight,
        senderName: data.senderFullName,
        receiverName: data.receiverFullName,
        estimatedCostLKR: numericCost,
        nicVerificationStatus: userProfile?.nicVerificationStatus || 'none',
      };
      
      delete (bookingData as any).agreedToTerms;


      const bookingDocRef = doc(db, 'bookings', newBookingId);
      await setDoc(bookingDocRef, bookingData);

      // Create notification for admins
      await addDoc(collection(db, 'notifications'), {
        type: 'new_booking',
        message: `New booking (#${newBookingId}) received from ${data.senderFullName}.`,
        link: `/admin/orders`,
        isRead: false,
        recipient: 'admins',
        createdAt: serverTimestamp()
      });


      toast({
        title: "Booking Submitted!",
        description: `Your shipment details (ID: ${newBookingId}) have been received.`,
        variant: "default",
        action: <CheckCircle2 className="text-green-500" />,
      });
      form.reset();
      setCalculatedCost(null);
      setCalculationError(null);
       if (userProfile) {
        if (userProfile.isProfileComplete) {
            form.setValue('senderFullName', userProfile.displayName || '');
            form.setValue('senderAddress', userProfile.address || '');
            form.setValue('senderContactNo', userProfile.phone || '');
        } else {
            form.setValue('senderFullName', userProfile.displayName || '', { shouldValidate: false });
            form.setValue('senderAddress', userProfile.address || '', { shouldValidate: false });
            form.setValue('senderContactNo', userProfile.phone || '', { shouldValidate: false });
        }
      }

      if (userProfile.nicVerificationStatus === 'none' || userProfile.nicVerificationStatus === 'rejected') {
        router.push('/book/verify-nic');
      } else {
        router.push('/my-bookings');
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
              <CardTitle className="text-xl font-headline text-accent flex items-center"><Package className="mr-2 h-6 w-6 text-primary" />Shipment Details &amp; Cost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="shipmentType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">Shipment Type</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={(value) => { field.onChange(value); form.setValue('receiverCountry', ''); form.setValue('approxWeight', '' as any); setCalculatedCost(null); setCalculationError(null); setAvailableWeights([]); }} defaultValue={field.value} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
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
                      <RadioGroup onValueChange={(value) => { field.onChange(value); form.setValue('receiverCountry', ''); form.setValue('approxWeight', '' as any); setCalculatedCost(null); setCalculationError(null); setAvailableWeights([]); }} defaultValue={field.value} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
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
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="dropoff_katunayake" id="dropoff_katunayake" /></FormControl><FormLabel htmlFor="dropoff_katunayake" className="font-normal flex items-center"><Building className="mr-1.5 h-4 w-4 text-muted-foreground"/>Drop Off – Katunayake</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl><FormMessage />
                  </FormItem>
              )} />

              {showRateCalculationFields && (
                <div className="space-y-4 pt-4 mt-4 border-t border-border/30">
                  <h3 className="text-lg font-semibold text-muted-foreground flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary" />Destination &amp; Weight for Rate Calculation</h3>
                  <FormField control={form.control} name="receiverCountry" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Destination Country</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('approxWeight', '' as any);
                          setCalculatedCost(null);
                          setCalculationError(null);
                          setAvailableWeights([]);
                        }}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={loadingCountries || availableCountries.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingCountries ? "Loading countries..." : "Select a country"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCountries.map((country) => (
                            <SelectItem key={country.id} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="approxWeight" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approximate Weight (KG)</FormLabel>
                      <FormControl><Input type="number" step="0.01" min="0.01" placeholder="e.g., 2.5" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="space-y-4 pt-4 border-t">
                      <FormLabel className="flex items-center"><Box className="mr-2 h-5 w-5 text-muted-foreground"/>Package Dimensions (cm) (Optional)</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField control={form.control} name="length" render={({ field }) => (
                          <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">Length</FormLabel>
                              <FormControl><Input type="number" step="0.01" min="0.01" placeholder="L" {...field} value={field.value ?? ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )} />
                          <FormField control={form.control} name="width" render={({ field }) => (
                          <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">Width</FormLabel>
                              <FormControl><Input type="number" step="0.01" min="0.01" placeholder="W" {...field} value={field.value ?? ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )} />
                          <FormField control={form.control} name="height" render={({ field }) => (
                          <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">Height</FormLabel>
                              <FormControl><Input type="number" step="0.01" min="0.01" placeholder="H" {...field} value={field.value ?? ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )} />
                      </div>
                      <FormDescription className="text-xs">
                          Provide dimensions to calculate volumetric weight. The greater of actual vs. volumetric weight (L×W×H/5000) will be used for rate calculation.
                      </FormDescription>
                  </div>
                  <FormField control={form.control} name="approxValue" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approximate Value of Goods (USD)</FormLabel>
                      <FormControl><Input type="number" step="0.01" min="1" placeholder="e.g., 50.00" {...field} value={field.value ?? ''} /></FormControl>
                      <FormDescription>For customs clearance purposes only.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
            </CardContent>
             {(calculatedCost || calculationError || (showRateCalculationFields && (loadingWeights || (loadingCountries && !watchedReceiverCountryName)))) && (
                <CardFooter className={`mt-0 p-4 rounded-b-md ${calculationError ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                    <div className="text-center w-full space-y-2">
                        {(loadingWeights || (loadingCountries && !watchedReceiverCountryName && showRateCalculationFields)) ? (
                            <div className="flex items-center justify-center text-muted-foreground">
                                <Loader2 className="mr-2 h-5 w-5 animate-spin"/> {(loadingCountries && !watchedReceiverCountryName) ? "Loading countries..." : "Loading rates..."}
                            </div>
                        ) : calculationError ? (
                            <p className="text-destructive flex items-center justify-center"><AlertTriangle className="mr-2 h-5 w-5"/> {calculationError}</p>
                        ) : calculatedCost ? (
                            <div>
                                <h3 className="text-lg font-semibold text-accent flex items-center justify-center"><DollarSign className="mr-2 h-5 w-5 text-primary"/>{calculatedCost}</h3>
                                {chargeableWeight && Math.abs(chargeableWeight - Number(form.getValues('approxWeight'))) > 0.001 && (
                                    <p className="text-xs text-muted-foreground mt-1">Based on chargeable weight of {chargeableWeight.toFixed(2)} kg.</p>
                                )}
                                <div className="mt-4 text-left text-xs text-muted-foreground space-y-2">
                                    {watchedServiceType === 'express' && (
                                        <ul className="space-y-1.5">
                                            <li className="flex items-start"><CheckCircle2 className="h-4 w-4 text-primary/80 mr-2 mt-0.5 shrink-0" /><span><strong>Duration:</strong> 3-5 working days</span></li>
                                            <li className="flex items-start"><CheckCircle2 className="h-4 w-4 text-primary/80 mr-2 mt-0.5 shrink-0" /><span><strong>Tracking:</strong> End-to-end updates. (The tracking number will be provided to you within the day of delivery of the parcel.)</span></li>
                                            <li className="flex items-start"><CheckCircle2 className="h-4 w-4 text-primary/80 mr-2 mt-0.5 shrink-0" /><span><strong>Insurance:</strong> Free insurance</span></li>
                                        </ul>
                                    )}
                                    {watchedServiceType === 'economy' && (
                                        <ul className="space-y-1.5">
                                            <li className="flex items-start"><CheckCircle2 className="h-4 w-4 text-primary/80 mr-2 mt-0.5 shrink-0" /><span><strong>Duration:</strong> 14 to 16 working days</span></li>
                                            <li className="flex items-start"><CheckCircle2 className="h-4 w-4 text-primary/80 mr-2 mt-0.5 shrink-0" /><span><strong>Tracking:</strong> End To End traking update. (You will be provided with a tracking number within 10 days of the parcel being delivered.)</span></li>
                                            <li className="flex items-start"><CheckCircle2 className="h-4 w-4 text-primary/80 mr-2 mt-0.5 shrink-0" /><span><strong>Insurance:</strong> Free insurance</span></li>
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </CardFooter>
            )}
          </Card>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-accent flex items-center"><FileText className="mr-2 h-6 w-6 text-primary"/>Airway Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center"><User className="mr-2 h-5 w-5"/>Receiver Details</h3>
                <div className="space-y-4">
                  <FormField control={form.control} name="receiverFullName" render={({ field }) => ( <FormItem><FormLabel>Full Name (as per passport)</FormLabel><FormControl><Input placeholder="John Michael Doe" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="receiverEmail" render={({ field }) => ( <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input type="email" placeholder="receiver@example.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="receiverAddress" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="123 Global St, Apt 4B" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="receiverDoorCode" render={({ field }) => ( <FormItem><FormLabel>Door Code / Access Code / Floor Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., #1234, Floor 5" {...field} value={field.value ?? ''} /></FormControl><FormDescription className="text-xs">Address without door code will be delivered to the nearest parcel point.</FormDescription><FormMessage /></FormItem> )} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="receiverZipCode" render={({ field }) => ( <FormItem><FormLabel>ZIP / Postal Code</FormLabel><FormControl><Input placeholder="e.g., 90210" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="receiverCity" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Springfield" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="receiverContactNo" render={({ field }) => ( <FormItem><FormLabel>Contact No (with country code)</FormLabel><FormControl><Input type="tel" placeholder="+1 555 123 4567" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="receiverWhatsAppNo" render={({ field }) => ( <FormItem><FormLabel>WhatsApp No (with country code, Optional)</FormLabel><FormControl><Input type="tel" placeholder="+1 555 123 4567" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                </div>
              </div>

              <hr className="my-6 border-border/50" />

              <div>
                <h3 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center"><User className="mr-2 h-5 w-5"/>Sender Details</h3>
                <div className="space-y-4">
                  <FormField control={form.control} name="senderFullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} value={field.value ?? ''} readOnly={!!userProfile?.displayName && !!userProfile?.isProfileComplete} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="senderAddress" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Your Address" {...field} value={field.value ?? ''} readOnly={!!userProfile?.address && !!userProfile?.isProfileComplete} /></FormControl><FormMessage /></FormItem> )} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="senderContactNo" render={({ field }) => ( <FormItem><FormLabel>Contact No (with country code)</FormLabel><FormControl><Input type="tel" placeholder="Your Contact No." {...field} value={field.value ?? ''} readOnly={!!userProfile?.phone && !!userProfile?.isProfileComplete} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="senderWhatsAppNo" render={({ field }) => ( <FormItem><FormLabel>WhatsApp No (with country code, Optional)</FormLabel><FormControl><Input type="tel" placeholder="Your WhatsApp No." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                </div>
              </div>

               <hr className="my-6 border-border/50" />

                <div>
                    <h3 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center"><Box className="mr-2 h-5 w-5"/>Package Information</h3>
                    <div className="space-y-4">
                        <FormField control={form.control} name="packageContents" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel>What is inside the box?</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., Cotton T-shirts, books, documents" {...field} />
                                </FormControl>
                                <FormDescription>Briefly describe the contents for customs purposes.</FormDescription>
                                <FormMessage />
                            </FormItem> 
                        )} />

                        <FormField control={form.control} name="courierPurpose" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Purpose of Courier</FormLabel>
                                <FormControl>
                                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="gift" /></FormControl><FormLabel className="font-normal">Gift</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="commercial" /></FormControl><FormLabel className="font-normal">Commercial</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="personal" /></FormControl><FormLabel className="font-normal">Personal</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="sample" /></FormControl><FormLabel className="font-normal">Sample</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="return_for_repair" /></FormControl><FormLabel className="font-normal">Return for Repair</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="return_after_repair" /></FormControl><FormLabel className="font-normal">Return after Repair</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="custom" /></FormControl><FormLabel className="font-normal">Custom</FormLabel></FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        {watchedCourierPurpose === 'custom' && (
                            <FormField control={form.control} name="customPurpose" render={({ field }) => ( 
                                <FormItem className="opacity-0 animate-fadeInUp">
                                    <FormLabel>Custom Purpose</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Please specify the purpose" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem> 
                            )} />
                        )}
                    </div>
                </div>

            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-accent flex items-center"><CheckCircle2 className="mr-2 h-6 w-6 text-primary"/>Declaration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog>
                <FormField
                  control={form.control}
                  name="agreedToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                          I have read and agree to the{' '}
                          <DialogTrigger asChild>
                            <span className="text-primary font-semibold hover:underline cursor-pointer">
                              Terms and Conditions
                            </span>
                          </DialogTrigger>
                          .
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <DialogContent className="sm:max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Terms and Conditions</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="pr-4 -mr-4 h-[60vh]">
                    <TermsContent />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
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
