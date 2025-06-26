
'use client';

import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PT_Sans } from 'next/font/google';
import MaintenancePage from './maintenance/page';
import { Loader2 } from 'lucide-react';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

// A new wrapper component to handle the maintenance mode check
const AppContent = ({ children }: { children: React.ReactNode }) => {
  const { maintenanceStatus, role, loading } = useAuth();

  if (loading || maintenanceStatus === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isUnderMaintenance = maintenanceStatus.isDown;
  const isPrivilegedUser = role === 'admin' || role === 'developer';

  if (isUnderMaintenance && !isPrivilegedUser) {
    return <MaintenancePage />;
  }

  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col">
        {children}
      </main>
      <Footer />
      <Toaster />
    </>
  );
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={`${ptSans.className} font-body antialiased flex flex-col min-h-screen bg-background`}>
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
