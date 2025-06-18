import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-accent text-accent-foreground py-12 mt-12">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center mb-6">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/fg.png" alt="FlyCargo Lanka Logo" width={40} height={40} className="h-10 w-auto" />
            <span className="text-2xl font-bold">FlyCargo Lanka</span>
          </Link>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold">Contact Us</p>
            <address className="mt-2 text-sm opacity-90 not-italic space-y-1">
              <p>Fly cargo lanka. No.05, avariwatta, katunayake</p>
              <p>Corporate Line: <a href="tel:+94112260310" className="hover:underline">+94 112 260 310</a></p>
              <p>Hotline: <a href="tel:+94711318725" className="hover:underline">+94 711 318 725</a></p>
              <p>Email: <a href="mailto:info@flycargolanka.lk" className="hover:underline">info@flycargolanka.lk</a></p>
            </address>
          </div>

          <div className="pt-6 border-t border-accent-foreground/20">
            <p className="text-base">&copy; {new Date().getFullYear()} FlyCargo Lanka. All rights reserved.</p>
            <p className="text-sm mt-2 opacity-80">Powered by Fly Cargo Lanka</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
