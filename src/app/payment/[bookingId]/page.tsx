
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, type Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { generatePayhereData } from '../actions';
import type { PayhereData } from '@/types/payhere';

import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CreditCard, Landmark, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

// Re-defining Booking type locally to avoid dependency cycles if needed
// and to keep this page self-contained regarding its primary data structure.
export type BookingStatus = 'Pending' | 'Confirmed' | 'Collecting' | 'Processing' | 'In Transit' | 'Delivered' | 'On Hold' | 'Cancelled' | 'Rejected';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded';

interface Booking {
  id: string;
  senderFullName: string;
  senderAddress: string;
  receiverCity: string;
  userEmail: string | null;
  senderContactNo: string;
  estimatedCostLKR?: number | null;
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
}


export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [payhereData, setPayhereData] = useState<PayhereData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/auth?redirect=/payment/${bookingId}`);
      return;
    }

    const fetchBookingAndGenerateHash = async () => {
      setLoading(true);
      setError(null);
      try {
        const bookingDocRef = doc(db, 'bookings', bookingId);
        const docSnap = await getDoc(bookingDocRef);

        if (!docSnap.exists()) {
          setError('This booking could not be found.');
          setLoading(false);
          return;
        }

        const bookingData = { id: docSnap.id, ...docSnap.data() } as Booking;
        setBooking(bookingData);

        if (bookingData.paymentStatus === 'Paid') {
            setError('This booking has already been paid for.');
            setLoading(false);
            return;
        }

        if (!bookingData.estimatedCostLKR || bookingData.estimatedCostLKR <= 0) {
          setError('The cost for this booking has not been determined yet. Please contact support.');
          setLoading(false);
          return;
        }

        const [firstName, ...lastNameParts] = bookingData.senderFullName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        const data = await generatePayhereData(
          bookingData.id,
          bookingData.estimatedCostLKR,
          firstName || 'N/A',
          lastName || 'N/A',
          bookingData.userEmail || 'no-email@flycargo.lk',
          bookingData.senderContactNo,
          bookingData.senderAddress,
          bookingData.receiverCity,
        );
        setPayhereData(data);
      } catch (err: any) {
        console.error('Error in payment page setup:', err);
        setError(err.message || 'An unexpected error occurred while preparing for payment.');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId && user) {
      fetchBookingAndGenerateHash();
    }
  }, [bookingId, user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="flex flex-col flex-grow justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Preparing your payment options...</p>
      </div>
    );
  }

  return (
    <div className="opacity-0 animate-fadeInUp container mx-auto px-4 py-8">
      <PageHeader title="Complete Your Payment" description={`Final step for booking ID: ${bookingId}`} />

      {error ? (
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
           <Button asChild variant="link" className="px-0 h-auto mt-2">
              <Link href="/my-bookings">Return to My Bookings</Link>
            </Button>
        </Alert>
      ) : booking && (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Order Summary */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Booking ID:</span>
                <span className="font-mono text-base">{booking.id}</span>
              </div>
              <div className="flex justify-between items-center font-bold mt-2">
                <span>Total Amount:</span>
                <span className="text-primary">{booking.estimatedCostLKR?.toLocaleString('en-US', { style: 'currency', currency: 'LKR' })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Options */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Payhere Online Payment */}
            <Card className="shadow-lg border-primary/50 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center"><CreditCard className="mr-2 text-primary"/>Pay Online via Card</CardTitle>
                <CardDescription>Securely pay with your credit or debit card through Payhere.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">You will be redirected to the secure Payhere gateway to complete your payment.</p>
              </CardContent>
              <CardFooter>
                {payhereData ? (
                   <form method="post" action={payhereData.url}>
                        <input type="hidden" name="merchant_id" value={payhereData.merchant_id} />
                        <input type="hidden" name="return_url" value={payhereData.return_url} />
                        <input type="hidden" name="cancel_url" value={payhereData.cancel_url} />
                        <input type="hidden" name="notify_url" value={payhereData.notify_url} />
                        
                        <input type="hidden" name="first_name" value={payhereData.first_name} />
                        <input type="hidden" name="last_name" value={payhereData.last_name} />
                        <input type="hidden" name="email" value={payhereData.email} />
                        <input type="hidden" name="phone" value={payhereData.phone} />
                        <input type="hidden" name="address" value={payhereData.address} />
                        <input type="hidden" name="city" value={payhereData.city} />
                        <input type="hidden" name="country" value={payhereData.country} />

                        <input type="hidden" name="order_id" value={payhereData.order_id} />
                        <input type="hidden" name="items" value={payhereData.items} />
                        <input type="hidden" name="currency" value={payhereData.currency} />
                        <input type="hidden" name="amount" value={payhereData.amount} />
                        
                        <input type="hidden" name="hash" value={payhereData.hash} /> 
                       <Button type="submit" className="w-full" size="lg">
                           <ShieldCheck className="mr-2" /> Proceed to Secure Payment
                       </Button>
                   </form>
                ) : (
                    <Button className="w-full" size="lg" disabled>
                        <Loader2 className="mr-2 animate-spin"/> Preparing Online Payment...
                    </Button>
                )}
              </CardFooter>
            </Card>

            {/* Bank Transfer */}
            <Card className="shadow-lg flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center"><Landmark className="mr-2 text-primary"/>Direct Bank Transfer</CardTitle>
                <CardDescription>Manually transfer the amount to our bank account.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-3 flex-grow">
                 <p>Please transfer the total amount of <strong className="text-primary">{booking.estimatedCostLKR?.toLocaleString('en-US')} LKR</strong> to the following account:</p>
                  <ul className="list-disc list-inside bg-muted/50 p-3 rounded-md space-y-1">
                      <li><strong>Bank Name:</strong> HNB</li>
                      <li><strong>Account Name:</strong> Delectaa</li>
                      <li><strong>Account Number:</strong> 148010007911</li>
                      <li><strong>Branch:</strong> Giriulla</li>
                      <li><strong>Reference:</strong> <span className="font-mono">{booking.id}</span></li>
                  </ul>
                  <p className="font-semibold">
                      After payment, please send the receipt via WhatsApp to <a href="https://wa.me/94704917636" target="_blank" rel="noopener noreferrer" className="text-primary underline">+94 704 917 636</a> with your Booking ID.
                  </p>
              </CardContent>
              <CardFooter>
                 <Button variant="outline" asChild className="w-full">
                     <Link href="/my-bookings">
                        I have paid, take me back
                     </Link>
                 </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
