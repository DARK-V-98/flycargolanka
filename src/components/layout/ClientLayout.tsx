
'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from 'lucide-react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  const pathname = usePathname();

  const isMaintenancePage = pathname === '/maintenance';

  if (isMaintenancePage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col">
        {children}
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
