
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-12 opacity-0 animate-fadeInUp container mx-auto px-4 py-8">
      <PageHeader
        title="Privacy Policy"
        description="Your privacy is important to us. It is FlyCargo Lanka's policy to respect your privacy regarding any information we may collect from you across our website."
      />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Policy Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/90">
          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">1. Information We Collect</h3>
            <p>
              We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used. The types of information we collect include:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Personal Identification Information:</strong> Name, email address, phone number, physical address, and NIC details.</li>
              <li><strong>Booking Information:</strong> Sender and receiver details, package contents, value, and destination.</li>
              <li><strong>Payment Information:</strong> While we do not store your full credit card details, we process payment information through our secure payment gateway partner, Payhere.</li>
              <li><strong>Technical Information:</strong> Your IP address, browser type, and operating system for security and analytical purposes.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">2. How We Use Your Information</h3>
            <p>
              We use the information we collect in various ways, including to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, operate, and maintain our services.</li>
              <li>Process your transactions and manage your bookings.</li>
              <li>Communicate with you, either directly or through one of our partners, for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.</li>
              <li>Improve, personalize, and expand our services.</li>
              <li>Prevent fraud and enhance the security of our website.</li>
              <li>Comply with legal obligations, such as customs declarations.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">3. Data Sharing and Disclosure</h3>
            <p>
              We do not share your personally identifying information with third parties, except as required to provide our service or as required by law. This may include:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Service Providers:</strong> We may share information with our payment gateway (Payhere) and international courier partners to fulfill your shipment.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency).</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">4. Data Retention and Security</h3>
            <p>
              We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">5. Your Rights</h3>
            <p>
              You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services. You have the right to access, update, or delete your personal information through your profile page.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">6. Changes to This Policy</h3>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-accent mb-2">7. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us by calling our corporate line at <a href="tel:+94112260310" className="text-primary underline">+94 112 260 310</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
