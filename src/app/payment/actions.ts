
'use server';

import crypto from 'crypto';
import type { PayhereData } from '@/types/payhere';

// Read credentials from environment variables.
// Ensure they are set in your .env.local file.
const MERCHANT_ID = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;
const PAYHERE_MODE = process.env.PAYHERE_MODE || 'sandbox'; // Default to sandbox
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Default for local dev

// Runtime check to ensure variables are loaded
if (!MERCHANT_ID || !MERCHANT_SECRET || !APP_URL) {
    throw new Error("Payhere environment variables (NEXT_PUBLIC_PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET, NEXT_PUBLIC_APP_URL) are not set. Please check your .env.local file.");
}

// Determine Payhere URL based on the mode.
const isLive = PAYHERE_MODE.trim().toLowerCase() === 'live';
const PAYHERE_URL = isLive
  ? 'https://www.payhere.lk/pay/checkout' // Live URL
  : 'https://sandbox.payhere.lk/pay/checkout'; // Sandbox URL for testing

// This function generates the necessary data for a Payhere payment form, including the secure hash.
// It is a server action and runs only on the server, protecting the MERCHANT_SECRET.
export async function generatePayhereData(
  bookingId: string,
  amountLKR: number,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  address: string,
  city: string,
): Promise<PayhereData> {
  const domain = APP_URL;
  
  const returnUrl = `${domain}/payment/success?bookingId=${bookingId}`;
  const cancelUrl = `${domain}/payment/cancel?bookingId=${bookingId}`;
  const notifyUrl = `${domain}/api/payhere-notify`;

  const amountFormatted = amountLKR.toFixed(2);
  const currency = 'LKR';

  // Generate the hash
  const secretHash = crypto.createHash('md5').update(MERCHANT_SECRET).digest('hex').toUpperCase();
  const hashString = `${MERCHANT_ID}${bookingId}${amountFormatted}${currency}${secretHash}`;
  const signature = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

  return {
    url: PAYHERE_URL,
    merchant_id: MERCHANT_ID,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: phone,
    address: address,
    city: city,
    country: 'Sri Lanka',
    order_id: bookingId,
    items: `Shipment Booking: ${bookingId}`,
    currency: currency,
    amount: amountFormatted,
    hash: signature,
  };
}
