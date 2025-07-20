
'use client';

import { useState, useMemo } from 'react';
import type { SpecialOffer } from '@/types/specialOffers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plane } from 'lucide-react';
import Link from 'next/link';

interface SpecialOffersSectionProps {
    offers: SpecialOffer[];
}

export default function SpecialOffersSection({ offers }: SpecialOffersSectionProps) {
    const [selectedCountry, setSelectedCountry] = useState('all');

    const availableCountries = useMemo(() => {
        const countryNames = offers.map(offer => offer.country);
        return [...new Set(countryNames)].sort();
    }, [offers]);

    const filteredOffers = useMemo(() => {
        if (selectedCountry === 'all') {
            return offers;
        }
        return offers.filter(offer => offer.country === selectedCountry);
    }, [offers, selectedCountry]);

    if (offers.length === 0) {
        return null; // Don't render anything if there are no offers
    }

    return (
        <section className="py-12 md:py-16 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold font-headline text-accent">Special Bulk Cargo Offers</h2>
                        <p className="text-lg text-foreground/80 mt-2">Exclusive rates for select destinations. Grab these deals while they last!</p>
                    </div>

                    {availableCountries.length > 1 && (
                        <div className="w-full md:w-auto md:min-w-[250px]">
                            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by country..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {availableCountries.map(country => (
                                        <SelectItem key={country} value={country}>{country}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {filteredOffers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredOffers.map(offer => (
                            <Card key={offer.id} className="flex flex-col text-center shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2">
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
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>No offers available for the selected country.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
