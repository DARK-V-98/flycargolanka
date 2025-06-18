import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  id?: string;
}

export default function ServiceCard({ icon: Icon, title, description, id }: ServiceCardProps) {
  return (
    <Card id={id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="items-center text-center">
        <div className="p-4 bg-primary/10 rounded-full inline-block mb-3">
          <Icon className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline text-accent">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center flex-grow">
        <CardDescription className="text-foreground/80 text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
