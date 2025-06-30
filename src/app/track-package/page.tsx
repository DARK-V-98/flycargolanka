"use client";
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function TrackPackagePage() {
  const trackingUrl = "https://expoceylonplc.com/track/";

  return (
    <div className="container mx-auto px-4 py-8 opacity-0 animate-fadeInUp">
      <PageHeader
        title="Track Your Package"
        description="Enter your tracking number on the page below to see the current status of your shipment."
      />
      <Alert className="mt-4 max-w-4xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Tracking Information</AlertTitle>
        <AlertDescription>
          Tracking is provided by our partner, Expolanka. You are interacting directly with their website. If the area below appears blank, their site may not support embedding.
        </AlertDescription>
      </Alert>
      
      <div className="mt-8 w-full h-[75vh] border rounded-lg overflow-hidden shadow-lg">
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
