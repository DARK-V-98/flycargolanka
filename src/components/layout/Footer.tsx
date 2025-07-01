import Image from 'next/image';
import Link from 'next/link';
import { Facebook, MessageSquare } from 'lucide-react';

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.05-4.86-.95-6.69-2.81-1.77-1.8-2.55-4.16-2.4-6.61.12-2.04 1.03-3.96 2.4-5.36 1.17-1.16 2.61-1.96 4.15-2.41.02-1.6.01-3.2-.01-4.8.48-.01.96-.02 1.43-.02z"></path>
  </svg>
);


export default function Footer() {
  return (
    <footer className="bg-accent text-accent-foreground mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8 py-12">
          {/* Left Column: Logo and Copyright */}
          <div className="md:col-span-1 space-y-6 text-left">
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/fg.png" alt="FlyCargo Lanka Logo" width={40} height={40} className="h-10 w-auto" />
              <span className="text-2xl font-bold">FlyCargo Lanka</span>
            </Link>
            <div className="mt-4">
              <p className="text-sm opacity-80">Powered by esystemlk</p>
              <p className="text-base mt-2">&copy; {new Date().getFullYear()} FlyCargo Lanka. All rights reserved.</p>
            </div>
          </div>

          {/* Middle Column: Quick Links */}
          <div className="md:col-span-1 space-y-4 text-left md:text-center">
            <div className="text-lg font-semibold">Quick Links</div>
            <nav className="mt-2 text-sm opacity-90 space-y-2 flex flex-col items-start md:items-center">
              <Link href="/book" className="hover:underline">Book Courier</Link>
              <Link href="/track-package" className="hover:underline">Track Package</Link>
              <Link href="/services" className="hover:underline">About Us</Link>
              <Link href="/terms" className="hover:underline">Terms & Conditions</Link>
              <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
              <Link href="/return-policy" className="hover:underline">Return & Refund Policy</Link>
            </nav>
          </div>

          {/* Right Column: Contact & Socials */}
          <div className="md:col-span-1 space-y-4 text-left md:text-right">
            <div className="text-lg font-semibold">Contact Us</div>
            <address className="mt-2 text-sm opacity-90 not-italic space-y-1">
              <div>Fly cargo lanka. No.05, avariwatta, katunayake</div>
              <div>Mobile: <a href="tel:+94704917636" className="hover:underline">+94 704 917 636</a></div>
              <div>Landline: <a href="tel:+94112345678" className="hover:underline">+94 11 234 5678</a></div>
            </address>

            <div className="pt-4">
                <div className="text-lg font-semibold">Follow Us</div>
                <div className="flex items-center md:justify-end space-x-4 mt-2">
                    <a href="https://wa.me/94704917636" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:opacity-80 transition-opacity">
                        <MessageSquare className="h-6 w-6"/>
                    </a>
                    <a href="https://www.facebook.com/share/1LXH5NvzJV/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
                        <Facebook className="h-6 w-6"/>
                    </a>
                    <a href="https://www.tiktok.com/@fly.cargo.lanka?_t=ZS-8xesOSRxtFn&_r=1" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:opacity-80 transition-opacity">
                        <TikTokIcon className="h-6 w-6"/>
                    </a>
                </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
