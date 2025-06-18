"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const calculatorSchema = z.object({
  destination: z.string().min(2, { message: "Destination must be at least 2 characters." }),
  weight: z.coerce.number().positive({ message: "Weight must be a positive number." }),
  serviceType: z.enum(['international', 'local', 'freight'], { required_error: "Please select a service type." }),
  length: z.coerce.number().positive({ message: "Length must be positive." }).optional(),
  width: z.coerce.number().positive({ message: "Width must be positive." }).optional(),
  height: z.coerce.number().positive({ message: "Height must be positive." }).optional(),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

export default function CalculatorPage() {
  const [estimatedCost, setEstimatedCost] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      destination: '',
      weight: undefined,
      serviceType: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
    },
  });

  const onSubmit: SubmitHandler<CalculatorFormValues> = (data) => {
    // Mock calculation logic
    const baseRate = data.serviceType === 'international' ? 50 : data.serviceType === 'local' ? 10 : 100;
    const weightCharge = data.weight * (data.serviceType === 'international' ? 5 : data.serviceType === 'local' ? 1 : 10);
    let dimensionalCharge = 0;
    if (data.length && data.width && data.height) {
        const volume = (data.length * data.width * data.height) / 5000; // common dimensional weight factor
        dimensionalCharge = volume * (data.serviceType === 'international' ? 3 : data.serviceType === 'local' ? 0.5 : 5);
    }
    const totalCost = baseRate + weightCharge + dimensionalCharge;
    setEstimatedCost(`$${totalCost.toFixed(2)}`);
    toast({
        title: "Calculation Successful",
        description: `Estimated cost: $${totalCost.toFixed(2)}`,
        variant: "default",
        action: <CheckCircle2 className="text-green-500" />,
    });
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
    <div>
      <PageHeader
        title="Shipping Cost Calculator"
        description="Get an instant estimate for your shipment. Enter the details below."
      />
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-accent">Shipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., London, New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <p className="text-sm text-muted-foreground">Optional: Dimensions for more accurate pricing (cm)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                Calculate Cost
              </Button>
            </form>
          </Form>
        </CardContent>
        {estimatedCost && (
          <CardFooter className="mt-6 bg-primary/10 p-6 rounded-md">
            <div className="text-center w-full">
              <h3 className="text-xl font-semibold text-accent">Estimated Shipping Cost:</h3>
              <p className="text-3xl font-bold text-primary mt-2">{estimatedCost}</p>
              <p className="text-sm text-muted-foreground mt-1">This is an estimate. Actual costs may vary.</p>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
