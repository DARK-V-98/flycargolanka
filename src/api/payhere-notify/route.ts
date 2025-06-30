
import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase-admin'; // Using admin SDK for server-side operations

/**
 * Handles server-to-server notifications from Payhere.
 * This endpoint is crucial for reliably updating payment status.
 */
export async function POST(req: NextRequest) {
  if (!db) {
    console.error("Firestore Admin SDK is not initialized. Check server configuration for FIREBASE_SERVICE_ACCOUNT.");
    return new NextResponse("Server configuration error: Firestore not available.", { status: 500 });
  }

  try {
    const formData = await req.formData();
    
    const merchant_id = formData.get('merchant_id') as string;
    const order_id = formData.get('order_id') as string;
    const payhere_amount = formData.get('payhere_amount') as string;
    const payhere_currency = formData.get('payhere_currency') as string;
    const status_code = formData.get('status_code') as string;
    const md5sig = formData.get('md5sig') as string;

    console.log(`Received Payhere notification for order ${order_id} with status code ${status_code}`);
    
    // Read your Payhere Merchant Secret from environment variables for security.
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchant_secret) {
        console.error("Payhere merchant secret is not configured in environment variables (PAYHERE_MERCHANT_SECRET).");
        return new NextResponse("Server configuration error.", { status: 500 });
    }

    // Verify the signature to ensure the request is from Payhere
    const secretHash = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();
    const localMd5sig = crypto.createHash('md5')
      .update(
        `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${secretHash}`
      )
      .digest('hex')
      .toUpperCase();

    if (localMd5sig !== md5sig) {
      console.warn(`Payhere notification signature mismatch for order ${order_id}. Received: ${md5sig}, Expected: ${localMd5sig}`);
      return new NextResponse("Signature mismatch.", { status: 400 });
    }

    console.log(`Signature verified for order ${order_id}.`);

    const bookingDocRef = db.collection('bookings').doc(order_id);

    // Status code '2' means a successful payment.
    // Other codes: 0 (Pending), -1 (Canceled), -2 (Failed), -3 (Charged Back).
    if (status_code === '2') {
      console.log(`Attempting to update booking ${order_id} to 'Paid'.`);
      await bookingDocRef.update({
        paymentStatus: 'Paid',
        updatedAt: new Date(), // Use server timestamp from admin SDK
      });
      console.log(`Successfully updated payment status for booking ${order_id} to 'Paid'.`);
    } else {
      console.log(`Received non-successful payment status (${status_code}) for booking ${order_id}. No status change will be made.`);
    }

    return new NextResponse("OK", { status: 200 });

  } catch (error: any) {
    console.error("Error processing Payhere notification:", error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
