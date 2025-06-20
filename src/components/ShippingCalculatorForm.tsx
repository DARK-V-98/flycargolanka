
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
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
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
  const [selectedShipmentType, setSelectedShipmentType] = useState<RateType | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  
  const [calculatedCost, setCalculatedCost] = useState<string | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(false); // Initially true for first load, then false for subsequent type changes
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

  // Fetch countries based on selected shipment type
  useEffect(() => {
    if (selectedShipmentType) {
      const fetchCountriesByType = async () => {
        setLoadingCountries(true);
        setCountries([]); // Clear previous countries
        form.resetField("countryId"); // Reset country selection
        form.resetField("weightId"); // Reset weight selection
        setSelectedCountryId(null);
        setWeights([]);
        setCalculatedCost(null);
        setFormError(null);
        try {
          const ratesCol = collection(db, 'shipping_rates');
          const q = query(ratesCol, where('type', '==', selectedShipmentType), orderBy('name', 'asc'));
          const snapshot = await getDocs(q);
          const fetchedCountries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as CountryRate));
          setCountries(fetchedCountries);
          if (fetchedCountries.length === 0) {
            setFormError(`No countries configured for ${selectedShipmentType} shipments.`);
          }
        } catch (error) {
          console.error(`Error fetching ${selectedShipmentType} countries:`, error);
          setFormError(`Could not load countries for ${selectedShipmentType} shipments.`);
          toast({ title: "Error", description: `Could not load countries for ${selectedShipmentType}.`, variant: "destructive" });
        } finally {
          setLoadingCountries(false);
        }
      };
      fetchCountriesByType();
    } else {
      setCountries([]);
      form.resetField("countryId");
    }
  }, [selectedShipmentType, form, toast]);

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
    let serviceAvailable = true;

    if (data.deliveryType === 'economy') {
      if (!selectedWeightEntry.isEconomyEnabled) {
        serviceAvailable = false;
      } else {
        price = selectedWeightEntry.economyPrice;
      }
    } else if (data.deliveryType === 'express') {
      if (!selectedWeightEntry.isExpressEnabled) {
        serviceAvailable = false;
      } else {
        price = selectedWeightEntry.expressPrice;
      }
    }

    if (!serviceAvailable) {
      setCalculatedCost(`The ${data.deliveryType} service is not available for this selection.`);
    } else if (price === null || price === undefined) {
      setCalculatedCost(`Price not configured for ${data.deliveryType} service on this weight.`);
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
                      setSelectedShipmentType(value as RateType);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shipment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="non-document">Non-Document</SelectItem>
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
                    disabled={!selectedShipmentType || loadingCountries || countries.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedShipmentType ? "Select shipment type first" :
                          loadingCountries ? "Loading countries..." : 
                          (countries.length === 0 && !loadingCountries) ? `No countries for ${selectedShipmentType}` :
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
