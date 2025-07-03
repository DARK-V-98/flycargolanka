
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Globe2, MapPin, Truck, ShoppingCart, Building2, Eye, Target, Calculator, Globe, ShieldCheck, LifeBuoy, Plane } from 'lucide-react';
import Image from 'next/image';
import LogoMarquee from '@/components/LogoMarquee';
import ShippingCalculatorForm from '@/components/ShippingCalculatorForm';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SpecialOffer } from '@/types/specialOffers';
import SpecialOffersSection from '@/components/SpecialOffersSection';


const services = [
  { name: "International Shipping", icon: Globe2, description: "Reliable and fast international courier services to destinations worldwide.", href:"/services#international" },
  { name: "Local Delivery", icon: MapPin, description: "Swift and secure local delivery services across the region.", href:"/services#local"  },
  { name: "Freight Forwarding", icon: Truck, description: "Comprehensive freight forwarding solutions for your business needs.", href:"/services#freight"  },
];

async function getSpecialOffers(): Promise<SpecialOffer[]> {
    try {
        const offersRef = collection(db, 'special_offers');
        const q = query(offersRef, where('enabled', '==', true), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialOffer));
    } catch (error) {
        console.error("Error fetching special offers for homepage:", error);
        return [];
    }
}


export default async function Home() {
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
  
  const specialOffers = await getSpecialOffers();

  return (
    <div className="flex-1 flex flex-col">
      <section className="shadow-lg overflow-hidden relative h-[85vh] lg:min-h-screen flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/bg.mp4"
          type="video/mp4"
        />
        <div className="absolute inset-0 bg-black/50 z-10" />
        
        <div className="container mx-auto px-4 relative z-20"> {/* Content on top */}
          <div className="grid grid-cols-1 gap-x-8 items-center">
            
            <div className="text-center space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline text-white text-shadow-black mb-6 opacity-0 animate-fadeInUp">
                WELCOME TO FLYCARGO LANKA
              </h1>
              
              <div className="flex flex-wrap justify-center items-center gap-4 opacity-0 animate-fadeInUp delay-400">
                <Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-lg hover:scale-105 transition-transform duration-300">
                  <Link href="/book">Book Now</Link>
                </Button>
                <Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-lg hover:scale-105 transition-transform duration-300">
                  <Link href="/#shipping-calculator-section">Fee Calculator</Link>
                </Button>
                 <Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-lg hover:scale-105 transition-transform duration-300">
                  <Link href="/track-package">Track Package</Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 mt-16 space-y-16">
        
        <section className="text-center opacity-0 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-primary/10 to-background shadow-2xl border-primary/20">
              <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold font-headline text-accent mb-4">
                Peace of Mind with Every Parcel
              </h2>
              <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
                We believe in the safety of your shipments. That's why every package you send with FlyCargo Lanka is protected by our <strong className="text-primary font-semibold">free insurance coverage</strong>, giving you complete confidence from pickup to delivery.
              </p>
            </Card>
          </div>
        </section>

        <section className="overflow-hidden opacity-0 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
          <div>
            <PageHeader title="Why Choose FlyCargo Lanka?" description="Experience the difference with our commitment to excellence." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105">
              <CardHeader>
                <CardTitle className="text-accent flex items-center"><Truck className="mr-2 h-6 w-6 text-primary" />Reliability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90">Count on us for on-time deliveries and secure handling of your valuable packages.</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105">
              <CardHeader>
                <CardTitle className="text-accent flex items-center"><Globe2 className="mr-2 h-6 w-6 text-primary" />Global Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90">We connect you to a vast network of destinations, both locally and internationally.</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105">
              <CardHeader>
                <CardTitle className="text-accent flex items-center"><LifeBuoy className="mr-2 h-6 w-6 text-primary" />Customer Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90">Our dedicated team is here to assist you every step of the way.</p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="py-12 overflow-hidden opacity-0 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
          <div>
            <PageHeader title="Our Core Services" />
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {services.map((service, index) => (
              <Card 
                key={service.name} 
                className="shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2"
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

        <SpecialOffersSection offers={specialOffers} />

        <section className="py-12 md:py-16 opacity-0 animate-fadeInUp" style={{animationDelay: '0.5s'}}>
          <div className="container mx-auto px-4">
            <div>
              <PageHeader title="Why Us?" description="Key advantages of partnering with FlyCargo Lanka."/>
            </div>
            <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-10 items-center">
              <div className="space-y-10">
                <div className="delay-200">
                  <div className="flex items-start space-x-4">
                    <ShoppingCart size={40} className="text-primary mt-1 shrink-0" />
                    <div>
                      <h3 className="text-2xl font-semibold text-accent mb-2">Solutions for E-Commerce and Logistics</h3>
                      <p className="text-lg text-foreground/80 leading-relaxed">
                        FlyCargo Lanka is your e-commerce logistics specialist, connecting sellers to buyers across the globe.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="delay-400">
                  <div className="flex items-start space-x-4">
                    <Globe size={40} className="text-primary mt-1 shrink-0" />
                    <div>
                      <h3 className="text-2xl font-semibold text-accent mb-2">Online Fulfillment Platform</h3>
                      <p className="text-lg text-foreground/80 leading-relaxed">
                        We provide an online platform for local and international fulfillment for eCommerce companies of all sizes. With access to global marketplaces and easy delivery fulfillment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="delay-400 md:order-last order-first">
                <Image src="/why.jpeg" alt="Why FlyCargo Lanka" width={600} height={400} quality={100} className="rounded-lg shadow-xl w-full h-auto" data-ai-hint="logistics team meeting" />
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-12 md:py-16 opacity-0 animate-fadeInUp" style={{animationDelay: '0.6s'}}>
          <div className="container mx-auto px-4">
            <div>
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

        <section className="py-12 md:py-16 opacity-0 animate-fadeInUp" style={{animationDelay: '0.7s'}}>
           <div className="container mx-auto px-4 text-center">
             <div>
                <PageHeader 
                    title="Secure & Trusted Payments"
                    description="We use PayHere, a trusted payment gateway, for all online transactions."
                />
             </div>
             <div className="mt-8 mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl transition-transform duration-300 hover:scale-105">
                 <a href="https://www.payhere.lk" target="_blank" rel="noopener noreferrer">
                    <Image 
                        src="/pay.png" 
                        alt="PayHere Secure Payment Gateway" 
                        width={800}
                        height={148}
                        quality={100}
                        className="w-full h-auto"
                    />
                 </a>
             </div>
           </div>
        </section>

        <section id="shipping-calculator-section" className="py-12 md:py-16 opacity-0 animate-fadeInUp" style={{animationDelay: '0.8s'}}>
          <div className="container mx-auto px-4">
            <div>
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

      </div>


      <section className="text-center py-12 md:py-20 bg-accent text-accent-foreground shadow-lg overflow-hidden opacity-0 animate-fadeInUp mt-16" style={{animationDelay: '0.9s'}}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6">
            Ready to Ship?
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Get started today with FlyCargo Lanka. We make shipping simple and efficient.
          </p>
          <Button asChild size="lg" className="bg-background hover:bg-background/90 text-foreground transition-transform duration-300 hover:scale-105">
            <Link href="/book">Book Your Shipment Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
