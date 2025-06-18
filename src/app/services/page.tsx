import PageHeader from '@/components/PageHeader';
import ServiceCard from '@/components/ServiceCard';
import { Globe2, MapPin, Truck, Archive } from 'lucide-react';
import Image from 'next/image';

const services = [
  {
    id: "international",
    icon: Globe2,
    title: 'International Shipping',
    description: 'Reach any corner of the globe with our reliable and efficient international courier services. We handle customs, tracking, and ensure your package arrives safely and on time.',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'global map',
  },
  {
    id: "local",
    icon: MapPin,
    title: 'Local Courier',
    description: 'Fast and dependable local delivery services tailored to your needs. Whether it\'s documents or parcels, we guarantee prompt delivery within your city or region.',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'city delivery',
  },
  {
    id: "freight",
    icon: Truck,
    title: 'Freight Forwarding',
    description: 'Comprehensive freight forwarding solutions for businesses of all sizes. We manage your cargo logistics by air, sea, or land, ensuring cost-effective and timely transport.',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'cargo ship',
  },
  {
    id: "vacuum",
    icon: Archive,
    title: 'Vacuum Packing',
    description: 'Protect your valuable and perishable goods with our professional vacuum packing services. Ideal for extending shelf life and ensuring items are secure during transit.',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'packed goods',
  },
];

export default function ServicesPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        title="Our Comprehensive Courier Services"
        description="FlyCargo offers a wide range of solutions to meet all your shipping needs. Discover how we can help you today."
      />
      <div className="space-y-16">
        {services.map((service, index) => (
          <section key={service.id} id={service.id} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 p-6 bg-card rounded-lg shadow-lg`}>
            <div className="md:w-1/2">
              <Image 
                src={service.image} 
                alt={service.title} 
                width={600} 
                height={400} 
                className="rounded-lg object-cover aspect-video"
                data-ai-hint={service.imageHint}
              />
            </div>
            <div className="md:w-1/2 space-y-4">
              <div className="flex items-center mb-2">
                <service.icon className="h-10 w-10 text-primary mr-3" />
                <h2 className="text-3xl font-bold font-headline text-accent">{service.title}</h2>
              </div>
              <p className="text-lg text-foreground/80 leading-relaxed">{service.description}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
