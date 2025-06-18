import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-headline font-bold text-primary mb-2 sm:text-5xl">{title}</h1>
      {description && <p className="text-lg text-foreground/80 sm:text-xl">{description}</p>}
    </div>
  );
}
