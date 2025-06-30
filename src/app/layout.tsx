import './globals.css';
import { PT_Sans } from 'next/font/google';
import ClientLayout from '@/components/layout/ClientLayout';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'air freight - fly cargo lanka global forwarding',
    template: '%s | FlyCargo Lanka',
  },
  description:
    'FlyCargo Lanka (FCL) offers reliable and affordable international and domestic courier services.',
  keywords: [
    'flycargo',
    'courier sri lanka',
    'logistics',
    'freight forwarding',
    'fcl',
    'FCL',
  ],
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ptSans.className} font-body antialiased`}>
        <ClientLayout>
          <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow flex flex-col">{children}</main>
            <Footer />
            <Toaster />
          </div>
        </ClientLayout>
      </body>
    </html>
  );
}
