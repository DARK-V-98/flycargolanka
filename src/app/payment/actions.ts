
'use server';

import crypto from 'crypto';
import type { PayhereData } from '@/types/payhere';

// IMPORTANT: These values should be stored in your environment variables (.env.local)
// and should not be hardcoded in the source code for production.
const MERCHANT_ID = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '1230954';
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || 'MjMwNDYxNDIyNjMyMzEwOTgyMzU1NjkwMDA5NjExOTI5NDA3MjA=';

// Determine Payhere URL based on environment variable. Use 'live' for production.
const isLive = process.env.PAYHERE_MODE === 'live';
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
  const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
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
