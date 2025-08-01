import Image from 'next/image';
import Link from 'next/link';

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
              <div>Landline: <a href="tel:0112260310" className="hover:underline">0112260310</a></div>
            </address>

            <div className="pt-4">
                <div className="text-lg font-semibold">Follow Us</div>
                <div className="flex items-center md:justify-end space-x-4 mt-2">
                    <a href="https://wa.me/94704917636" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:opacity-80 transition-opacity">
                        <Image src="/whatsapp.png" alt="WhatsApp" width={24} height={24} className="h-6 w-6" />
                    </a>
                    <a href="https://www.facebook.com/share/1LXH5NvzJV/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
                        <Image src="/facebook.png" alt="Facebook" width={24} height={24} className="h-6 w-6" />
                    </a>
                    <a href="https://www.tiktok.com/@fly.cargo.lanka?_t=ZS-8xesOSRxtFn&_r=1" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:opacity-80 transition-opacity">
                        <Image src="/tiktok.png" alt="TikTok" width={24} height={24} className="h-6 w-6" />
                    </a>
                </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
