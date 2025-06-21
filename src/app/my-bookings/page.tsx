
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, type UserProfile } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, type Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Package, CalendarDays, ShieldCheck, Info, BookMarked, CreditCard, XCircle, AlertTriangle, BellRing } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Collecting' | 'Processing' | 'In Transit' | 'Delivered' | 'On Hold' | 'Cancelled' | 'Rejected';

interface Booking {
  id: string;
  userId: string;
  userEmail: string | null;
  shipmentType: 'parcel' | 'document';
  serviceType: 'economy' | 'express';
  locationType: 'pickup' | 'dropoff_maharagama' | 'dropoff_galle';
  receiverCountry: string;
  approxWeight: number;
  approxValue: number;
  receiverFullName: string;
  receiverEmail: string;
  receiverAddress: string;
  receiverDoorCode?: string;
  receiverZipCode: string;
  receiverCity: string;
  receiverContactNo: string;
  receiverWhatsAppNo?: string;
  senderFullName: string;
  senderAddress: string;
  senderContactNo: string;
  senderWhatsAppNo?: string;
  status: BookingStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  estimatedCostLKR?: number | null;
  declaration1?: boolean;
  declaration2?: boolean;
}

export default function MyBookingsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);


  const fetchUserBookings = useCallback(async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const bookingsCol = collection(db, 'bookings');
      const q = query(bookingsCol, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const bookingsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Booking));
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings: ", error);
      toast({ title: "Error", description: "Could not fetch your bookings.", variant: "destructive" });
    } finally {
      setLoadingBookings(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/my-bookings');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchUserBookings();
    }
  }, [user, fetchUserBookings]);

  const getDisplayStatus = (status: BookingStatus): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    switch (status) {
      case 'Pending':
        return { text: 'Pending', variant: 'secondary' };
      case 'Cancelled':
        return { text: 'Cancelled', variant: 'destructive' };
      case 'Rejected':
        return { text: 'Rejected', variant: 'destructive' };
      case 'Confirmed':
      case 'Collecting':
      case 'Processing':
      case 'In Transit':
      case 'Delivered':
      case 'On Hold':
        return { text: 'Confirmed', variant: 'default' };
      default:
        return { text: status, variant: 'secondary' };
    }
  };

  const getNicStatusBadge = (status: UserProfile['nicVerificationStatus']) => {
    switch (status) {
      case 'none': return <Badge variant="destructive" className="text-xs">Not Submitted</Badge>;
      case 'pending': return <Badge variant="secondary" className="text-xs">Pending Verification</Badge>;
      case 'verified': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">Verified</Badge>;
      case 'rejected': return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      default: return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const handleProceedToPayment = (bookingId: string, cost?: number | null) => {
    console.log(`Proceeding to payment for booking: ${bookingId}. Cost: ${cost ? `${cost} LKR` : 'N/A'}`);
    // Placeholder: Implement actual payment navigation/logic here
    // router.push(`/payment?bookingId=${bookingId}`); // Example
     toast({
        title: "Payment Gateway",
        description: `Payment gateway integration is pending. Booking ID: ${bookingId}, Cost: ${cost || 'N/A'} LKR.`,
        duration: 5000,
      });
  };

  const handleConfirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      const bookingDocRef = doc(db, 'bookings', bookingToCancel.id);
      await updateDoc(bookingDocRef, {
        status: 'Cancelled',
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Booking Cancelled",
        description: `Booking ID ${bookingToCancel.id} has been cancelled.`,
        variant: "default"
      });
      setBookings(prevBookings =>
        prevBookings.map(b =>
          b.id === bookingToCancel.id ? { ...b, status: 'Cancelled', updatedAt: { seconds: Date.now()/1000, nanoseconds:0} as unknown as Timestamp } : b
        )
      );
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Cancellation Failed",
        description: "Could not cancel the booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
      setBookingToCancel(null);
    }
  };


  if (authLoading || (loadingBookings && bookings.length === 0)) { 
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading your bookings...</p>
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-screen space-y-4 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4"/>
        <h2 className="text-2xl font-semibold">Authentication Required</h2>
        <p className="text-muted-foreground">Please log in to view your bookings.</p>
        <Button asChild size="lg">
          <Link href={`/auth?redirect=${encodeURIComponent("/my-bookings")}`}>Login / Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="opacity-0 animate-fadeInUp space-y-8">
      <PageHeader
        title="My Bookings"
        description="Review your past and current shipments, and check their status."
      />

      {userProfile && (
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-accent flex items-center">
              <ShieldCheck className="mr-2 h-6 w-6 text-primary" /> NIC Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center space-x-3">
            {getNicStatusBadge(userProfile.nicVerificationStatus)}
            {(userProfile.nicVerificationStatus === 'none' || userProfile.nicVerificationStatus === 'rejected') && (
              <Button variant="link" asChild className="text-primary p-0 h-auto text-sm">
                <Link href="/book/verify-nic">
                  {userProfile.nicVerificationStatus === 'none' ? 'Submit NIC for Verification' : 'Re-submit NIC for Verification'}
                </Link>
              </Button>
            )}
          </CardContent>
           {userProfile.nicVerificationStatus === 'pending' && (
             <CardFooter>
                <Alert variant="default" className="bg-blue-500/10 border-blue-500/30 w-full">
                    <Info className="h-5 w-5 text-blue-600"/>
                    <AlertTitle className="text-blue-700">Verification Pending</AlertTitle>
                    <AlertDescription>
                        Your NIC images have been submitted and are awaiting review. This may take some time.
                    </AlertDescription>
                </Alert>
             </CardFooter>
            )}
        </Card>
      )}


      {bookings.length === 0 && !loadingBookings ? (
        <Alert className="border-dashed">
          <BookMarked className="h-5 w-5"/>
          <AlertTitle>No Bookings Yet</AlertTitle>
          <AlertDescription>
            You haven't made any bookings. Ready to ship something?
            <Button asChild variant="link" className="ml-1 px-1">
              <Link href="/book">Book a Courier</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const displayStatus = getDisplayStatus(booking.status);
            const showProcessingAlert = !['Pending', 'Cancelled', 'Rejected'].includes(booking.status);

            return(
            <Card key={booking.id} className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <CardTitle className="text-lg font-semibold text-accent flex items-center mb-2 sm:mb-0">
                        <Package className="mr-2 h-5 w-5 text-primary" />
                        Booking ID: <span className="ml-1 font-mono text-sm text-muted-foreground">{booking.id}</span>
                    </CardTitle>
                    <Badge variant={displayStatus.variant} className="text-xs self-start sm:self-center">
                        {displayStatus.text}
                    </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center">
                  <CalendarDays className="mr-1.5 h-3 w-3" /> Booked on: {booking.createdAt ? format(booking.createdAt.toDate(), 'PPp') : 'N/A'}
                </CardDescription>
                 {booking.updatedAt && (booking.status === 'Cancelled' || booking.status === 'Rejected') && (
                    <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center">
                        <XCircle className="mr-1.5 h-3 w-3 text-destructive" /> {booking.status} on: {format(booking.updatedAt.toDate(), 'PPp')}
                    </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                 {showProcessingAlert && (
                    <Alert variant="default" className="bg-green-500/10 border-green-500/30">
                        <BellRing className="h-5 w-5 text-green-600"/>
                        <AlertTitle className="text-green-700 font-semibold">Booking Confirmed & Processing!</AlertTitle>
                        <AlertDescription>
                            Your order <strong className="font-mono text-xs">{booking.id}</strong> is now processing. You can track its progress using your booking ID on the{' '}
                            <Link href="/track-package" className="font-semibold underline hover:text-primary/80">
                                Track Package page
                            </Link>.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <p><span className="font-semibold">Sender:</span> {booking.senderFullName}</p>
                    <p><span className="font-semibold">Receiver:</span> {booking.receiverFullName}</p>
                    <p><span className="font-semibold">Destination:</span> {booking.receiverCountry}</p>
                    <p><span className="font-semibold">Service:</span> <span className="capitalize">{booking.serviceType}</span></p>
                    <p><span className="font-semibold">Type:</span> <span className="capitalize">{booking.shipmentType}</span></p>
                    <p><span className="font-semibold">Weight:</span> {booking.approxWeight} kg</p>
                    {booking.estimatedCostLKR !== undefined && booking.estimatedCostLKR !== null && (
                        <p className="md:col-span-2 font-semibold text-primary">
                            <CreditCard className="inline-block mr-1 h-4 w-4" />
                            Estimated Cost: {booking.estimatedCostLKR.toLocaleString()} LKR
                        </p>
                    )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-end items-center gap-2">
                {booking.status === 'Pending' && (
                   <AlertDialog open={!!bookingToCancel && bookingToCancel.id === booking.id} onOpenChange={(isOpen) => !isOpen && setBookingToCancel(null)}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => setBookingToCancel(booking)}
                        className="w-full sm:w-auto"
                      >
                        <XCircle className="mr-2 h-4 w-4"/> Cancel Booking
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel booking ID: <strong>{bookingToCancel?.id}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setBookingToCancel(null)} disabled={isCancelling}>Back</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleConfirmCancelBooking} 
                          disabled={isCancelling}
                          className={buttonVariants({variant: "destructive"})}
                        >
                          {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                          Confirm Cancel
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button 
                  size="sm" 
                  onClick={() => handleProceedToPayment(booking.id, booking.estimatedCostLKR)}
                  className="w-full sm:w-auto"
                  disabled={booking.estimatedCostLKR === undefined || booking.estimatedCostLKR === null || booking.status === 'Cancelled' || booking.status === 'Rejected' || booking.status === 'Delivered'}
                >
                  <CreditCard className="mr-2 h-4 w-4"/> Continue to Payment
                </Button>
              </CardFooter>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
