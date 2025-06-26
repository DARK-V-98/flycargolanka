
import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { PT_Sans } from 'next/font/google';
import ClientLayout from '@/components/layout/ClientLayout';

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
  description: 'FlyCargo Lanka (FCL) offers reliable and affordable international and domestic courier services. As a leading cargo lanka provider, we ensure your packages are delivered safely and on time.',
  keywords: ['flycargo', 'cargolanka', 'fcl', 'courier sri lanka', 'international shipping', 'freight forwarding', 'logistics'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ptSans.className} font-body antialiased`}>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
