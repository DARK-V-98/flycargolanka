"use client";
import { useState, type FormEvent } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PackageSearch, Search, AlertTriangle } from "lucide-react";

export default function TrackPackagePage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [iframeSrc, setIframeSrc] = useState("");
  const [showIframe, setShowIframe] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trackingNumber.trim()) {
      const expoUrl = `https://expoceylonplc.com/track/?tracking_id=${trackingNumber.trim()}`;
      setIframeSrc(expoUrl);
      setShowIframe(true);
    }
  };

  return (
    <div className="opacity-0 animate-fadeInUp space-y-8 container mx-auto px-4 py-8">
      <PageHeader
        title="Track Your Package"
        description="Enter your tracking number below to see the current status of your shipment."
      />
      <Card className="max-w-2xl mx-auto shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline text-accent">
            <PackageSearch className="mr-2 h-6 w-6 text-primary" /> Enter Tracking ID
          </CardTitle>
          <CardDescription>
            View tracking information directly on this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tracknum">Tracking Number</Label>
                <Input
                  id="tracknum"
                  name="tracknum"
                  placeholder="Enter your tracking ID"
                  required
                  minLength={5}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                <Search className="mr-2 h-5 w-5" /> Track Package
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showIframe && (
        <div className="mt-8 space-y-4">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Display Notice</AlertTitle>
                <AlertDescription>
                    If the area below is blank, it means the tracking site has blocked the content from being shown on other websites for security reasons. This is expected behavior.
                </AlertDescription>
            </Alert>
            <Card className="w-full">
                <CardContent className="p-2">
                    <iframe
                        src={iframeSrc}
                        title="Expoceylon Tracking"
                        className="w-full h-[600px] border-0 rounded-md"
                        sandbox="allow-forms allow-scripts allow-same-origin"
                    ></iframe>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
