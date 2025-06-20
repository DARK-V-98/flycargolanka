
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, type Timestamp } from 'firebase/firestore';
import type { CountryRate, WeightRate } from '@/types/shippingRates';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { Calculator, Package, FileText, Clock, Zap, Globe, Weight, Loader2, AlertTriangle, DollarSign } from 'lucide-react';

const calculatorSchema = z.object({
  shipmentType: z.enum(['parcel', 'document'], { required_error: "Please select a shipment type." }),
  serviceType: z.enum(['economy', 'express'], { required_error: "Please select a service type." }),
  destinationCountry: z.string().min(1, "Please select a destination country."),
  weight: z.coerce.number().positive("Weight must be a positive number.").min(0.01, "Weight must be at least 0.01 KG."),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

export default function ShippingCalculatorForm() {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState<string | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const [availableCountries, setAvailableCountries] = useState<CountryRate[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [availableWeights, setAvailableWeights] = useState<WeightRate[]>([]);
  const [loadingWeights, setLoadingWeights] = useState(false);
  
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      shipmentType: undefined,
      serviceType: undefined,
      destinationCountry: '',
      weight: undefined,
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
      setAvailableWeights([]); // Reset weights when country changes
      setCalculatedCost(null); // Reset cost
      setCalculationError(null); // Reset error

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
    setCalculatedCost(null);
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

    const sortedWeights = [...availableWeights].sort((a, b) => a.weightValue - b.weightValue);
    let selectedWeightBand: WeightRate | undefined = undefined;

    for (const band of sortedWeights) {
      if (data.weight <= band.weightValue) {
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
      setCalculationError(`No suitable weight band found for ${data.weight}kg in ${data.destinationCountry}.`);
      setIsCalculating(false);
      return;
    }

    let price: number | null | undefined = null;
    let serviceAvailable = false;
    const currency = "LKR";

    if (data.shipmentType === 'parcel') { // 'parcel' matches 'non-document'
      if (data.serviceType === 'economy') {
        serviceAvailable = selectedWeightBand.isNdEconomyEnabled ?? false;
        price = selectedWeightBand.ndEconomyPrice;
      } else if (data.serviceType === 'express') {
        serviceAvailable = selectedWeightBand.isNdExpressEnabled ?? false;
        price = selectedWeightBand.ndExpressPrice;
      }
    } else if (data.shipmentType === 'document') {
      if (data.serviceType === 'economy') {
        serviceAvailable = selectedWeightBand.isDocEconomyEnabled ?? false;
        price = selectedWeightBand.docEconomyPrice;
      } else if (data.serviceType === 'express') {
        serviceAvailable = selectedWeightBand.isDocExpressEnabled ?? false;
        price = selectedWeightBand.docExpressPrice;
      }
    }
    
    if (!serviceAvailable) {
      setCalculationError(`The selected ${data.serviceType} service for ${data.shipmentType} is not available for this weight/destination.`);
    } else if (price === null || price === undefined) {
      setCalculationError(`Price not configured for ${data.shipmentType} ${data.serviceType} service at ${selectedWeightBand.weightLabel}.`);
    } else {
      setCalculatedCost(`Estimated Cost: ${price.toLocaleString()} ${currency}`);
    }

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
              name="shipmentType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold flex items-center"><Package className="mr-2 h-5 w-5 text-muted-foreground"/>Shipment Type</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="parcel" id="calc_parcel" /></FormControl><FormLabel htmlFor="calc_parcel" className="font-normal">Parcel</FormLabel></FormItem>
                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="document" id="calc_document" /></FormControl><FormLabel htmlFor="calc_document" className="font-normal">Document</FormLabel></FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold flex items-center"><Clock className="mr-2 h-5 w-5 text-muted-foreground"/>Service Type</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="economy" id="calc_economy" /></FormControl><FormLabel htmlFor="calc_economy" className="font-normal">Economy</FormLabel></FormItem>
                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="express" id="calc_express" /></FormControl><FormLabel htmlFor="calc_express" className="font-normal flex items-center"><Zap className="mr-1.5 h-4 w-4 text-muted-foreground"/>Express</FormLabel></FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destinationCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Globe className="mr-2 h-5 w-5 text-muted-foreground"/>Destination Country</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); setCalculatedCost(null); setCalculationError(null); setAvailableWeights([]);}} defaultValue={field.value} disabled={loadingCountries || availableCountries.length === 0}>
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
                  <FormLabel className="flex items-center"><Weight className="mr-2 h-5 w-5 text-muted-foreground"/>Package Weight (KG)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min="0.01" placeholder="e.g., 1.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" size="lg" disabled={isCalculating || loadingCountries || loadingWeights}>
              {isCalculating ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Calculating...</>
              ) : (
                "Calculate Cost"
              )}
            </Button>
            {(calculatedCost || calculationError) && (
              <div className={`mt-4 p-4 rounded-md w-full text-center ${calculationError ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                {calculationError ? (
                  <p className="text-destructive flex items-center justify-center"><AlertTriangle className="mr-2 h-5 w-5"/> {calculationError}</p>
                ) : calculatedCost ? (
                  <h3 className="text-lg font-semibold text-accent flex items-center justify-center"><DollarSign className="mr-2 h-5 w-5 text-primary"/>{calculatedCost}</h3>
                ) : null}
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

