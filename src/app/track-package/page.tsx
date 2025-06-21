
"use client";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { db } from "@/lib/firebase";
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PackageSearch, Loader2, AlertTriangle, CheckCircle, Circle, MapPin, Package, User } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type BookingStatus = 'Pending' | 'Confirmed' | 'Collecting' | 'Processing' | 'In Transit' | 'Delivered' | 'On Hold' | 'Cancelled' | 'Rejected';

interface Booking {
  id: string;
  status: BookingStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  senderFullName: string;
  receiverFullName: string;
  receiverCountry: string;
  receiverCity: string;
  // Add other fields you want to display
}

const trackingSchema = z.object({
  trackingNumber: z.string().min(5, "Tracking number must be at least 5 characters long."),
});
type TrackingFormValues = z.infer<typeof trackingSchema>;

const trackingSteps: BookingStatus[] = ['Confirmed', 'Processing', 'In Transit', 'Delivered'];

export default function TrackPackagePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);

  const form = useForm<TrackingFormValues>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      trackingNumber: "",
    },
  });

  const onSubmit: SubmitHandler<TrackingFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setBookingResult(null);

    try {
      const trackingId = data.trackingNumber.trim();
      const bookingDocRef = doc(db, "bookings", trackingId);
      const docSnap = await getDoc(bookingDocRef);

      if (docSnap.exists()) {
        setBookingResult({ id: docSnap.id, ...docSnap.data() } as Booking);
      } else {
        setError("No booking found with this tracking ID. Please check the number and try again.");
      }
    } catch (err) {
      console.error("Error fetching tracking data:", err);
      setError("An error occurred while fetching your package status. Please try again later.");
      toast({
        title: "Tracking Error",
        description: "Failed to fetch tracking information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: BookingStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'On Hold': return 'secondary';
      case 'Confirmed': return 'default';
      case 'Collecting': return 'default';
      case 'Processing': return 'default';
      case 'In Transit': return 'default';
      case 'Delivered': return 'outline';
      case 'Cancelled': return 'destructive';
      case 'Rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const currentStepIndex = bookingResult ? trackingSteps.indexOf(bookingResult.status) : -1;


  return (
    <div className="opacity-0 animate-fadeInUp space-y-8">
      <PageHeader
        title="Track Your Package"
        description="Enter your tracking number below to see the current status of your shipment."
      />
      <Card className="max-w-lg mx-auto shadow-xl border-border/50">
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
                      <Input placeholder="e.g., ABC1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Tracking...</> : "Track"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="max-w-lg mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {bookingResult && (
        <Card className="max-w-3xl mx-auto shadow-xl border-border/50 opacity-0 animate-fadeInUp mt-8">
          <CardHeader>
            <CardTitle>Tracking Details</CardTitle>
            <CardDescription>
                ID: <span className="font-mono text-sm">{bookingResult.id}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <Badge variant={getStatusVariant(bookingResult.status)} className="text-lg mt-1">{bookingResult.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-2 sm:mt-0 sm:text-right">
                <p>Booked: {format(bookingResult.createdAt.toDate(), "PP")}</p>
                {bookingResult.updatedAt && <p>Last Update: {format(bookingResult.updatedAt.toDate(), "PPp")}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-1 shrink-0"/>
                    <div>
                        <p className="font-semibold text-muted-foreground">Sender</p>
                        <p>{bookingResult.senderFullName}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-primary mt-1 shrink-0"/>
                    <div>
                        <p className="font-semibold text-muted-foreground">Receiver</p>
                        <p>{bookingResult.receiverFullName}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="h-5 w-5 text-primary mt-1 shrink-0"/>
                    <div>
                        <p className="font-semibold text-muted-foreground">Destination</p>
                        <p>{bookingResult.receiverCity}, {bookingResult.receiverCountry}</p>
                    </div>
                </div>
            </div>
            
            {/* Timeline Visual */}
            {currentStepIndex > -1 && (
                 <div>
                    <h3 className="text-lg font-semibold mb-4 text-accent">Shipment Progress</h3>
                    <div className="relative pl-4">
                        {/* Vertical line */}
                        <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-border -translate-x-1/2"></div>
                        
                        <div className="space-y-8">
                            {trackingSteps.map((step, index) => {
                                const isCompleted = currentStepIndex >= index;
                                const isActive = currentStepIndex === index;
                                return (
                                    <div key={step} className="flex items-center gap-4 relative">
                                        <div className={`flex items-center justify-center h-8 w-8 rounded-full z-10 shrink-0
                                            ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted border-2'}`}>
                                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                                        </div>
                                        <p className={`font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
