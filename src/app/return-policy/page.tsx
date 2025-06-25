
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReturnPolicyPage() {
  return (
    <div className="space-y-12 opacity-0 animate-fadeInUp container mx-auto px-4 py-8">
      <PageHeader
        title="Return & Refund Policy"
        description="Our policy regarding service cancellations and refunds."
      />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Policy Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/90">
          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">1. General Policy</h3>
            <p>
              FlyCargo Lanka provides a shipping and logistics service. As such, our return and refund policy pertains to the service provided, not the items being shipped. We are committed to ensuring your package is delivered safely and on time.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">2. Booking Cancellations</h3>
            <p>
              You may cancel your booking for a full refund under the following conditions:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The cancellation request is made before the package has been picked up by our team or dropped off at our facility.</li>
              <li>The booking status is still "Pending" on our system.</li>
            </ul>
            <p className="mt-2">
              Once a booking is "Confirmed" or in a subsequent stage, it cannot be cancelled for a full refund as logistics processes have already been initiated. You can request a cancellation from your "My Bookings" page.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">3. Refunds for Service Failure</h3>
            <p>
              A full or partial refund of the shipping fee may be issued under specific circumstances of service failure, such as:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Loss of a package confirmed by our tracking system and investigation.</li>
              <li>Significant damage to the package due to mishandling on our part. Claims for damage require evidence and are subject to the terms of our insurance.</li>
              <li>Extreme delays significantly beyond the estimated delivery window for the selected service, not caused by customs, recipient unavailability, or force majeure events.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">4. Non-Refundable Circumstances</h3>
            <p>
              Refunds will not be issued in the following situations:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Delays, package returns, or seizures caused by customs authorities in the destination country.</li>
              <li>Delivery failure due to an incorrect or incomplete address provided by the sender.</li>
              <li>The recipient is unavailable or refuses to accept the delivery.</li>
              <li>The package contains items prohibited by our <a href="/terms" className="text-primary underline">Terms and Conditions</a>.</li>
              <li>The customer fails to pay any applicable duties, taxes, or other charges levied by the destination country's authorities.</li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">5. Claim Process</h3>
            <p>
              To file a claim for a refund or insurance, please contact our customer support team with your booking ID, a detailed description of the issue, and any supporting evidence (e.g., photos of damage). All claims must be submitted within the timeframes specified in our main Terms and Conditions.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">6. Contact Us</h3>
            <p>
              For any questions about our Return & Refund Policy, please contact us at <a href="mailto:info@flycargolanka.lk" className="text-primary underline">info@flycargolanka.lk</a> or call our corporate line at <a href="tel:+94112260310" className="text-primary underline">+94 112 260 310</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
