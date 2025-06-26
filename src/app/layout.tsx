
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { PT_Sans } from 'next/font/google';
import type { Metadata } from 'next';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

// This is a Server Component, so metadata export is allowed.
export const metadata: Metadata = {
  title: 'FlyCargo Lanka',
  description: 'International & Domestic Courier Services in Sri Lanka',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ptSans.className} font-body antialiased`}>
        {/* AuthProvider is a Client Component that will handle the dynamic layout */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
