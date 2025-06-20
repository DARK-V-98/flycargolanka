
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

// Basic schema for the placeholder form
const calculatorSchema = z.object({
  country: z.string().optional(),
  weight: z.string().optional(),
  deliveryType: z.string().optional(),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

export default function ShippingCalculatorForm() {
  const [calculatedCost, setCalculatedCost] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      country: undefined,
      weight: undefined,
      deliveryType: undefined,
    },
  });

  const onSubmit = (data: CalculatorFormValues) => {
    setIsCalculating(true);
    // Simulate calculation
    setTimeout(() => {
      setCalculatedCost("Calculated Cost: (Coming Soon)");
      setIsCalculating(false);
    }, 1000);
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-xl opacity-0 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
      <CardHeader>
        {/* Title is now part of PageHeader on home page */}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Country</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled // Disabled for now
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country (Coming Soon)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Options will be populated from Firestore */}
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
                  <FormLabel>Package Weight</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled // Disabled for now
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select package weight (Coming Soon)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Options will be populated based on selected country */}
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
                    disabled // Disabled for now
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery type (Coming Soon)" />
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
                disabled={isCalculating || true} // Disabled for now
            >
              {isCalculating ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : null}
              Calculate Cost (Coming Soon)
            </Button>
          </form>
        </Form>
      </CardContent>
      {calculatedCost && (
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
