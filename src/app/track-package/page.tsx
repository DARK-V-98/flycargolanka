
"use client";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PackageSearch } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const trackingSchema = z.object({
  trackingNumber: z.string().min(5, "Tracking number must be at least 5 characters."),
});

type TrackingFormValues = z.infer<typeof trackingSchema>;


export default function TrackPackagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const form = useForm<TrackingFormValues>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      trackingNumber: "",
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth"); // Redirect to login if not authenticated
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading or Access Denied...</p>
      </div>
    );
  }

  const onSubmit = (data: TrackingFormValues) => {
    // Mock tracking logic
    alert(`Tracking package: ${data.trackingNumber}`);
    form.reset();
  };

  return (
    <div className="opacity-0 animate-fadeInUp">
      <PageHeader
        title="Track Your Package"
        description="Enter your tracking number below to see the status of your shipment."
      />
      <Card className="max-w-lg mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline text-accent">
            <PackageSearch className="mr-2 h-6 w-6 text-primary" /> Enter Tracking ID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="trackingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracking Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., FCL123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg">
                Track
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
