
'use client';

import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

// Note: Static metadata export is removed as RootLayout is now 'use client'.
// Site-wide metadata can be defined in a root server component or individual page.tsx files.
// export const metadata: Metadata = {
//   title: 'FlyCargo Lanka',
//   description: 'Courier services by FlyCargo Lanka',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={`${ptSans.className} font-body antialiased flex flex-col min-h-screen bg-background`}>
        <AuthProvider>
          <Header />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
