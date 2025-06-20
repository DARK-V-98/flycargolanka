
"use client";
import React from 'react';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

// Exporting the Booking type to be used by MyBookingsPage
export interface Booking {
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
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Cancelled';
  createdAt: Timestamp;
  estimatedCostLKR?: number | null;
  declaration1?: boolean;
  declaration2?: boolean;
}

interface PrintableBookingFormProps {
  booking: Booking | null; // Allow booking to be null
}

// This component is no longer used as print functionality was removed.
// Keeping it for reference or if it needs to be reinstated later.
// However, the content is cleared to effectively "remove" it from active use.
const PrintableBookingForm = React.forwardRef<HTMLDivElement, PrintableBookingFormProps>(({ booking }, ref) => {
  return <div ref={ref} style={{ display: 'none' }} />;
});

PrintableBookingForm.displayName = 'PrintableBookingForm';
export default PrintableBookingForm;
