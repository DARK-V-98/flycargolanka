import Link from 'next/link';
import Image from 'next/image';

export default function FlyCargoLogo() {
  return (
    <Link href="/" className="flex items-center space-x-2 text-3xl font-bold text-primary hover:text-primary/80 transition-colors font-headline">
      {/* Container for logo and spinner, sized to fit the spinner */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Conic gradient spinner - fills its container (48px) */}
        <div
          className="absolute inset-0 rounded-full animate-spin-logo"
          style={{
            background: `conic-gradient(hsl(var(--primary)) 0% 25%, hsl(var(--background)) 25% 100%)`,
          }}
          aria-hidden="true"
        />
        {/* Mask to create the ring effect - 44px diameter, centered, with page background color */}
        <div
          className="absolute w-11 h-11 rounded-full bg-background"
          aria-hidden="true"
        />
        {/* Logo image - 40px diameter, centered and on top */}
        <Image
          src="/fg.png"
          alt="FlyCargo Lanka Logo"
          width={80}
          height={80}
          className="object-contain w-10 h-10 relative z-10"
          priority
        />
      </div>
      <span className="text-glow-primary">FlyCargo Lanka</span>
    </Link>
  );
}
