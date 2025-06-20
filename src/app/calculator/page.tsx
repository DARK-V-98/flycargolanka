
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc } from 'firebase/firestore';
import type { CountryRate, WeightRate } from '@/types/shippingRates';
import { useToast } from '@/hooks/use-toast';

// Define Zod schemas for the form
const calculatorFormSchema = z.object({
  countryId: z.string().min(1, "Please select a country."),
  weightId: z.string().min(1, "Please select a weight."),
  deliveryType: z.enum(['economy', 'express'], { required_error: "Please select a delivery type." }),
});

type CalculatorFormValues = z.infer<typeof calculatorFormSchema>;

export default function CalculatorPage() {
  const [countries, setCountries] = useState<CountryRate[]>([]);
  const [weights, setWeights] = useState<WeightRate[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [calculatedCost, setCalculatedCost] = useState<string | null>(null);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingWeights, setIsLoadingWeights] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const { toast } = useToast();

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: {
      countryId: '',
      weightId: '',
      deliveryType: undefined,
    },
  });

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const countriesCol = collection(db, 'shipping_rates');
        const q = query(countriesCol, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const fetchedCountries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CountryRate));
        setCountries(fetchedCountries);
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast({ title: "Error", description: "Could not load countries.", variant: "destructive" });
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, [toast]);

  // Fetch weights when a country is selected
  useEffect(() => {
    if (selectedCountryId) {
      const fetchWeights = async () => {
        setIsLoadingWeights(true);
        setWeights([]); // Clear previous weights
        form.resetField('weightId'); // Reset weight selection
        setCalculatedCost(null);
        try {
          const weightsCol = collection(db, 'shipping_rates', selectedCountryId, 'weights');
          // Order by weightValue if you want a specific order, e.g., by numeric weight
          const q = query(weightsCol, orderBy('weightValue', 'asc'));
          const snapshot = await getDocs(q);
          const fetchedWeights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightRate));
          setWeights(fetchedWeights);
        } catch (error) {
          console.error("Error fetching weights:", error);
          toast({ title: "Error", description: "Could not load weights for the selected country.", variant: "destructive" });
        } finally {
          setIsLoadingWeights(false);
        }
      };
      fetchWeights();
    } else {
      setWeights([]); // Clear weights if no country is selected
    }
  }, [selectedCountryId, form, toast]);

  const onSubmit: SubmitHandler<CalculatorFormValues> = async (data) => {
    setIsCalculating(true);
    setCalculatedCost(null);
    try {
      const weightDocRef = doc(db, 'shipping_rates', data.countryId, 'weights', data.weightId);
      const weightDocSnap = await getDocs(query(collection(db, 'shipping_rates', data.countryId, 'weights'))); // This is not optimal, ideally getDoc(weightDocRef)
      
      const targetWeightDoc = weightDocSnap.docs.find(d => d.id === data.weightId);

      if (!targetWeightDoc || !targetWeightDoc.exists()) {
        toast({ title: "Error", description: "Selected weight details not found.", variant: "destructive" });
        setIsCalculating(false);
        return;
      }

      const weightData = targetWeightDoc.data() as WeightRate;
      let cost: number | undefined | null;
      let currency = "LKR"; // Assuming LKR, can be made dynamic if needed

      if (data.deliveryType === 'economy') {
        if (weightData.isEconomyEnabled && typeof weightData.economyPrice === 'number') {
          cost = weightData.economyPrice;
        } else {
          toast({ title: "Not Available", description: "Economy shipping is not available or price is not set for this selection.", variant: "default" });
          setIsCalculating(false);
          return;
        }
      } else if (data.deliveryType === 'express') {
        if (weightData.isExpressEnabled && typeof weightData.expressPrice === 'number') {
          cost = weightData.expressPrice;
        } else {
          toast({ title: "Not Available", description: "Express shipping is not available or price is not set for this selection.", variant: "default" });
          setIsCalculating(false);
          return;
        }
      }

      if (typeof cost === 'number') {
        setCalculatedCost(`${cost.toFixed(2)} ${currency}`);
      } else {
         toast({ title: "Not Available", description: "Price not found for the selected options.", variant: "default" });
      }

    } catch (error) {
      console.error("Error calculating cost:", error);
      toast({ title: "Calculation Error", description: "Could not calculate shipping cost.", variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };
  
  const handleInvalidSubmit = (errors: any) => {
    toast({
        title: "Error in Form",
        description: "Please correct the errors in the form.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />,
    });
  };

  return (
    <div className="opacity-0 animate-fadeInUp">
      <PageHeader
        title="Shipping Cost Calculator"
        description="Select destination, weight, and delivery type to get an estimate."
      />
      <Card className="max-w-2xl mx-auto shadow-xl opacity-0 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-accent">Estimate Your Shipping Cost</CardTitle>
        </CardHeader>
        <CardContent>
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
                      disabled={isLoadingCountries}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingCountries ? "Loading countries..." : "Select a country"} />
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
                      disabled={!selectedCountryId || isLoadingWeights || weights.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedCountryId ? "Select country first" :
                            isLoadingWeights ? "Loading weights..." :
                            weights.length === 0 ? "No weights available" :
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery type" />
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
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" disabled={isCalculating || !form.formState.isValid}>
                {isCalculating ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : null}
                Calculate Cost
              </Button>
            </form>
          </Form>
        </CardContent>
        {calculatedCost && (
          <CardFooter className="mt-6 bg-primary/10 p-6 rounded-md opacity-0 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="text-center w-full">
              <h3 className="text-xl font-semibold text-accent">Estimated Shipping Cost:</h3>
              <p className="text-3xl font-bold text-primary mt-2">{calculatedCost}</p>
              <p className="text-sm text-muted-foreground mt-1">This is an estimate. Actual costs may vary.</p>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

