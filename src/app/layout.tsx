'use client';

import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { PT_Sans } from 'next/font/google';
import { usePathname } from 'next/navigation';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

// Note: Static metadata export is removed as RootLayout is now 'use client' for usePathname.
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
  const pathname = usePathname();
  const isAdminPage = pathname ? pathname.startsWith('/admin') : false;

  return (
    <html lang="en">
      <body className={`${ptSans.className} font-body antialiased flex flex-col min-h-screen bg-background`}>
        <AuthProvider>
          {!isAdminPage && <Header />}
          
          {isAdminPage ? (
            <div className="flex-1 flex flex-col min-h-0"> {/* Ensure admin layout can consume full height */}
              {children}
            </div>
          ) : (
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
          )}
          
          {!isAdminPage && <Footer />}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
