import './globals.css';
import { PT_Sans } from 'next/font/google';
import ClientLayout from '@/components/layout/ClientLayout';
import type { Metadata } from 'next';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | FlyCargo Lanka',
    default: 'FlyCargo Lanka - Courier Services in Sri Lanka',
  },
  description: 'Reliable and affordable international and domestic courier services. Ship parcels worldwide from Sri Lanka with tracking and insurance.',
  keywords: ['flycargo', 'cargo lanka', 'fcl', 'courier sri lanka', 'international shipping', 'parcel delivery'],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ptSans.className} font-body antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
