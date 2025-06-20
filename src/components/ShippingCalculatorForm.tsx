
"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, AlertTriangle } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore"; // where might be needed if we re-introduce type filtering later
import type { CountryRate, WeightRate, RateType } from "@/types/shippingRates";
import { useToast } from "@/hooks/use-toast";

const calculatorSchema = z.object({
  shipmentType: z.enum(['document', 'non-document'], { required_error: "Please select a shipment type." }),
  countryId: z.string().min(1, "Please select a country."),
  weightId: z.string().min(1, "Please select a package weight."),
  deliveryType: z.enum(['economy', 'express'], { required_error: "Please select a delivery type." }),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

export default function ShippingCalculatorForm() {
  const [countries, setCountries] = useState<CountryRate[]>([]);
  const [weights, setWeights] = useState<WeightRate[]>([]);
  // selectedShipmentType is now directly from form.watch
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  
  const [calculatedCost, setCalculatedCost] = useState<string | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      shipmentType: undefined,
      countryId: '',
      weightId: '',
      deliveryType: undefined,
    },
  });

  const watchedShipmentType = form.watch("shipmentType");

  // Fetch countries (no longer filtered by type at this stage)
  useEffect(() => {
    const fetchAllCountries = async () => {
      setLoadingCountries(true);
      setCountries([]);
      form.resetField("countryId");
      form.resetField("weightId");
      setSelectedCountryId(null);
      setWeights([]);
      setCalculatedCost(null);
      setFormError(null);
      try {
        const ratesCol = collection(db, 'shipping_rates');
        const q = query(ratesCol, orderBy('name', 'asc')); // Fetch all countries
        const snapshot = await getDocs(q);
        const fetchedCountries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CountryRate));
        setCountries(fetchedCountries);
        if (fetchedCountries.length === 0) {
          setFormError(`No countries configured in the system.`);
        }
      } catch (error) {
        console.error(`Error fetching countries:`, error);
        setFormError(`Could not load countries.`);
        toast({ title: "Error", description: `Could not load countries.`, variant: "destructive" });
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchAllCountries();
  }, [form, toast]); // Only re-run if form instance changes (rare) or toast changes (for error display)

  // Fetch weights based on selected country
  useEffect(() => {
    if (selectedCountryId) {
      const fetchWeights = async () => {
        setLoadingWeights(true);
        setWeights([]); 
        form.resetField("weightId"); 
        setCalculatedCost(null); 
        setFormError(null);
        try {
          const weightsColRef = collection(db, 'shipping_rates', selectedCountryId, 'weights');
          const q = query(weightsColRef, orderBy('weightValue', 'asc')); 
          const snapshot = await getDocs(q);
          const fetchedWeights = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as WeightRate));
          setWeights(fetchedWeights);
          if (fetchedWeights.length === 0) {
            setFormError(`No shipping weights configured for the selected country.`);
          }
        } catch (error) {
          console.error("Error fetching weights:", error);
          setFormError("Could not load weights for the selected country.");
          toast({ title: "Error", description: "Could not load weights for this country.", variant: "destructive" });
        } finally {
          setLoadingWeights(false);
        }
      };
      fetchWeights();
    } else {
      setWeights([]); 
      form.resetField("weightId");
    }
  }, [selectedCountryId, form, toast]);


  const onSubmit: SubmitHandler<CalculatorFormValues> = (data) => {
    setCalculatedCost(null); 
    setFormError(null);

    const selectedWeightEntry = weights.find(w => w.id === data.weightId);

    if (!selectedWeightEntry) {
      setFormError("Selected weight details not found. Please re-select.");
      toast({ title: "Error", description: "Weight details not found.", variant: "destructive" });
      return;
    }

    let price: number | null | undefined = null;
    let currency = "LKR"; 
    let serviceAvailable = false; // Default to false, prove it's available

    if (data.shipmentType === 'non-document') {
      if (data.deliveryType === 'economy') {
        serviceAvailable = selectedWeightEntry.isNdEconomyEnabled ?? false;
        price = selectedWeightEntry.ndEconomyPrice;
      } else if (data.deliveryType === 'express') {
        serviceAvailable = selectedWeightEntry.isNdExpressEnabled ?? false;
        price = selectedWeightEntry.ndExpressPrice;
      }
    } else if (data.shipmentType === 'document') {
      if (data.deliveryType === 'economy') {
        serviceAvailable = selectedWeightEntry.isDocEconomyEnabled ?? false;
        price = selectedWeightEntry.docEconomyPrice;
      } else if (data.deliveryType === 'express') {
        serviceAvailable = selectedWeightEntry.isDocExpressEnabled ?? false;
        price = selectedWeightEntry.docExpressPrice;
      }
    }

    if (!serviceAvailable) {
      setCalculatedCost(`The selected ${data.deliveryType} service for ${data.shipmentType} is not available for this weight/destination.`);
    } else if (price === null || price === undefined) {
      setCalculatedCost(`Price not configured for ${data.shipmentType} ${data.deliveryType} service on this weight.`);
    } else {
      setCalculatedCost(`Estimated Cost: ${price.toLocaleString()} ${currency}`);
    }
  };
  
  const handleInvalidSubmit = (errors: any) => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
        const message = errors[firstErrorKey]?.message || "Please correct the form errors.";
        toast({
            title: "Invalid Input",
            description: message,
            variant: "destructive"
        });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-xl opacity-0 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="shipmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipment Type</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset dependent fields when shipment type changes
                      form.resetField("countryId");
                      form.resetField("weightId");
                      setSelectedCountryId(null);
                      setWeights([]);
                      setCalculatedCost(null);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shipment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="non-document">Non-Document (Package)</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Country</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCountryId(value);
                    }} 
                    defaultValue={field.value}
                    disabled={!watchedShipmentType || loadingCountries || countries.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !watchedShipmentType ? "Select shipment type first" :
                          loadingCountries ? "Loading countries..." : 
                          (countries.length === 0 && !loadingCountries) ? `No countries configured` :
                          "Select a country"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weightId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Weight</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!selectedCountryId || loadingWeights || weights.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedCountryId ? "Select country first" :
                          loadingWeights ? "Loading weights..." : 
                          (weights.length === 0 && !loadingWeights) ? "No weights for this country" :
                          "Select package weight"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {weights.map(weight => (
                        <SelectItem key={weight.id} value={weight.id}>{weight.weightLabel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!form.watch("weightId")} 
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={!form.watch("weightId") ? "Select weight first" : "Select delivery type"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="express">Express</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                size="lg" 
                disabled={loadingCountries || loadingWeights || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : null}
              Calculate Cost
            </Button>
          </form>
        </Form>
      </CardContent>
      {formError && (
        <CardFooter className="mt-4 bg-destructive/10 p-4 rounded-md opacity-0 animate-fadeInUp">
           <div className="text-center w-full flex items-center justify-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5"/> {formError}
          </div>
        </CardFooter>
      )}
      {calculatedCost && !formError && (
        <CardFooter className="mt-6 bg-primary/10 p-6 rounded-md opacity-0 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <div className="text-center w-full">
            <h3 className="text-xl font-semibold text-accent">{calculatedCost}</h3>
            <p className="text-sm text-muted-foreground mt-1">This is an estimate. Actual costs may vary.</p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

