
'use server';

import crypto from 'crypto';
import type { PayhereData } from '@/types/payhere';

// IMPORTANT: These values are hardcoded based on your provided details.
// For better security in production, consider moving them to environment variables.
const MERCHANT_ID = '1230954';
const MERCHANT_SECRET = 'MjMwNDYxNDIyNjMyMzEwOTgyMzU1NjkwMDA5NjExOTI5NDA3MjA=';
const PAYHERE_MODE = 'sandbox'; // Set to 'live' for production
const APP_URL = 'http://localhost:3000'; // Your app's public URL

// Determine Payhere URL based on the mode.
const isLive = PAYHERE_MODE.trim() === 'live';
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
