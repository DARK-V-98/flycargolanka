
import { HardHat } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <HardHat className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-bold font-headline text-accent mb-4">
        Under Maintenance
      </h1>
      <p className="text-lg text-foreground/80 max-w-md">
        Our site is currently undergoing scheduled maintenance. We'll be back online shortly. Thank you for your patience!
      </p>
    </div>
  );
}
