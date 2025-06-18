import Link from 'next/link';
import Image from 'next/image';

export default function FlyCargoLogo() {
  return (
    <Link href="/" className="flex items-center space-x-2 text-3xl font-bold text-primary hover:text-primary/80 transition-colors font-headline">
      <div className="relative w-10 h-10"> {/* Container for logo image and spinner */}
        <Image 
          src="/fg.png" 
          alt="FlyCargo Logo" 
          width={40} 
          height={40} 
          className="object-contain w-full h-full" 
        />
        {/* Spinning circle element */}
        <div 
          className="absolute inset-[-4px] border-2 border-primary rounded-full animate-spin-logo"
          aria-hidden="true"
        ></div>
      </div>
      <span>FlyCargo</span>
    </Link>
  );
}
