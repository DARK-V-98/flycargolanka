
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

// The metadata export has been removed to resolve the build error, as this file contains client-side logic.
// SEO can be managed on a per-page basis if needed.

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
