"use client";
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function TrackPackagePage() {
  const trackingUrl = "https://expoceylonplc.com/track/";

  return (
    <div className="flex flex-col h-screen opacity-0 animate-fadeInUp">
      <header className="container mx-auto px-4 pt-8 pb-4">
        <PageHeader
          title="Track Your Package"
          description="Enter your tracking number on the page below to see the current status of your shipment."
        />
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tracking Information</AlertTitle>
          <AlertDescription>
            Tracking is provided by our partner, Expolanka. You are interacting directly with their website. If the area below appears blank, their site may not support embedding.
          </AlertDescription>
        </Alert>
      </header>
      
      <div className="flex-1 w-full border-t">
        <iframe
          src={trackingUrl}
          title="Expoceylon Tracking"
          className="w-full h-full border-0"
          sandbox="allow-forms allow-scripts allow-same-origin"
        ></iframe>
      </div>
    </div>
  );
}
