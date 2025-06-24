
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { CountryRate, WeightRate } from '@/types/shippingRates';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Globe, Weight, Loader2, AlertTriangle, DollarSign, Package, FileText, Clock, Zap } from 'lucide-react';

const calculatorSchema = z.object({
  destinationCountry: z.string().min(1, "Please select a destination country."),
  weight: z.coerce.number().positive("Weight must be a positive number.").min(0.01, "Weight must be at least 0.01 KG."),
});


type CalculatorFormValues = z.infer<typeof calculatorSchema>;

interface RateOption {
  shipmentType: 'Parcel' | 'Document';
  serviceType: 'Economy' | 'Express';
  price: number;
  icon: React.ElementType;
  typeIcon: React.ElementType;
}

export default function ShippingCalculatorForm() {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [rateOptions, setRateOptions] = useState<RateOption[]>([]);


  const [availableCountries, setAvailableCountries] = useState<CountryRate[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [availableWeights, setAvailableWeights] = useState<WeightRate[]>([]);
  const [loadingWeights, setLoadingWeights] = useState(false);
  
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      destinationCountry: '',
      weight: '' as any,
    },
  });

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
        setCalculationError("Error loading destination countries.");
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, [toast]);

  const watchedDestinationCountryName = form.watch('destinationCountry');

  useEffect(() => {
    const fetchWeights = async () => {
      if (!watchedDestinationCountryName) {
        setAvailableWeights([]);
        return;
      }
      setLoadingWeights(true);
      setAvailableWeights([]);
      setRateOptions([]);
      setCalculationError(null);

      const selectedCountry = availableCountries.find(c => c.name === watchedDestinationCountryName);
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
        console.error(`Error fetching weights for ${selectedCountry.name}:`, error);
        toast({ title: "Error", description: `Could not load weights for ${selectedCountry.name}.`, variant: "destructive" });
        setCalculationError(`Error fetching rates for ${selectedCountry.name}.`);
      } finally {
        setLoadingWeights(false);
      }
    };

    if (watchedDestinationCountryName && availableCountries.length > 0) {
      fetchWeights();
    }
  }, [watchedDestinationCountryName, availableCountries, toast]);


  const onSubmit: SubmitHandler<CalculatorFormValues> = async (data) => {
    setIsCalculating(true);
    setRateOptions([]);
    setCalculationError(null);

    if (availableWeights.length === 0) {
      setCalculationError(`No weight rates available for ${data.destinationCountry}. Cannot calculate cost.`);
      setIsCalculating(false);
      return;
    }
    
    if (data.weight <=0) {
        setCalculationError("Weight must be a positive value.");
        setIsCalculating(false);
        return;
    }
    
    const { weight } = data;
    const finalChargeableWeight = weight;

    const sortedWeights = [...availableWeights].sort((a, b) => a.weightValue - b.weightValue);
    let selectedWeightBand: WeightRate | undefined = undefined;

    for (const band of sortedWeights) {
      if (finalChargeableWeight <= band.weightValue) {
        selectedWeightBand = band;
        break;
      }
    }

    if (!selectedWeightBand && sortedWeights.length > 0) {
        selectedWeightBand = sortedWeights[sortedWeights.length - 1];
        toast({
          title: "Weight Exceeds Maximum",
          description: `Weight exceeds max configured band. Using rate for ${selectedWeightBand.weightLabel}.`,
          variant: "default",
        })
    }

    if (!selectedWeightBand) {
      setCalculationError(`No suitable weight band found for ${finalChargeableWeight.toFixed(2)}kg in ${data.destinationCountry}.`);
      setIsCalculating(false);
      return;
    }

    const options: RateOption[] = [];
    const {
        isNdEconomyEnabled, ndEconomyPrice,
        isNdExpressEnabled, ndExpressPrice,
        isDocEconomyEnabled, docEconomyPrice,
        isDocExpressEnabled, docExpressPrice,
    } = selectedWeightBand;

    if (isNdEconomyEnabled && ndEconomyPrice != null) {
      options.push({ shipmentType: 'Parcel', serviceType: 'Economy', price: ndEconomyPrice, icon: Clock, typeIcon: Package });
    }
    if (isNdExpressEnabled && ndExpressPrice != null) {
      options.push({ shipmentType: 'Parcel', serviceType: 'Express', price: ndExpressPrice, icon: Zap, typeIcon: Package });
    }
    if (isDocEconomyEnabled && docEconomyPrice != null) {
      options.push({ shipmentType: 'Document', serviceType: 'Economy', price: docEconomyPrice, icon: Clock, typeIcon: FileText });
    }
    if (isDocExpressEnabled && docExpressPrice != null) {
      options.push({ shipmentType: 'Document', serviceType: 'Express', price: docExpressPrice, icon: Zap, typeIcon: FileText });
    }

    if (options.length === 0) {
      setCalculationError("No services are available for the selected weight and destination.");
    }
    
    setRateOptions(options);
    setIsCalculating(false);
  };
  
  const handleInvalidSubmit = (errors: any) => {
    const firstErrorKey = Object.keys(errors)[0];
    const firstErrorMessage = errors[firstErrorKey]?.message || "Please correct the form errors.";
    toast({
        title: "Invalid Input",
        description: firstErrorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-accent flex items-center">
            <Calculator className="mr-3 h-7 w-7 text-primary" /> Estimate Your Shipping Cost
          </CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="destinationCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Globe className="mr-2 h-5 w-5 text-muted-foreground"/>Destination Country</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); setRateOptions([]); setCalculationError(null); setAvailableWeights([]); }} defaultValue={field.value} disabled={loadingCountries || availableCountries.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={ loadingCountries ? "Loading countries..." : (availableCountries.length === 0 ? "No countries available" : "Select destination country") } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCountries.map(country => (
                          <SelectItem key={country.id} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Weight className="mr-2 h-5 w-5 text-muted-foreground"/>Actual Package Weight (KG)</FormLabel>
                    <FormControl><Input type="number" step="0.01" min="0.01" placeholder="e.g., 1.5" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" size="lg" disabled={isCalculating || loadingCountries || (loadingWeights && !!watchedDestinationCountryName)}>
                {isCalculating || (loadingWeights && !!watchedDestinationCountryName) ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Calculating...</>
                ) : (
                  "Calculate Cost"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      {isCalculating && (
        <div className="flex justify-center items-center mt-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Finding best rates...</p>
        </div>
      )}

      {calculationError && (
        <Alert variant="destructive" className="max-w-2xl mx-auto mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{calculationError}</AlertDescription>
        </Alert>
      )}

      {rateOptions.length > 0 && !calculationError && (
        <div className="max-w-4xl mx-auto mt-8 opacity-0 animate-fadeInUp">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-2 font-headline text-accent">Available Services</h3>
            <p className="text-center text-muted-foreground mb-6">Rates based on package weight of <strong>{form.getValues('weight')} kg</strong>.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rateOptions.map((option, index) => {
                  const TypeIcon = option.typeIcon;
                  const ServiceIcon = option.icon;
                  return (
                    <Card key={index} className="flex flex-col text-center shadow-lg hover:shadow-2xl transition-shadow duration-300 hover:scale-105">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2 text-xl font-semibold">
                                <TypeIcon className="h-6 w-6 text-primary"/>
                                {option.shipmentType}
                            </CardTitle>
                             <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                <ServiceIcon className="h-4 w-4"/>
                                {option.serviceType} Service
                             </p>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col items-center justify-center">
                            <p className="text-sm text-muted-foreground">Estimated Cost</p>
                            <p className="text-4xl font-bold text-primary mt-1">{option.price.toLocaleString()} <span className="text-lg font-medium text-muted-foreground">LKR</span></p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/book">Book Now</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )})}
            </div>
        </div>
      )}
    </div>
  );
}
