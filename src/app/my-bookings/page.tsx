
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, type UserProfile } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, type Timestamp } from 'firebase/firestore';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Package, CalendarDays, User, MapPin, DollarSign, ShieldCheck, AlertCircle, Info, BookMarked, CreditCard, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import PrintableBookingForm, { type Booking as PrintableBookingType } from '@/components/PrintableBookingForm';


interface Booking extends PrintableBookingType {
  // This interface can extend PrintableBookingType if all fields match
  // Or define its own fields if there are differences for display vs print
}

export default function MyBookingsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  const printableComponentRef = useRef<HTMLDivElement>(null);
  const [currentPrintBooking, setCurrentPrintBooking] = useState<PrintableBookingType | null>(null);

  const handlePrint = useReactToPrint({
    content: () => printableComponentRef.current,
    documentTitle: currentPrintBooking ? `FlyCargo-Booking-${currentPrintBooking.id}` : "FlyCargo-Booking",
    onAfterPrint: () => {
      setCurrentPrintBooking(null); 
    },
    onPrintError: (errorLocation, error) => {
      console.error(`Error during printing (${errorLocation}):`, error);
      setCurrentPrintBooking(null);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/my-bookings');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchBookings = async () => {
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
        } finally {
          setLoadingBookings(false);
        }
      };
      fetchBookings();
    }
  }, [user]);

  const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'In Transit': return 'default';
      case 'Delivered': return 'outline'; 
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
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
  };


  if (authLoading || loadingBookings) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading your bookings...</p>
      </div>
    );
  }

  if (!user) {
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


      {bookings.length === 0 ? (
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
          {bookings.map((booking) => (
            <Card key={booking.id} className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <CardTitle className="text-lg font-semibold text-accent flex items-center mb-2 sm:mb-0">
                        <Package className="mr-2 h-5 w-5 text-primary" />
                        Booking ID: <span className="ml-1 font-mono text-sm text-muted-foreground">{booking.id}</span>
                    </CardTitle>
                    <Badge variant={getStatusVariant(booking.status)} className="text-xs self-start sm:self-center">
                        {booking.status}
                    </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center">
                  <CalendarDays className="mr-1.5 h-3 w-3" /> Booked on: {booking.createdAt ? format(booking.createdAt.toDate(), 'PPp') : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <p><span className="font-semibold">Sender:</span> {booking.senderFullName}</p>
                    <p><span className="font-semibold">Receiver:</span> {booking.receiverFullName}</p>
                    <p><span className="font-semibold">Destination:</span> {booking.receiverCountry}</p>
                    <p><span className="font-semibold">Service:</span> <span className="capitalize">{booking.serviceType}</span></p>
                    <p><span className="font-semibold">Type:</span> <span className="capitalize">{booking.shipmentType}</span></p>
                    <p><span className="font-semibold">Weight:</span> {booking.approxWeight} kg</p>
                    {booking.estimatedCostLKR !== undefined && booking.estimatedCostLKR !== null && (
                        <p className="md:col-span-2 font-semibold text-primary">
                            <DollarSign className="inline-block mr-1 h-4 w-4" />
                            Estimated Cost: {booking.estimatedCostLKR.toLocaleString()} LKR
                        </p>
                    )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-end items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setCurrentPrintBooking(booking);
                    setTimeout(() => {
                      if (printableComponentRef.current) {
                        handlePrint();
                      } else {
                        console.error("Ref for printable content not ready.");
                        setCurrentPrintBooking(null); 
                      }
                    }, 0);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Printer className="mr-2 h-4 w-4"/> Print Form
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleProceedToPayment(booking.id, booking.estimatedCostLKR)}
                  className="w-full sm:w-auto"
                  disabled={booking.estimatedCostLKR === undefined || booking.estimatedCostLKR === null}
                >
                  <CreditCard className="mr-2 h-4 w-4"/> Continue to Payment
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {/* Printable component is always in the DOM but hidden, content updates via currentPrintBooking prop */}
      <div style={{ display: "none" }}>
          <PrintableBookingForm ref={printableComponentRef} booking={currentPrintBooking} />
      </div>
    </div>
  );
}

