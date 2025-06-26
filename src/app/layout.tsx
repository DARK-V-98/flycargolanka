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
    default: 'FlyCargo Lanka - Courier Services in Sri Lanka',
    template: '%s | FlyCargo Lanka',
  },
  description:
    'FlyCargo Lanka (FCL) offers reliable and affordable international and domestic courier services.',
  keywords: [
    'flycargo',
    'courier sri lanka',
    'logistics',
    'freight forwarding',
  ],
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
