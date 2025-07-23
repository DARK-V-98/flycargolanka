
'use client';

import { useState, useMemo, useCallback } from 'react';
import type { SpecialOffer } from '@/types/specialOffers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';

interface GroupedOffers {
    [country: string]: SpecialOffer[];
}

interface SpecialOffersSectionProps {
    offers: SpecialOffer[];
}

const OfferCard = ({ offer }: { offer: SpecialOffer }) => (
    <div className="embla__slide flex-[0_0_100%]">
        <Card className="flex flex-col text-center shadow-lg h-full mx-2">
            <CardHeader>
                <div className="mx-auto p-4 bg-primary/10 rounded-full inline-block mb-4">
                    <Plane className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-accent text-2xl">{offer.country}</CardTitle>
                <CardDescription>{offer.weightDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div>
                    <p className="text-sm text-muted-foreground">Special Rate</p>
                    <p className="text-4xl font-bold text-primary">{offer.rate.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">LKR</span></p>
                </div>
                <div className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-md border border-dashed">
                    Includes <strong className="text-primary/90">free insurance</strong> for damage and loss. Subject to <Link href="/terms" className="underline hover:text-primary">terms and conditions</Link>.
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href="/book">Book This Offer</Link>
                </Button>
            </CardFooter>
        </Card>
    </div>
);


const CountryOfferCarousel = ({ country, offers }: { country: string, offers: SpecialOffer[] }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: offers.length > 1, align: 'start' });

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi]);

    return (
        <div className="relative">
            <div className="embla" ref={emblaRef}>
                <div className="embla__container flex">
                    {offers.map(offer => (
                        <OfferCard key={offer.id} offer={offer} />
                    ))}
                </div>
            </div>
            {offers.length > 1 && (
                <>
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full h-10 w-10 z-10 shadow-md"
                        onClick={scrollPrev}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full h-10 w-10 z-10 shadow-md"
                        onClick={scrollNext}
                    >
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </>
            )}
        </div>
    );
}


export default function SpecialOffersSection({ offers }: SpecialOffersSectionProps) {

    const groupedOffers = useMemo(() => {
        return offers.reduce((acc, offer) => {
            if (!acc[offer.country]) {
                acc[offer.country] = [];
            }
            acc[offer.country].push(offer);
            return acc;
        }, {} as GroupedOffers);
    }, [offers]);

    const countries = Object.keys(groupedOffers).sort();

    if (offers.length === 0) {
        return null; // Don't render anything if there are no offers
    }

    return (
        <section className="py-12 md:py-16 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline text-accent">Special Bulk Cargo Offers</h2>
                    <p className="text-lg text-foreground/80 mt-2">Exclusive rates for select destinations. Grab these deals while they last!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12">
                    {countries.map(country => (
                        <CountryOfferCarousel key={country} country={country} offers={groupedOffers[country]} />
                    ))}
                </div>
            </div>
        </section>
    );
}
