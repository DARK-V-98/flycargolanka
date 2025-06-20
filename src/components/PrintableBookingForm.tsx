
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

const PrintableBookingForm = React.forwardRef<HTMLDivElement, PrintableBookingFormProps>(({ booking }, ref) => {
  
  if (!booking) {
    // If no booking data, render a minimal div with the ref, or just null.
    // This div is needed for the ref to attach even when there's no content.
    return <div ref={ref} style={{ display: 'none' }} />;
  }

  const renderField = (label: string, value?: string | number | null, isFullWidth: boolean = false) => {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    return (
      <div className={`py-1 ${isFullWidth ? 'col-span-2' : ''}`}>
        <span className="font-semibold text-gray-700">{label}: </span>
        <span className="text-gray-600">{String(value)}</span>
      </div>
    );
  };
  
  const formatDate = (timestamp?: Timestamp) => {
    return timestamp ? format(timestamp.toDate(), 'PPP p') : 'N/A';
  };

  return (
    <div ref={ref} className="p-8 font-sans bg-white text-gray-800"> {/* Apply ref to the main content div */}
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .printable-card { border: 1px solid #e5e7eb !important; page-break-inside: avoid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .col-span-2 { grid-column: span 2 / span 2; }
        `}
      </style>
      
      <header className="text-center mb-8 border-b pb-4 border-gray-300">
        <h1 className="text-3xl font-bold text-blue-700">FlyCargo Lanka</h1>
        <p className="text-lg text-gray-600">Booking Confirmation</p>
      </header>

      <section className="mb-6 p-4 border border-gray-200 rounded-md printable-card">
        <h2 className="text-xl font-semibold mb-3 text-blue-600 border-b pb-2">Booking Overview</h2>
        {renderField("Booking ID", booking.id, true)}
        {renderField("Status", booking.status, true)}
        {renderField("Booked On", formatDate(booking.createdAt), true)}
        {booking.estimatedCostLKR !== undefined && booking.estimatedCostLKR !== null && renderField("Estimated Cost", `${booking.estimatedCostLKR.toLocaleString()} LKR`, true)}
      </section>

      <section className="mb-6 p-4 border border-gray-200 rounded-md printable-card">
        <h2 className="text-xl font-semibold mb-3 text-blue-600 border-b pb-2">Shipment Details</h2>
        <div className="grid grid-cols-2 gap-x-4">
            {renderField("Shipment Type", booking.shipmentType.charAt(0).toUpperCase() + booking.shipmentType.slice(1))}
            {renderField("Service Type", booking.serviceType.charAt(0).toUpperCase() + booking.serviceType.slice(1))}
            {renderField("Location Type", booking.locationType.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))}
            {renderField("Approx. Weight (KG)", booking.approxWeight)}
            {renderField("Approx. Value (USD)", booking.approxValue)}
            {renderField("Destination Country", booking.receiverCountry)}
        </div>
      </section>

      <section className="mb-6 p-4 border border-gray-200 rounded-md printable-card">
        <h2 className="text-xl font-semibold mb-3 text-blue-600 border-b pb-2">Receiver Details</h2>
        <div className="grid grid-cols-2 gap-x-4">
            {renderField("Full Name", booking.receiverFullName)}
            {renderField("Email", booking.receiverEmail)}
            {renderField("Address", booking.receiverAddress, true)}
            {renderField("Door Code", booking.receiverDoorCode)}
            {renderField("ZIP/Postal Code", booking.receiverZipCode)}
            {renderField("City", booking.receiverCity)}
            {renderField("Contact No.", booking.receiverContactNo)}
            {renderField("WhatsApp No.", booking.receiverWhatsAppNo)}
        </div>
      </section>

      <section className="mb-6 p-4 border border-gray-200 rounded-md printable-card">
        <h2 className="text-xl font-semibold mb-3 text-blue-600 border-b pb-2">Sender Details</h2>
         <div className="grid grid-cols-2 gap-x-4">
            {renderField("Full Name", booking.senderFullName)}
            {renderField("Email", booking.userEmail)}
            {renderField("Address", booking.senderAddress, true)}
            {renderField("Contact No.", booking.senderContactNo)}
            {renderField("WhatsApp No.", booking.senderWhatsAppNo)}
        </div>
      </section>
      
      { (booking.declaration1 || booking.declaration2) && (
        <section className="mt-6 p-4 border border-gray-200 rounded-md printable-card">
            <h2 className="text-xl font-semibold mb-3 text-blue-600 border-b pb-2">Declarations Agreed</h2>
            {booking.declaration1 && <p className="text-sm text-gray-600 mb-1">✓ Agreed to Important Guide, Amendment Fees & Terms-Conditions, and Remote Area Postal Codes.</p>}
            {booking.declaration2 && <p className="text-sm text-gray-600">✓ Agreed to Terms & Conditions and wish to proceed with shipment via CFC Express.</p>}
        </section>
      )}

      <footer className="mt-10 text-center text-xs text-gray-500 pt-4 border-t border-gray-300">
        <p>Thank you for choosing FlyCargo Lanka.</p>
        <p>No.05, Avariwatta, Katunayake | Hotline: +94 711 318 725 | Email: info@flycargolanka.lk</p>
      </footer>
    </div>
  );
});

PrintableBookingForm.displayName = 'PrintableBookingForm';
export default PrintableBookingForm;

