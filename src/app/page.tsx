
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe2, MapPin, Truck, Archive } from 'lucide-react';

const services = [
  { name: "International Shipping", icon: Globe2, description: "Reliable and fast international courier services to destinations worldwide.", href:"/services#international" },
  { name: "Local Delivery", icon: MapPin, description: "Swift and secure local delivery services across the region.", href:"/services#local"  },
  { name: "Freight Forwarding", icon: Truck, description: "Comprehensive freight forwarding solutions for your business needs.", href:"/services#freight"  },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center py-12 md:py-20 bg-gradient-to-br from-background to-secondary/30 rounded-xl shadow-lg overflow-hidden">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold font-headline text-primary mb-6 opacity-0 animate-fadeInUp text-glow-primary">
            Welcome to FlyCargo
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto opacity-0 animate-fadeInUp delay-200">
            Your trusted partner for fast, reliable, and secure courier services. We connect you to the world.
          </p>
          <div className="space-x-4 opacity-0 animate-fadeInUp delay-400">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-transform duration-300 hover:scale-105">
              <Link href="/book">Book a Courier</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 transition-transform duration-300 hover:scale-105">
              <Link href="/calculator">Get a Quote</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden">
        <div className="opacity-0 animate-fadeInUp">
          <PageHeader title="Why Choose FlyCargo?" description="Experience the difference with our commitment to excellence." />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 opacity-0 animate-fadeInScaleUp delay-200">
            <CardHeader>
              <CardTitle className="text-accent flex items-center"><Truck className="mr-2 h-6 w-6 text-primary" />Reliability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90">Count on us for on-time deliveries and secure handling of your valuable packages.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 opacity-0 animate-fadeInScaleUp delay-300">
            <CardHeader>
              <CardTitle className="text-accent flex items-center"><Globe2 className="mr-2 h-6 w-6 text-primary" />Global Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90">We connect you to a vast network of destinations, both locally and internationally.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 opacity-0 animate-fadeInScaleUp delay-400">
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
              className="shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 opacity-0 animate-fadeInScaleUp"
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

      <section className="text-center py-12 md:py-20 bg-accent text-accent-foreground rounded-xl shadow-lg overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6 opacity-0 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
            Ready to Ship?
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-0 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            Get started today with FlyCargo. We make shipping simple and efficient.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-transform duration-300 hover:scale-105 opacity-0 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
            <Link href="/book">Book Your Shipment Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
