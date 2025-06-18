

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe2, MapPin, Truck, Archive } from 'lucide-react';
import TypingEffect from '@/components/TypingEffect';
import FlyCargoLogo from '@/components/icons/FlyCargoLogo';

const services = [
  { name: "International Shipping", icon: Globe2, description: "Reliable and fast international courier services to destinations worldwide.", href:"/services#international" },
  { name: "Local Delivery", icon: MapPin, description: "Swift and secure local delivery services across the region.", href:"/services#local"  },
  { name: "Freight Forwarding", icon: Truck, description: "Comprehensive freight forwarding solutions for your business needs.", href:"/services#freight"  },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="py-12 md:py-20 bg-gradient-to-br from-background to-secondary/30 rounded-xl shadow-lg overflow-hidden relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,_2fr)_minmax(0,_3fr)] gap-x-8 items-center">
            
            <div className="md:text-left text-center space-y-6 order-1">
              <h1 className="text-5xl md:text-6xl font-bold font-headline text-primary mb-6 opacity-0 animate-fadeInUp text-glow-primary">
                Welcome to <TypingEffect text="FlyCargo Lanka" typingSpeed={70} deletingSpeed={40} pauseDuration={1500} />
              </h1>
              <p className="text-xl md:text-2xl text-foreground/80 mb-8 opacity-0 animate-fadeInUp delay-200">
                Your trusted partner for fast, reliable, and secure courier services. We connect you to the world.
              </p>
              <div className="space-x-0 md:space-x-4 space-y-4 md:space-y-0 flex flex-col sm:flex-row justify-center md:justify-start items-center opacity-0 animate-fadeInUp delay-400">
                 <Button asChild variant="default" size="lg" className="transition-transform duration-300 hover:scale-105">
                  <Link href="/book">Book a Courier</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 transition-transform duration-300 hover:scale-105">
                  <Link href="/calculator">Get a Quote</Link>
                </Button>
              </div>
            </div>

            <div className="relative w-full h-full flex items-center justify-center opacity-0 animate-fadeInUp delay-500 order-3 mt-8 md:mt-0 py-12">
              <div className="transform scale-[5]">
                <FlyCargoLogo hideText showSpinner={false} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden">
        <div className="opacity-0 animate-fadeInUp">
          <PageHeader title="Why Choose FlyCargo Lanka?" description="Experience the difference with our commitment to excellence." />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 opacity-0 animate-fadeInScaleUp delay-200 glass-pane">
            <CardHeader>
              <CardTitle className="text-accent flex items-center"><Truck className="mr-2 h-6 w-6 text-primary" />Reliability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90">Count on us for on-time deliveries and secure handling of your valuable packages.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 opacity-0 animate-fadeInScaleUp delay-300 glass-pane">
            <CardHeader>
              <CardTitle className="text-accent flex items-center"><Globe2 className="mr-2 h-6 w-6 text-primary" />Global Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90">We connect you to a vast network of destinations, both locally and internationally.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 opacity-0 animate-fadeInScaleUp delay-400 glass-pane">
            <CardHeader>
              <CardTitle className="text-accent flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>Customer Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90">Our dedicated team is here to assist you every step of the way.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="py-12 overflow-hidden">
         <div className="opacity-0 animate-fadeInUp">
          <PageHeader title="Our Core Services" />
         </div>
         <div className="grid md:grid-cols-3 gap-8 text-center">
          {services.map((service, index) => (
            <Card 
              key={service.name} 
              className="shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 opacity-0 animate-fadeInScaleUp glass-pane"
              style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
            >
              <CardHeader className="items-center">
                <div className="p-4 bg-primary/10 rounded-full inline-block mb-4 transition-transform duration-300 hover:scale-110">
                  <service.icon className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-accent font-headline">{service.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 mb-4">{service.description}</p>
                <Button variant="link" asChild className="text-primary hover:text-primary/80 transition-colors">
                  <Link href={service.href}>Learn More</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-20 text-primary-foreground rounded-xl shadow-lg overflow-hidden glass-pane">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6 opacity-0 animate-fadeInUp">
              About FlyCargo Lanka
            </h2>
            <p className="text-lg md:text-xl mb-4 opacity-0 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
              At FlyCargo Lanka, we empower ecommerce businesses to soar beyond borders with fast, reliable, and affordable air cargo solutions.
            </p>
            <p className="text-lg md:text-xl mb-4 opacity-0 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
              We understand the unique needs of online sellers, which is why we offer free insurance for your shipments, ensuring peace of mind with every delivery. Our commitment to competitive rates means you can send parcels worldwide without breaking the bank.
            </p>
            <p className="text-lg md:text-xl mb-8 opacity-0 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
              Powered by innovative technology and a customer-first approach, we provide seamless logistics to help Sri Lankan ecommerce entrepreneurs thrive in the global marketplace. Trust FlyCargo Lanka to deliver your success, one parcel at a time.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 text-primary-foreground rounded-xl shadow-lg overflow-hidden glass-pane">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-6 opacity-0 animate-fadeInUp">
              Our Vision
            </h2>
            <p className="text-lg md:text-xl opacity-0 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
              "To be Sri Lanka's most trusted air cargo partner, enabling seamless international connections for businesses and individuals with reliability and innovation."
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 text-primary-foreground rounded-xl shadow-lg overflow-hidden glass-pane">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-6 opacity-0 animate-fadeInUp">
              Our Mission
            </h2>
            <p className="text-lg md:text-xl opacity-0 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
              "To deliver customer-centric air cargo services for e-commerce entrepreneurs, offering free insurance, competitive rates, and cutting-edge technology to ensure fast, secure, and affordable global deliveries, empowering Sri Lankan businesses to succeed."
            </p>
          </div>
        </div>
      </section>

      <section className="text-center py-12 md:py-20 bg-accent text-accent-foreground rounded-xl shadow-lg overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6 opacity-0 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
            Ready to Ship?
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-0 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            Get started today with FlyCargo Lanka. We make shipping simple and efficient.
          </p>
          <Button asChild size="lg" className="bg-background hover:bg-background/90 text-foreground transition-transform duration-300 hover:scale-105 opacity-0 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
            <Link href="/book">Book Your Shipment Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
