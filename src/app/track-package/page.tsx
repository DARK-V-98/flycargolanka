
"use client";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PackageSearch, Loader2, ExternalLink } from "lucide-react";

export default function TrackPackagePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="opacity-0 animate-fadeInUp space-y-8 container mx-auto px-4 py-8">
      <PageHeader
        title="Track Your Package"
        description="Enter your tracking number below to see the current status of your shipment via UPS."
      />
      <Card className="max-w-lg mx-auto shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline text-accent">
            <PackageSearch className="mr-2 h-6 w-6 text-primary" /> Enter Tracking ID
          </CardTitle>
          <CardDescription>
            You will be redirected to the official UPS tracking website in a new tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action="https://www.ups.com/track"
            method="GET"
            target="_blank" // This ensures the form submission opens in a new tab
            onSubmit={() => setIsSubmitting(true)}
            onAnimationEnd={() => setIsSubmitting(false)} // Reset if user comes back to the tab
          >
            <input type="hidden" name="loc" value="en_SG" />
            <input type="hidden" name="requester" value="ST/" />
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tracknum">Tracking Number</Label>
                <Input
                  id="tracknum"
                  name="tracknum" // Name attribute for UPS tracking
                  placeholder="Enter your UPS tracking ID"
                  required
                  minLength={5}
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Opening UPS Tracker...</>
                ) : (
                  <><ExternalLink className="mr-2 h-5 w-5" /> Track on UPS.com</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
