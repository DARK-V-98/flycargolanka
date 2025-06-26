import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { PT_Sans } from 'next/font/google';
import type { Metadata } from 'next';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | FlyCargo Lanka',
    default: 'FlyCargo Lanka - International & Domestic Courier Services in Sri Lanka',
  },
  description: 'FlyCargo Lanka offers fast, reliable, and affordable international and domestic courier services from Sri Lanka. Specialized in e-commerce logistics with free insurance. Get a free quote and book your shipment today!',
  keywords: [
    'courier service Sri Lanka',
    'international shipping Sri Lanka',
    'e-commerce logistics',
    'air cargo Sri Lanka',
    'parcel delivery',
    'freight forwarding',
    'FlyCargo',
    'FlyCargo Lanka',
    'shipping from Sri Lanka',
  ],
  openGraph: {
    title: 'FlyCargo Lanka - Fast & Reliable Courier Services',
    description: 'Your trusted partner for international and domestic shipping from Sri Lanka. We specialize in e-commerce fulfillment with competitive rates and free insurance.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://flycargolanka.com',
    siteName: 'FlyCargo Lanka',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/og-image.png`, // Must be an absolute URL
        width: 1200,
        height: 630,
        alt: 'FlyCargo Lanka truck with packages',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlyCargo Lanka - Global Shipping from Sri Lanka',
    description: 'Fast, secure, and affordable courier services for e-commerce and personal shipping. Get your quote now!',
    images: [`${process.env.NEXT_PUBLIC_APP_URL || ''}/og-image.png`], // Must be an absolute URL
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  }
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={`${ptSans.className} font-body antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
