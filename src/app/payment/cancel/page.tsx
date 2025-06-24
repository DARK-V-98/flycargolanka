
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <div className="flex flex-col items-center justify-center flex-grow py-12 px-4 opacity-0 animate-fadeInUp">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader className="items-center">
          <XCircle className="h-16 w-16 text-destructive mb-4" />
          <CardTitle className="text-2xl font-headline text-accent">Payment Cancelled</CardTitle>
          <CardDescription>Your payment process was not completed.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The payment for booking <strong className="font-mono text-destructive">{bookingId || 'N/A'}</strong> was cancelled. Your booking remains pending. You can try to pay again from your bookings page.
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/my-bookings">
              <ArrowLeft className="mr-2" />
              Return to My Bookings
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
