
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-accent text-accent-foreground mt-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-start gap-x-12 gap-y-8 py-12">
        {/* Left Column */}
        <div className="md:w-1/2 w-full space-y-6 text-left">
          <div className="flex justify-start items-center"> {/* Ensure logo and name are aligned left */}
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/fg.png" alt="FlyCargo Lanka Logo" width={40} height={40} className="h-10 w-auto" />
              <span className="text-2xl font-bold">FlyCargo Lanka</span>
            </Link>
          </div>
          
          <div className="mt-4"> {/* Copyright and Powered by */}
            <p className="text-base">&copy; {new Date().getFullYear()} FlyCargo Lanka. All rights reserved.</p>
            <p className="text-sm mt-2 opacity-80">Powered by esystemlk</p>
          </div>
          
          <div className="mt-4">
            <p className="font-semibold text-lg">Secure Online Payments</p>
            <a href="https://www.payhere.lk" target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
              <Image 
                src="https://www.payhere.lk/downloads/images/payhere_long_banner.png" 
                alt="PayHere Secure Payment Gateway" 
                width={300}
                height={56}
                className="h-auto"
              />
            </a>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:w-1/2 w-full space-y-4 text-left md:text-right">
          <p className="text-lg font-semibold">Contact Us</p>
          <address className="mt-2 text-sm opacity-90 not-italic space-y-1">
            <p>Fly cargo lanka. No.05, avariwatta, katunayake</p>
            <p>Corporate Line: <a href="tel:+94112260310" className="hover:underline">+94 112 260 310</a></p>
            <p>Hotline: <a href="tel:+94711318725" className="hover:underline">+94 711 318 725</a></p>
            <p>Email: <a href="mailto:info@flycargolanka.lk" className="hover:underline">info@flycargolanka.lk</a></p>
          </address>
        </div>
      </div>
    </footer>
  );
}
