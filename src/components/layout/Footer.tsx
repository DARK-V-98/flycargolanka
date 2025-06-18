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
        <p className="text-base">&copy; {new Date().getFullYear()} FlyCargo Lanka. All rights reserved.</p>
        <p className="text-sm mt-2 opacity-80">Powered by Fly Cargo Lanka</p>
      </div>
    </footer>
  );
}
