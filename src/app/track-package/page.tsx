"use client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function TrackPackagePage() {
  const trackingUrl = "https://expoceylonplc.com/track/";

  return (
    <div className="opacity-0 animate-fadeInUp space-y-8 container mx-auto px-4 py-8">
      <PageHeader
        title="Track Your Package"
        description="Enter your tracking number in the field below to see the current status of your shipment."
      />
      
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tracking Information</AlertTitle>
          <AlertDescription>
            Tracking is provided by our partner, Expolanka. If the area below appears blank, their site may not support embedding.
          </AlertDescription>
        </Alert>
        <Card className="w-full overflow-hidden">
            <CardContent className="p-1 sm:p-2 aspect-w-16 aspect-h-12 -mb-2">
                <iframe
                    src={trackingUrl}
                    title="Expoceylon Tracking"
                    className="w-full h-[800px] border-0 rounded-md"
                    sandbox="allow-forms allow-scripts allow-same-origin"
                ></iframe>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
