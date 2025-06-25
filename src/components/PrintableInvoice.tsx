
"use client";

import React from 'react';
import type { Booking } from '@/app/admin/orders/page';
import { format } from 'date-fns';
import Image from 'next/image';

interface PrintableInvoiceProps {
  booking: Booking;
}

// Using React.forwardRef to allow the parent component to get a ref to this component's DOM node
const PrintableInvoice = React.forwardRef<HTMLDivElement, PrintableInvoiceProps>(({ booking }, ref) => {
  const serviceDescription = `Shipping - ${booking.shipmentType} (${booking.serviceType}) - ${booking.approxWeight}kg`;
  
  return (
    <div ref={ref} className="p-10 font-sans text-sm text-black bg-white">
      <style type="text/css" media="print">
        {`
          @page { size: auto;  margin: 0mm; }
          body { -webkit-print-color-adjust: exact; }
        `}
      </style>
      <div className="flex justify-between items-start mb-8">
        <div>
          <Image src="/fg.png" alt="FlyCargo Lanka Logo" width={80} height={80} />
          <h1 className="text-2xl font-bold text-gray-800 mt-2">FlyCargo Lanka</h1>
          <p className="text-gray-600">No.05, Avariwatta, Katunayake</p>
          <p className="text-gray-600">info@flycargolanka.lk</p>
          <p className="text-gray-600">+94 112 260 310</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold uppercase text-gray-700">Invoice</h2>
          <p className="text-gray-600 mt-2"><strong>Invoice #:</strong> {booking.id}</p>
          <p className="text-gray-600"><strong>Date:</strong> {format(booking.createdAt.toDate(), 'PPP')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold border-b pb-1 mb-2 text-gray-700">Bill To:</h3>
          <p className="font-semibold">{booking.senderFullName}</p>
          <p>{booking.senderAddress}</p>
          <p>{booking.userEmail}</p>
        </div>
        <div>
          <h3 className="font-bold border-b pb-1 mb-2 text-gray-700">Ship To:</h3>
          <p className="font-semibold">{booking.receiverFullName}</p>
          <p>{booking.receiverAddress}</p>
          <p>{booking.receiverCity}, {booking.receiverCountry}</p>
        </div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border border-gray-300">Description</th>
            <th className="p-2 border border-gray-300 text-right">Amount (LKR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border border-gray-300 align-top">
              <p className="font-semibold">{serviceDescription}</p>
              <p className="text-xs text-gray-600">To: {booking.receiverCountry}</p>
            </td>
            <td className="p-2 border border-gray-300 text-right align-top">{booking.estimatedCostLKR?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end mt-8">
        <div className="w-full max-w-xs">
          <div className="flex justify-between py-2">
            <span className="font-semibold">Subtotal</span>
            <span>{booking.estimatedCostLKR?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-b-2 border-gray-300 mt-2">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg">{booking.estimatedCostLKR?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'} LKR</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-16 text-gray-600">
        <p>Thank you for your business!</p>
        <p>This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  );
});

PrintableInvoice.displayName = 'PrintableInvoice';

export default PrintableInvoice;
