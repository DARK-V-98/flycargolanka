
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <div className="flex flex-col items-center justify-center flex-grow py-12 px-4 opacity-0 animate-fadeInUp">
      <Card className="w-full max-w-lg text-center shadow-xl border-green-500/50">
        <CardHeader className="items-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-2xl font-headline text-accent">Payment Received!</CardTitle>
          <CardDescription>Thank you for your payment. We are now confirming it.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your payment for booking <strong className="font-mono text-primary">{bookingId || 'N/A'}</strong> has been successfully processed by the gateway.
            <br/><br/>
            We are now waiting for final confirmation from the bank. Your booking status will be updated to "Paid" on the 'My Bookings' page as soon as this is complete. This usually happens within a few moments.
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/my-bookings">
              <ArrowLeft className="mr-2" />
              Go to My Bookings to see status
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center flex-grow py-12 px-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading page...</p>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
