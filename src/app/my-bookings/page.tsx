
"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, type UserProfile } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, type Timestamp, doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Package, CalendarDays, ShieldCheck, Info, BookMarked, CreditCard, XCircle, AlertTriangle, BellRing, CheckCircle2, Eye, Download, Box, Fingerprint, PackageSearch } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { NicVerificationStatus } from '@/contexts/AuthContext';


export type BookingStatus = 'Pending' | 'Confirmed' | 'Collecting' | 'Processing' | 'In Transit' | 'Delivered' | 'On Hold' | 'Cancelled' | 'Rejected';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded';

// This interface is expanded to match the full booking data for the details dialog
export interface Booking {
  id: string;
  userId: string;
  userEmail: string | null;
  trackingNumber?: string | null;

  shipmentType: 'parcel' | 'document';
  serviceType: 'economy' | 'express';
  locationType: 'pickup' | 'dropoff_katunayake';

  receiverCountry: string;
  approxWeight: number;
  approxValue: number;

  receiverFullName: string;
  receiverEmail: string;
  receiverAddress: string;
  receiverDoorCode?: string | null;
  receiverZipCode: string;
  receiverCity: string;
  receiverContactNo: string;
  receiverWhatsAppNo?: string | null;

  senderFullName: string;
  senderAddress: string;
  senderContactNo: string;
  senderWhatsAppNo?: string | null;

  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  estimatedCostLKR?: number | null;

  packageContents: string;
  courierPurpose: 'gift' | 'commercial' | 'personal' | 'sample' | 'return_for_repair' | 'return_after_repair' | 'custom';
  customPurpose?: string | null;
  nicVerificationStatus?: NicVerificationStatus;
}


function MyBookingsPageContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/my-bookings');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) {
      setLoadingBookings(false);
      return;
    }

    setLoadingBookings(true);
    const bookingsCol = collection(db, 'bookings');
    const q = query(bookingsCol, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            paymentStatus: data.paymentStatus || 'Pending'
        } as Booking;
      });
      
      bookingsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setBookings(bookingsData);
      setLoadingBookings(false);
    }, (error) => {
      console.error("Error fetching bookings in real-time: ", error);
      // Removed toast message to avoid confusing users when no bookings are found due to permissions lag.
      setLoadingBookings(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getDisplayStatus = (status: BookingStatus): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    switch (status) {
      case 'Pending':
        return { text: 'Pending', variant: 'secondary' };
      case 'Cancelled':
      case 'Rejected':
        return { text: status, variant: 'destructive' };
      case 'Delivered':
         return { text: 'Delivered', variant: 'outline' };
      case 'Confirmed':
      case 'Collecting':
      case 'Processing':
      case 'In Transit':
      case 'On Hold':
        return { text: 'Processing', variant: 'default' };
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

  const handleProceedToPayment = (bookingId: string) => {
    router.push(`/payment/${bookingId}`);
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

  const handleDownloadInvoice = async () => {
    if (!viewingBooking) return;
    setDownloadingPdf(true);

    try {
        const response = await fetch('/invoice.html');
        if (!response.ok) {
            throw new Error("Could not load invoice template. Make sure 'public/invoice.html' exists.");
        }
        let template = await response.text();

        const serviceDescription = `Shipping - ${viewingBooking.shipmentType} (${viewingBooking.serviceType}) to ${viewingBooking.receiverFullName} in ${viewingBooking.receiverCountry} - ${viewingBooking.approxWeight}kg`;
        const totalAmount = viewingBooking.estimatedCostLKR?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00';
        
        const trackingHtml = viewingBooking.trackingNumber
            ? `<div class="section" style="margin-top: 30px;">
                <div class="section-title">Tracking Information</div>
                <p><strong>Tracking Number:</strong> ${viewingBooking.trackingNumber}</p>
                <p style="margin-top: 10px;"><a href="https://www.ups.com/track?loc=en_SG&tracknum=${encodeURIComponent(viewingBooking.trackingNumber)}&requester=ST/" target="_blank" style="display: inline-block; padding: 8px 12px; background-color: #d4af37; color: #0d1b2a; text-decoration: none; border-radius: 5px; font-weight: 500;">Track on UPS</a></p>
            </div>`
            : `<div class="section" style="margin-top: 30px;">
                <div class="section-title">Tracking Information</div>
                <p>Tracking number will be assigned soon.</p>
            </div>`;

        const replacements: Record<string, string> = {
            '{{logoUrl}}': '/fg.png',
            '{{orderId}}': viewingBooking.id,
            '{{invoiceDate}}': format(viewingBooking.createdAt.toDate(), 'PPP'),

            '{{companyName}}': 'FlyCargo Lanka',
            '{{companyAddress}}': 'No.05, avariwatta, katunayake',
            '{{contactNumber}}': '+94704917636',

            '{{senderName}}': viewingBooking.senderFullName,
            '{{senderAddress}}': [
                viewingBooking.senderAddress,
                `Tel: ${viewingBooking.senderContactNo}`,
                viewingBooking.userEmail ? `Email: ${viewingBooking.userEmail}` : null,
            ].filter(Boolean).join('<br />'),
            
            '{{receiverName}}': viewingBooking.receiverFullName,
            '{{receiverAddress}}': [
                viewingBooking.receiverAddress,
                viewingBooking.receiverDoorCode ? `Door Code: ${viewingBooking.receiverDoorCode}` : null,
                `${viewingBooking.receiverCity}, ${viewingBooking.receiverZipCode}, ${viewingBooking.receiverCountry}`,
                `Tel: ${viewingBooking.receiverContactNo}`,
                viewingBooking.receiverEmail ? `Email: ${viewingBooking.receiverEmail}` : null,
            ].filter(Boolean).join('<br />'),

            '{{serviceDescription}}': serviceDescription,
            '{{serviceDestination}}': viewingBooking.receiverCountry,
            '{{totalAmount}}': totalAmount,
            '{{trackingNumberHtml}}': trackingHtml,
        };

        for (const key in replacements) {
            template = template.replaceAll(key, replacements[key]);
        }

        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        const invoiceContainer = document.createElement('div');
        invoiceContainer.style.position = 'fixed';
        invoiceContainer.style.left = '-9999px';
        invoiceContainer.style.top = '0';
        invoiceContainer.style.width = '210mm'; 
        invoiceContainer.style.height = 'auto';
        invoiceContainer.innerHTML = template;
        document.body.appendChild(invoiceContainer);

        const canvas = await html2canvas(invoiceContainer, {
            scale: 2,
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`invoice-${viewingBooking.id}.pdf`);

        document.body.removeChild(invoiceContainer);

    } catch (err: any) {
        console.error("Error downloading PDF invoice:", err);
        toast({
            title: "Download Failed",
            description: err.message,
            variant: "destructive"
        });
    } finally {
        setDownloadingPdf(false);
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
    <div className="opacity-0 animate-fadeInUp">
      <PageHeader
        title="My Bookings"
        description="Review your past and current shipments, and check their status."
      />

      <div className="space-y-8 container mx-auto px-4">

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
                              Your order <strong className="font-mono text-xs">{booking.id}</strong> is now being processed. A tracking number will appear here once it is assigned.
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
                          <div className="md:col-span-2 font-semibold text-primary">
                              <CreditCard className="inline-block mr-1 h-4 w-4" />
                              Estimated Cost: {booking.estimatedCostLKR.toLocaleString()} LKR
                          </div>
                      )}
                  </div>
                  {booking.trackingNumber ? (
                    <div className="mt-4 pt-3 border-t">
                        <h4 className="font-semibold text-accent flex items-center mb-2"><PackageSearch className="mr-2 h-5 w-5"/>Tracking Information</h4>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <p className="font-mono text-sm bg-muted p-2 rounded-md whitespace-nowrap">{booking.trackingNumber}</p>
                            <Button asChild size="sm" className="w-full sm:w-auto">
                                <a 
                                    href={`https://www.ups.com/track?loc=en_SG&tracknum=${encodeURIComponent(booking.trackingNumber)}&requester=ST/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Track on UPS
                                </a>
                            </Button>
                        </div>
                    </div>
                ) : booking.status !== 'Pending' && booking.status !== 'Cancelled' && (
                    <div className="mt-4 pt-3 border-t text-sm text-muted-foreground">
                        Tracking number will be assigned soon.
                    </div>
                )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-end items-center gap-2">
                  <Badge variant={booking.paymentStatus === 'Paid' ? 'default' : booking.paymentStatus === 'Refunded' ? 'destructive' : 'secondary' } className="text-xs mr-auto capitalize">
                    Payment: {booking.paymentStatus || 'Pending'}
                  </Badge>
                  
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewingBooking(booking)} className="w-full sm:w-auto">
                      <Eye className="mr-2 h-4 w-4"/> View Details
                    </Button>

                    {booking.status === 'Pending' && (
                      <AlertDialog open={!!bookingToCancel && bookingToCancel.id === booking.id} onOpenChange={(isOpen) => !isOpen && setBookingToCancel(null)}>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" onClick={() => setBookingToCancel(booking)} className="w-full sm:w-auto">
                            <XCircle className="mr-2 h-4 w-4"/> Cancel
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
                            <AlertDialogAction onClick={handleConfirmCancelBooking} disabled={isCancelling} className={buttonVariants({variant: "destructive"})}>
                              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                              Confirm Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <Button 
                      size="sm" 
                      onClick={() => handleProceedToPayment(booking.id)}
                      className="w-full sm:w-auto"
                      disabled={
                          booking.estimatedCostLKR === undefined || 
                          booking.estimatedCostLKR === null || 
                          booking.status !== 'Pending' ||
                          booking.paymentStatus === 'Paid'
                      }
                    >
                      {booking.paymentStatus === 'Paid' ? (
                          <><CheckCircle2 className="mr-2 h-4 w-4" /> Paid</>
                      ) : (
                          <><CreditCard className="mr-2 h-4 w-4"/> Pay Now</>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )})}
          </div>
        )}
      </div>

       {viewingBooking && (
        <Dialog open={!!viewingBooking} onOpenChange={(isOpen) => !isOpen && setViewingBooking(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary"/>Booking Details: <span className="ml-1 font-mono text-base text-muted-foreground">{viewingBooking.id}</span>
              </DialogTitle>
              <DialogDescription>
                Full information for your selected booking.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-6 py-4 text-sm">
                <section>
                  <h3 className="text-md font-semibold mb-2 border-b pb-1 text-accent">Shipment Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div><strong className="text-muted-foreground">ID:</strong> {viewingBooking.id}</div>
                    <div className="flex items-center gap-2"><strong className="text-muted-foreground">Order Status:</strong> <Badge variant={getDisplayStatus(viewingBooking.status).variant} className="text-xs">{getDisplayStatus(viewingBooking.status).text}</Badge></div>
                    <div className="flex items-center gap-2"><strong className="text-muted-foreground">Payment Status:</strong> <Badge variant={viewingBooking.paymentStatus === 'Paid' ? 'default' : 'secondary'} className="text-xs">{viewingBooking.paymentStatus || 'Pending'}</Badge></div>
                    <div><strong className="text-muted-foreground">Booked On:</strong> {viewingBooking.createdAt ? format(viewingBooking.createdAt.toDate(), 'PPp') : 'N/A'}</div>
                    {viewingBooking.updatedAt && <div><strong className="text-muted-foreground">Last Updated:</strong> {format(viewingBooking.updatedAt.toDate(), 'PPp')}</div>}
                    <div><strong className="text-muted-foreground">Shipment Type:</strong> <span className="capitalize">{viewingBooking.shipmentType}</span></div>
                    <div><strong className="text-muted-foreground">Service Type:</strong> <span className="capitalize">{viewingBooking.serviceType}</span></div>
                    <div><strong className="text-muted-foreground">Location Type:</strong> <span className="capitalize">{viewingBooking.locationType.replace('_', ' ')}</span></div>
                    <div><strong className="text-muted-foreground">Destination:</strong> {viewingBooking.receiverCountry}</div>
                    <div><strong className="text-muted-foreground">Weight:</strong> {viewingBooking.approxWeight} kg</div>
                    <div><strong className="text-muted-foreground">Value (USD):</strong> {viewingBooking.approxValue?.toLocaleString() || 'N/A'}</div>
                    <div><strong className="text-muted-foreground">Est. Cost (LKR):</strong> {viewingBooking.estimatedCostLKR?.toLocaleString() || 'N/A'}</div>
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold mb-2 border-b pb-1 text-accent flex items-center"><Box className="mr-2" />Package &amp; Purpose</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                     <div className="md:col-span-2"><strong className="text-muted-foreground">Contents:</strong> {viewingBooking.packageContents || 'N/A'}</div>
                     <div><strong className="text-muted-foreground">Purpose:</strong> <span className="capitalize">{viewingBooking.courierPurpose === 'custom' ? (viewingBooking.customPurpose || 'Custom') : (viewingBooking.courierPurpose?.replace(/_/g, ' ') || 'N/A')}</span></div>
                  </div>
                </section>
                
                <section>
                    <h3 className="text-md font-semibold mb-2 border-b pb-1 text-accent flex items-center"><PackageSearch className="mr-2" />Tracking</h3>
                    {viewingBooking.trackingNumber ? (
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
                            <p className="font-mono text-sm bg-muted p-2 rounded-md">{viewingBooking.trackingNumber}</p>
                            <Button asChild size="sm" className="w-full sm:w-auto">
                                <a 
                                    href={`https://www.ups.com/track?loc=en_SG&tracknum=${encodeURIComponent(viewingBooking.trackingNumber || '')}&requester=ST/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Track on UPS
                                </a>
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-2">Tracking number will be assigned soon.</p>
                    )}
                </section>


                <section>
                  <h3 className="text-md font-semibold mb-2 border-b pb-1 text-accent">Receiver Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div><strong className="text-muted-foreground">Full Name:</strong> {viewingBooking.receiverFullName}</div>
                    <div><strong className="text-muted-foreground">Email:</strong> {viewingBooking.receiverEmail || 'N/A'}</div>
                    <div className="md:col-span-2"><strong className="text-muted-foreground">Address:</strong> {viewingBooking.receiverAddress}</div>
                    <div><strong className="text-muted-foreground">ZIP/Postal:</strong> {viewingBooking.receiverZipCode}</div>
                    <div><strong className="text-muted-foreground">City:</strong> {viewingBooking.receiverCity}</div>
                    <div><strong className="text-muted-foreground">Contact No:</strong> {viewingBooking.receiverContactNo}</div>
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold mb-2 border-b pb-1 text-accent">Sender Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div><strong className="text-muted-foreground">Full Name:</strong> {viewingBooking.senderFullName}</div>
                    <div className="md:col-span-2"><strong className="text-muted-foreground">Address:</strong> {viewingBooking.senderAddress}</div>
                    <div><strong className="text-muted-foreground">Contact No:</strong> {viewingBooking.senderContactNo}</div>
                  </div>
                </section>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4 sm:justify-between">
              <Button
                onClick={handleDownloadInvoice}
                disabled={!viewingBooking.estimatedCostLKR || downloadingPdf}
                title={!viewingBooking.estimatedCostLKR ? "An invoice cannot be generated without an estimated cost." : "Download PDF Invoice"}
              >
                {downloadingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                {downloadingPdf ? 'Generating PDF...' : 'Download Invoice'}
              </Button>
              <DialogClose asChild>
                  <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}


export default function MyBookingsPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading your bookings...</p>
            </div>
        }>
            <MyBookingsPageContent />
        </Suspense>
    );
}

