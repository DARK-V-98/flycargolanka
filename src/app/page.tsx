
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe2, MapPin, Truck, ShoppingCart, Globe, Building2, Eye, Target, Calculator } from 'lucide-react';
import FlyCargoLogo from '@/components/icons/FlyCargoLogo';
import Image from 'next/image';
import LogoMarquee from '@/components/LogoMarquee';
import ShippingCalculatorForm from '@/components/ShippingCalculatorForm';


const services = [
  { name: "International Shipping", icon: Globe2, description: "Reliable and fast international courier services to destinations worldwide.", href:"/services#international" },
  { name: "Local Delivery", icon: MapPin, description: "Swift and secure local delivery services across the region.", href:"/services#local"  },
  { name: "Freight Forwarding", icon: Truck, description: "Comprehensive freight forwarding solutions for your business needs.", href:"/services#freight"  },
];

export default function Home() {
  const partnerLogos = [
    { name: "AliExpress", src: "/ali.webp" },
    { name: "Walmart", src: "/wall.png", removeBg: true },
    { name: "Amazon", src: "/amazon.svg" },
    { name: "Bonanza", src: "/bonanza.png", removeBg: true },
    { name: "eBay", src: "/ebay.svg" },
    { name: "Etsy", src: "/Etsy.svg" },
    { name: "Payoneer", src: "/payoneer.png" },
    { name: "Wish", src: "/Wish.svg" },
  ];

  return (
    <div className="space-y-16">
      <section className="py-12 md:py-20 rounded-xl shadow-lg overflow-hidden relative">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/bg.mp4"
          type="video/mp4"
        />
        
        
        <div className="container mx-auto px-4 relative z-20"> {/* Content on top */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,_2fr)_minmax(0,_3fr)] gap-x-8 items-center">
            
            <div className="md:text-left text-center space-y-6 order-1">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline text-[hsl(var(--chart-1))] mb-6 opacity-0 animate-fadeInUp text-glow-primary text-shadow-3d-navy">
                <span className="whitespace-nowrap text-3xl sm:text-4xl md:text-5xl">Welcome to </span>FlyCargo Lanka
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 opacity-0 animate-fadeInUp delay-200">
                Your trusted partner for fast, reliable, and secure courier services. We connect you to the world.
              </p>
              <div className="space-x-0 md:space-x-4 space-y-4 md:space-y-0 flex flex-col sm:flex-row justify-center md:justify-start items-center opacity-0 animate-fadeInUp delay-400">
                 <Button asChild variant="default" size="lg" className="transition-transform duration-300 hover:scale-105">
                  <Link href="/book">Book a Courier & Estimate Cost</Link>
                </Button>
                 <Button asChild variant="secondary" size="lg" className="transition-transform duration-300 hover:scale-105">
                  <Link href="/#shipping-calculator-section">Estimate Shipping Cost</Link>
                </Button>
              </div>
            </div>

            <div className="relative w-full h-full flex items-center justify-center opacity-0 animate-fadeInUp delay-500 order-3 mt-8 md:mt-0 py-12">
              <div className="transform scale-[3] sm:scale-[4] md:scale-[5]">
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
                  <Link href={service.href as any}>Learn More</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-16 opacity-0 animate-fadeInUp" style={{animationDelay: '0.5s'}}>
        <div className="container mx-auto px-4">
          <div className="opacity-0 animate-fadeInUp">
            <PageHeader title="Why Us?" description="Key advantages of partnering with FlyCargo Lanka."/>
          </div>
          <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-10 items-center">
            <div className="space-y-10">
              <div className="opacity-0 animate-fadeInUp delay-200">
                <div className="flex items-start space-x-4">
                  <ShoppingCart size={40} className="text-primary mt-1 shrink-0" />
                  <div>
                    <h3 className="text-2xl font-semibold text-accent mb-2 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>Solutions for E-Commerce and Logistics</h3>
                    <p className="text-lg text-foreground/80 leading-relaxed opacity-0 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                      Colombo mail is your e-commerce logistics specialist, connecting sellers to buyers across the globe.
                    </p>
                  </div>
                </div>
              </div>
              <div className="opacity-0 animate-fadeInUp delay-400">
                <div className="flex items-start space-x-4">
                  <Globe size={40} className="text-primary mt-1 shrink-0" />
                  <div>
                    <h3 className="text-2xl font-semibold text-accent mb-2 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>Online Fulfillment Platform</h3>
                    <p className="text-lg text-foreground/80 leading-relaxed opacity-0 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                      We provide an online platform for local and international fulfillment for eCommerce companies of all sizes. With access to global marketplaces and easy delivery fulfillment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="opacity-0 animate-fadeInUp delay-400 md:order-last order-first">
              <Image src="/us.png" alt="E-commerce Solutions" width={600} height={400} quality={100} className="rounded-lg shadow-xl w-full h-auto" data-ai-hint="logistics team" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Shipping Partner Section */}
      <section className="py-12 md:py-16 opacity-0 animate-fadeInUp" style={{animationDelay: '0.6s'}}>
        <div className="container mx-auto px-4">
          <div className="opacity-0 animate-fadeInUp">
            <PageHeader
              title="Shipping Partner For Your Favorite Stores"
              description="We deliver packages from these platforms and many more, right to your doorstep."
            />
          </div>
          <div className="mt-10">
            <LogoMarquee logos={partnerLogos} speed="30s" />
          </div>
        </div>
      </section>

      {/* Standalone Shipping Calculator Section */}
      <section id="shipping-calculator-section" className="py-12 md:py-16 opacity-0 animate-fadeInUp" style={{animationDelay: '0.7s'}}>
        <div className="container mx-auto px-4">
           <div className="opacity-0 animate-fadeInUp">
             <PageHeader 
                title="Quick Shipping Cost Estimator"
                description="Not ready to book? Get a quick cost estimate here."
             />
           </div>
           <div className="mt-10">
             <ShippingCalculatorForm />
           </div>
        </div>
      </section>


      <section className="text-center py-12 md:py-20 bg-accent text-accent-foreground rounded-xl shadow-lg overflow-hidden opacity-0 animate-fadeInUp" style={{animationDelay: '0.7s'}}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6 opacity-0 animate-fadeInUp" style={{animationDelay: '0.8s'}}>
            Ready to Ship?
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-0 animate-fadeInUp" style={{animationDelay: '0.9s'}}>
            Get started today with FlyCargo Lanka. We make shipping simple and efficient.
          </p>
          <Button asChild size="lg" className="bg-background hover:bg-background/90 text-foreground transition-transform duration-300 hover:scale-105 opacity-0 animate-fadeInUp" style={{animationDelay: '1s'}}>
            <Link href="/book">Book Your Shipment Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

