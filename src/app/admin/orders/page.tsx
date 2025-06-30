
"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, type Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, CalendarDays, Save, Loader2, AlertTriangle, Search, Filter, Eye, Info, ArrowLeft, CreditCard, Download, Box, Fingerprint } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
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
import type { NicVerificationStatus } from '@/contexts/AuthContext';


export type BookingStatus = 'Pending' | 'Confirmed' | 'Collecting' | 'Processing' | 'In Transit' | 'Delivered' | 'On Hold' | 'Cancelled' | 'Rejected';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded';


// Expanded Booking interface to include all fields from the booking form
export interface Booking {
  id: string;
  userId: string;
  userEmail: string | null; // Email of the user who made the booking

  shipmentType: 'parcel' | 'document';
  serviceType: 'economy' | 'express';
  locationType: 'pickup' | 'dropoff_katunayake';

  receiverCountry: string;
  approxWeight: number; // same as packageWeight
  approxValue: number; // value of goods in USD

  receiverFullName: string; // same as receiverName
  receiverEmail: string;
  receiverAddress: string;
  receiverDoorCode?: string | null;
  receiverZipCode: string;
  receiverCity: string;
  receiverContactNo: string;
  receiverWhatsAppNo?: string | null;

  senderFullName: string; // same as senderName
  senderAddress: string;
  senderContactNo: string;
  senderWhatsAppNo?: string | null;

  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  packageDescription: string; // Derived description (already present)
  packageWeight: number; // Redundant with approxWeight, keeping for now for backend consistency
  estimatedCostLKR?: number | null;

  // New fields
  packageContents: string;
  courierPurpose: 'gift' | 'commercial' | 'personal' | 'sample' | 'return_for_repair' | 'return_after_repair' | 'custom';
  customPurpose?: string | null;
  nicVerificationStatus?: NicVerificationStatus;

  // Fields that were in the old interface, ensure they map or are handled
  senderName: string; // Can be removed if senderFullName is primary
  receiverName: string; // Can be removed if receiverFullName is primary
}


const ALL_STATUSES: BookingStatus[] = ['Pending', 'Confirmed', 'Collecting', 'Processing', 'In Transit', 'Delivered', 'On Hold', 'Cancelled', 'Rejected'];
const ALL_PAYMENT_STATUSES: PaymentStatus[] = ['Pending', 'Paid', 'Refunded'];

export default function AdminOrdersPage() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [selectedStatusMap, setSelectedStatusMap] = useState<Record<string, BookingStatus>>({});
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState<Record<string, boolean>>({});
  const [selectedPaymentStatusMap, setSelectedPaymentStatusMap] = useState<Record<string, PaymentStatus>>({});
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'All'>('All');

  const handleDownloadInvoice = async () => {
    if (!viewingBooking) return;
    setDownloadingPdf(true);

    try {
        const response = await fetch('/invoice.html');
        if (!response.ok) {
            throw new Error("Could not load invoice template. Make sure 'public/invoice.html' exists.");
        }
        let template = await response.text();

        const serviceDescription = `Shipping - ${viewingBooking.shipmentType} (${viewingBooking.serviceType}) - ${viewingBooking.approxWeight}kg`;
        const totalAmount = viewingBooking.estimatedCostLKR?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00';
        
        const replacements: Record<string, string> = {
            '{{logoUrl}}': '/fg.png',
            '{{orderId}}': viewingBooking.id,
            '{{invoiceDate}}': format(viewingBooking.createdAt.toDate(), 'PPP'),
            '{{senderName}}': viewingBooking.senderFullName,
            '{{senderAddress}}': viewingBooking.senderAddress,
            '{{senderEmail}}': viewingBooking.userEmail || 'N/A',
            '{{receiverName}}': viewingBooking.receiverFullName,
            '{{receiverAddress}}': viewingBooking.receiverAddress,
            '{{receiverLocation}}': `${viewingBooking.receiverCity}, ${viewingBooking.receiverCountry}`,
            '{{serviceDescription}}': serviceDescription,
            '{{serviceDestination}}': viewingBooking.receiverCountry,
            '{{totalAmount}}': totalAmount,
            '{{contactNumber}}': '+94704917636',
        };

        for (const key in replacements) {
            template = template.replace(new RegExp(key, 'g'), replacements[key]);
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


  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const bookingsCol = collection(db, 'bookings');
        const q = query(bookingsCol, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const bookingsData = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            paymentStatus: data.paymentStatus || 'Pending', // Default to pending
          } as Booking;
        });

        setAllBookings(bookingsData);
        
        const initialStatuses: Record<string, BookingStatus> = {};
        const initialPaymentStatuses: Record<string, PaymentStatus> = {};

        bookingsData.forEach(b => {
            initialStatuses[b.id] = b.status;
            initialPaymentStatuses[b.id] = b.paymentStatus || 'Pending';
        });
        setSelectedStatusMap(initialStatuses);
        setSelectedPaymentStatusMap(initialPaymentStatuses);

      } catch (error) {
        console.error("Error fetching bookings: ", error);
        toast({ title: "Error", description: "Could not fetch bookings.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [toast]);

  useEffect(() => {
    let currentBookings = [...allBookings];

    if (filterStatus !== 'All') {
      currentBookings = currentBookings.filter(booking => booking.status === filterStatus);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentBookings = currentBookings.filter(booking =>
        booking.id.toLowerCase().includes(lowerSearchTerm) ||
        booking.senderFullName.toLowerCase().includes(lowerSearchTerm) || 
        booking.receiverFullName.toLowerCase().includes(lowerSearchTerm) || 
        (booking.userEmail && booking.userEmail.toLowerCase().includes(lowerSearchTerm))
      );
    }
    setFilteredBookings(currentBookings);
  }, [allBookings, searchTerm, filterStatus]);


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
  
    const getNicStatusBadgeVariant = (status: NicVerificationStatus | undefined): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'pending': return 'secondary';
            case 'verified': return 'default';
            case 'rejected': return 'destructive';
            case 'none':
            default:
            return 'outline';
        }
    };

  const getPaymentStatusVariant = (status: PaymentStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
      switch (status) {
          case 'Pending': return 'secondary';
          case 'Paid': return 'default';
          case 'Refunded': return 'destructive';
          default: return 'secondary';
      }
  };

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    setSelectedStatusMap(prev => ({ ...prev, [bookingId]: newStatus }));
  };

  const handleSaveStatus = async (bookingId: string) => {
    const newStatus = selectedStatusMap[bookingId];
    if (!newStatus) return;

    setUpdatingStatus(prev => ({ ...prev, [bookingId]: true }));
    try {
      const bookingDocRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setAllBookings(prevAllBookings =>
        prevAllBookings.map(b =>
          b.id === bookingId ? { ...b, status: newStatus, updatedAt: { seconds: Date.now()/1000, nanoseconds: 0 } as unknown as Timestamp } : b
        )
      );
      toast({
        title: "Status Updated",
        description: `Booking ${bookingId} status changed to ${newStatus}.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Update Failed",
        description: `Could not update status for booking ${bookingId}.`,
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handlePaymentStatusChange = (bookingId: string, newStatus: PaymentStatus) => {
    setSelectedPaymentStatusMap(prev => ({ ...prev, [bookingId]: newStatus }));
  };

  const handleSavePaymentStatus = async (bookingId: string) => {
    const newStatus = selectedPaymentStatusMap[bookingId];
    if (!newStatus) return;

    setUpdatingPaymentStatus(prev => ({ ...prev, [bookingId]: true }));
    try {
      const bookingDocRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingDocRef, {
        paymentStatus: newStatus,
        updatedAt: serverTimestamp()
      });
      setAllBookings(prevAllBookings =>
        prevAllBookings.map(b =>
          b.id === bookingId ? { ...b, paymentStatus: newStatus, updatedAt: { seconds: Date.now()/1000, nanoseconds: 0 } as unknown as Timestamp } : b
        )
      );
      toast({
        title: "Payment Status Updated",
        description: `Booking ${bookingId} payment status changed to ${newStatus}.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Update Failed",
        description: `Could not update payment status for booking ${bookingId}.`,
        variant: "destructive",
      });
    } finally {
      setUpdatingPaymentStatus(prev => ({ ...prev, [bookingId]: false }));
    }
  };


  if (loading && allBookings.length === 0) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading orders...</div>;
  }

  return (
    <div className="opacity-0 animate-fadeInUp space-y-6">
       <Button asChild variant="outline">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl sm:text-2xl font-headline text-accent">
            <Package className="mr-2 sm:mr-3 h-6 sm:h-7 w-6 sm:w-7 text-primary" /> All Customer Orders
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Manage and view all customer bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search ID, Name, Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-sm h-9 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as BookingStatus | 'All')}>
                <SelectTrigger className="w-full sm:w-[160px] text-sm h-9">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All" className="text-xs sm:text-sm">All Statuses</SelectItem>
                    {ALL_STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="capitalize text-xs sm:text-sm">
                        {s}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
          </div>

          {loading && allBookings.length > 0 ? (
             <div className="flex justify-center items-center py-6 sm:py-8"><Loader2 className="h-5 sm:h-6 w-5 sm:h-6 animate-spin text-primary mr-2" /> <span className="text-sm">Refreshing data...</span></div>
          ) : filteredBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6 sm:py-8">
              {allBookings.length > 0 ? "No orders match your current filters." : "No orders found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 py-2 text-xs sm:text-sm whitespace-nowrap">ID</TableHead>
                  <TableHead className="px-2 py-2 text-xs sm:text-sm whitespace-nowrap">Sender</TableHead>
                  <TableHead className="px-2 py-2 text-xs sm:text-sm whitespace-nowrap">Receiver</TableHead>
                  <TableHead className="px-2 py-2 text-xs sm:text-sm whitespace-nowrap">Service</TableHead>
                  <TableHead className="text-center px-1 py-2 text-xs sm:text-sm whitespace-nowrap">Weight (kg)</TableHead>
                  <TableHead className="text-center px-1 py-2 text-xs sm:text-sm whitespace-nowrap">Cost (LKR)</TableHead>
                  <TableHead className="text-center px-2 py-2 text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right min-w-[140px] px-2 py-2 text-xs sm:text-sm whitespace-nowrap">Booked On</TableHead>
                  <TableHead className="text-center min-w-[210px] px-2 py-2 text-xs sm:text-sm whitespace-nowrap">Order Status</TableHead>
                  <TableHead className="text-center min-w-[210px] px-2 py-2 text-xs sm:text-sm whitespace-nowrap">Payment</TableHead>
                  <TableHead className="text-center px-2 py-2 text-xs sm:text-sm whitespace-nowrap">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs truncate max-w-[100px] sm:max-w-[120px] px-2 py-2.5 whitespace-nowrap">
                        {booking.id}
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm px-2 py-2.5 whitespace-nowrap">{booking.senderFullName}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 py-2.5 whitespace-nowrap">{booking.receiverFullName}</TableCell>
                    <TableCell className="capitalize text-xs sm:text-sm px-2 py-2.5 whitespace-nowrap">{booking.serviceType.replace('_', ' ')}</TableCell>
                    <TableCell className="text-center text-xs sm:text-sm px-1 py-2.5">{booking.packageWeight}</TableCell>
                    <TableCell className="text-center text-xs sm:text-sm px-1 py-2.5">
                      {booking.estimatedCostLKR !== null && booking.estimatedCostLKR !== undefined ? booking.estimatedCostLKR.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center px-2 py-2.5">
                      <Badge variant={getStatusVariant(booking.status)} className="text-xs whitespace-nowrap">{booking.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm px-2 py-2.5 whitespace-nowrap">
                      {booking.createdAt ? format(booking.createdAt.toDate(), 'PPp') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center px-2 py-2.5">
                       <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Select
                            value={selectedStatusMap[booking.id] || booking.status}
                            onValueChange={(value) => handleStatusChange(booking.id, value as BookingStatus)}
                            disabled={updatingStatus[booking.id]}
                        >
                            <SelectTrigger className="h-8 text-xs w-auto min-w-[100px] sm:min-w-[110px] flex-grow-0">
                               <SelectValue placeholder="Change status" />
                            </SelectTrigger>
                            <SelectContent>
                            {ALL_STATUSES.map(s => (
                                <SelectItem key={s} value={s} className="capitalize text-xs">
                                {s}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <Button
                            size="sm"
                            onClick={() => handleSaveStatus(booking.id)}
                            disabled={updatingStatus[booking.id] || selectedStatusMap[booking.id] === booking.status}
                            className="h-8 text-xs px-2 sm:px-3"
                        >
                            {updatingStatus[booking.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                            <Save className="h-3.5 w-3.5" />
                            )}
                        </Button>
                       </div>
                    </TableCell>
                     <TableCell className="text-center px-2 py-2.5">
                       <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Select
                            value={selectedPaymentStatusMap[booking.id] || 'Pending'}
                            onValueChange={(value) => handlePaymentStatusChange(booking.id, value as PaymentStatus)}
                            disabled={updatingPaymentStatus[booking.id]}
                        >
                            <SelectTrigger className="h-8 text-xs w-auto min-w-[100px] sm:min-w-[110px] flex-grow-0">
                               <SelectValue placeholder="Payment" />
                            </SelectTrigger>
                            <SelectContent>
                            {ALL_PAYMENT_STATUSES.map(s => (
                                <SelectItem key={s} value={s} className="capitalize text-xs">
                                {s}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <Button
                            size="sm"
                            onClick={() => handleSavePaymentStatus(booking.id)}
                            disabled={updatingPaymentStatus[booking.id] || selectedPaymentStatusMap[booking.id] === (booking.paymentStatus || 'Pending')}
                            className="h-8 text-xs px-2 sm:px-3"
                        >
                            {updatingPaymentStatus[booking.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                            <Save className="h-3.5 w-3.5" />
                            )}
                        </Button>
                       </div>
                    </TableCell>
                    <TableCell className="text-center px-2 py-2.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingBooking(booking)}>
                            <Eye className="h-4 w-4 text-primary" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {viewingBooking && (
        <Dialog open={!!viewingBooking} onOpenChange={(isOpen) => !isOpen && setViewingBooking(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary"/>Booking Details: <span className="ml-1 font-mono text-base text-muted-foreground">{viewingBooking.id}</span>
              </DialogTitle>
              <DialogDescription>
                Full information for the selected booking.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-6 py-4 text-sm">
                {/* Shipment Overview */}
                <section>
                  <h3 className="text-md font-semibold mb-2 border-b pb-1 text-accent">Shipment Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div><strong className="text-muted-foreground">ID:</strong> {viewingBooking.id}</div>
                    <div className="flex items-center gap-2"><strong className="text-muted-foreground">Order Status:</strong> <Badge variant={getStatusVariant(viewingBooking.status)} className="text-xs">{viewingBooking.status}</Badge></div>
                    <div className="flex items-center gap-2">
                        <strong className="text-muted-foreground">Payment Status:</strong> 
                        <Badge variant={getPaymentStatusVariant(viewingBooking.paymentStatus || 'Pending')} className="text-xs">
                            {viewingBooking.paymentStatus || 'Pending'}
                        </Badge>
                    </div>
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

                {/* Package & Purpose Details */}
                <section>
                  <h3 className="text-md font-semibold mb-2 border-b pb-1 text-accent flex items-center"><Box className="mr-2" />Package &amp; Purpose</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                     <div className="md:col-span-2"><strong className="text-muted-foreground">Contents:</strong> {viewingBooking.packageContents || 'N/A'}</div>
                     <div><strong className="text-muted-foreground">Purpose:</strong> <span className="capitalize">{viewingBooking.courierPurpose === 'custom' ? (viewingBooking.customPurpose || 'Custom') : (viewingBooking.courierPurpose?.replace(/_/g, ' ') || 'N/A')}</span></div>
                  </div>
                </section>

                {/* Receiver Details */}
                <section>
                  <h3 className="text-md font-semibold mb-2 border-b pb-1 text-accent">Receiver Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div><strong className="text-muted-foreground">Full Name:</strong> {viewingBooking.receiverFullName}</div>
                    <div><strong className="text-muted-foreground">Email:</strong> {viewingBooking.receiverEmail}</div>
                    <div className="md:col-span-2"><strong className="text-muted-foreground">Address:</strong> {viewingBooking.receiverAddress}</div>
                    <div><strong className="text-muted-foreground">Door Code:</strong> {viewingBooking.receiverDoorCode || 'N/A'}</div>
                    <div><strong className="text-muted-foreground">ZIP/Postal:</strong> {viewingBooking.receiverZipCode}</div>
                    <div><strong className="text-muted-foreground">City:</strong> {viewingBooking.receiverCity}</div>
                    <div><strong className="text-muted-foreground">Contact No:</strong> {viewingBooking.receiverContactNo}</div>
                    <div><strong className="text-muted-foreground">WhatsApp No:</strong> {viewingBooking.receiverWhatsAppNo || 'N/A'}</div>
                  </div>
                </section>

                {/* Sender Details */}
                <section>
                  <h3 className="text-md font-semibold mb-2 border-b pb-1 text-accent">Sender Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div><strong className="text-muted-foreground">Full Name:</strong> {viewingBooking.senderFullName}</div>
                    <div><strong className="text-muted-foreground">Email (User):</strong> {viewingBooking.userEmail || 'N/A'}</div>
                    <div className="md:col-span-2"><strong className="text-muted-foreground">Address:</strong> {viewingBooking.senderAddress}</div>
                    <div><strong className="text-muted-foreground">Contact No:</strong> {viewingBooking.senderContactNo}</div>
                    <div><strong className="text-muted-foreground">WhatsApp No:</strong> {viewingBooking.senderWhatsAppNo || 'N/A'}</div>
                    <div><strong className="text-muted-foreground">User ID:</strong> {viewingBooking.userId}</div>
                     <div className="flex items-center gap-2">
                        <strong className="text-muted-foreground flex items-center"><Fingerprint className="mr-2"/>NIC Status:</strong> 
                        <Badge 
                            variant={getNicStatusBadgeVariant(viewingBooking.nicVerificationStatus)}
                            className={`text-xs capitalize ${viewingBooking.nicVerificationStatus === 'verified' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                        >
                            {viewingBooking.nicVerificationStatus || 'None'}
                        </Badge>
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4 sm:justify-between">
               {viewingBooking && (
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
                    {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
                  </Button>
                )}
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
