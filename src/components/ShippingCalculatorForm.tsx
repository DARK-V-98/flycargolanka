
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
import { collection, query, orderBy, getDocs, doc } from "firebase/firestore";
import type { CountryRate, WeightRate } from "@/types/shippingRates";
import { useToast } from "@/hooks/use-toast";

const calculatorSchema = z.object({
  countryId: z.string().min(1, "Please select a country."),
  weightId: z.string().min(1, "Please select a package weight."),
  deliveryType: z.enum(['economy', 'express'], { required_error: "Please select a delivery type." }),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

export default function ShippingCalculatorForm() {
  const [countries, setCountries] = useState<CountryRate[]>([]);
  const [weights, setWeights] = useState<WeightRate[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  
  const [calculatedCost, setCalculatedCost] = useState<string | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();


  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      countryId: '',
      weightId: '',
      deliveryType: undefined,
    },
  });

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      setFormError(null);
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
        setFormError("Could not load countries. Please try again later.");
        toast({ title: "Error", description: "Could not load countries.", variant: "destructive" });
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, [toast]);

  useEffect(() => {
    if (selectedCountryId) {
      const fetchWeights = async () => {
        setLoadingWeights(true);
        setWeights([]); // Clear previous weights
        form.resetField("weightId"); // Reset weight selection
        setCalculatedCost(null); // Clear previous calculation
        setFormError(null);
        try {
          const weightsColRef = collection(db, 'shipping_rates', selectedCountryId, 'weights');
          const q = query(weightsColRef, orderBy('weightValue', 'asc')); // Assuming 'weightValue' for ordering
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
      setWeights([]); // Clear weights if no country is selected
      form.resetField("weightId");
    }
  }, [selectedCountryId, form, toast]);


  const onSubmit: SubmitHandler<CalculatorFormValues> = (data) => {
    setCalculatedCost(null); // Clear previous result
    setFormError(null);

    const selectedWeightEntry = weights.find(w => w.id === data.weightId);

    if (!selectedWeightEntry) {
      setFormError("Selected weight details not found. Please re-select.");
      toast({ title: "Error", description: "Weight details not found.", variant: "destructive" });
      return;
    }

    let price: number | null | undefined = null;
    let currency = "LKR"; // Assuming LKR, can be made dynamic later
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
                    disabled={loadingCountries || countries.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCountries ? "Loading countries..." : "Select a country"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                      ))}
                      {!loadingCountries && countries.length === 0 && (
                        <SelectItem value="no-countries" disabled>No countries configured</SelectItem>
                      )}
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
                    disabled={!form.watch("weightId")} // Disabled if no weight is selected
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

    