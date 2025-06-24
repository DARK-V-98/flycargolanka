
import PageHeader from '@/components/PageHeader';
import Image from 'next/image';
import { Building2, Eye, Target } from 'lucide-react';

export default function AboutUsPage() {
  return (
    <div className="space-y-12 opacity-0 animate-fadeInUp container mx-auto px-4 py-8">
      <PageHeader
        title="About FlyCargo Lanka"
        description="Learn more about our company, values, and commitment to serving you."
      />

      {/* Moved About Us Section from Homepage */}
      <section className="py-12 md:py-16 opacity-0 animate-fadeInUp delay-300">
        <div className="container mx-auto px-4">
          <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-10 items-center">
            <div className="opacity-0 animate-fadeInUp delay-200">
              <Image src="/about.jpg" alt="About FlyCargo Lanka" width={600} height={400} quality={100} className="rounded-lg shadow-xl w-full h-auto" data-ai-hint="company team" />
            </div>
            <div className="opacity-0 animate-fadeInUp delay-400 space-y-4">
              <div className="flex items-center space-x-3 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
                <Building2 size={32} className="text-primary shrink-0" />
                <h2 className="text-3xl font-bold font-headline text-accent">
                  About Us
                </h2>
              </div>
              <p className="text-lg text-foreground/80 leading-relaxed opacity-0 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                At FlyCargo Lanka, we empower ecommerce businesses to soar beyond borders with fast, reliable, and affordable air cargo solutions.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed opacity-0 animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
                We understand the unique needs of online sellers, which is why we offer free insurance for your shipments, ensuring peace of mind with every delivery. Our commitment to competitive rates means you can send parcels worldwide without breaking the bank.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed opacity-0 animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
                Powered by innovative technology and a customer-first approach, we provide seamless logistics to help Sri Lankan ecommerce entrepreneurs thrive in the global marketplace. Trust FlyCargo Lanka to deliver your success, one parcel at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Moved Our Vision Section from Homepage */}
      <section className="py-12 md:py-16 opacity-0 animate-fadeInUp delay-500">
        <div className="container mx-auto px-4">
          <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-10 items-center">
            <div className="opacity-0 animate-fadeInUp delay-200 space-y-4">
              <div className="flex items-center space-x-3 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                  <Eye size={32} className="text-primary shrink-0" />
                  <h2 className="text-3xl font-bold font-headline text-accent">Our Vision</h2>
              </div>
              <p className="text-lg text-foreground/80 leading-relaxed opacity-0 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                To inspire meaningful connections across the globe by becoming the most caring and dependable logistics partner — bringing joy, comfort, and opportunity to every doorstep we reach.
              </p>
            </div>
            <div className="opacity-0 animate-fadeInUp delay-400">
              <Image src="/vision.png" alt="Our Vision" width={600} height={400} quality={100} className="rounded-lg shadow-xl w-full h-auto" data-ai-hint="future strategy" />
            </div>
          </div>
        </div>
      </section>

      {/* Moved Our Mission Section from Homepage */}
      <section className="py-12 md:py-16 opacity-0 animate-fadeInUp delay-600">
        <div className="container mx-auto px-4">
          <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-10 items-center">
            <div className="opacity-0 animate-fadeInUp delay-200">
              <Image src="/mission.png" alt="Our Mission" width={600} height={400} quality={100} className="rounded-lg shadow-xl w-full h-auto" data-ai-hint="team action" />
            </div>
            <div className="opacity-0 animate-fadeInUp delay-400 space-y-4">
               <div className="flex items-center space-x-3 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
                  <Target size={32} className="text-primary shrink-0" />
                  <h2 className="text-3xl font-bold font-headline text-accent">Our Mission</h2>
              </div>
              <p className="text-lg text-foreground/80 leading-relaxed opacity-0 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                At Fly Cargo Lanka, we go beyond delivery — we carry emotions, memories, and dreams. With a deep understanding of what every shipment means, we offer smart, secure, and heart-driven logistics solutions for individuals and businesses. From thoughtful family packages to professional exports, we deliver with care, speed, and a promise to always go the extra mile — delivering beyond borders, and beyond expectations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
