"use client";

import { useState } from 'react';
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PackageSearch } from 'lucide-react';

export default function TrackPackagePage() {
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      // The tracknum parameter is used by UPS to pre-fill the tracking number
      const trackUrl = `https://www.ups.com/track?loc=en_SG&tracknum=${encodeURIComponent(trackingNumber.trim())}&requester=ST/`;
      window.open(trackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 opacity-0 animate-fadeInUp">
      <PageHeader
        title="Track Your Package"
        description="Enter your tracking number below to see the current status of your shipment via UPS."
      />
      
      <div className="max-w-xl mx-auto">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <PackageSearch className="mr-2 text-primary h-6 w-6"/>
                    Enter Tracking Number
                </CardTitle>
                <CardDescription>
                    Your package status will be opened in a new tab on the official UPS tracking website.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleTrack}>
                <CardContent>
                    <Input 
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g., 1Z9999999999999999"
                        className="text-lg py-6"
                        required
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" size="lg" disabled={!trackingNumber.trim()}>
                        Track on UPS
                    </Button>
                </CardFooter>
            </form>
        </Card>
      </div>
    </div>
  );
}
