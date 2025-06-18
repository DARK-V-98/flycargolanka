import Link from 'next/link';
import Image from 'next/image';

export default function FlyCargoLogo() {
  return (
    <Link href="/" className="flex items-center space-x-2 text-3xl font-bold text-primary hover:text-primary/80 transition-colors font-headline">
      <Image src="/fg.png" alt="FlyCargo Logo" width={40} height={40} className="h-10 w-auto" />
      <span>FlyCargo</span>
    </Link>
  );
}
