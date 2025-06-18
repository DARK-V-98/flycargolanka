import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-accent text-accent-foreground py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center mb-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/fg.png" alt="FlyCargo Logo" width={32} height={32} className="h-8 w-auto" />
            <span className="text-xl font-bold">FlyCargo</span>
          </Link>
        </div>
        <p>&copy; {new Date().getFullYear()} FlyCargo Web. All rights reserved.</p>
        <p className="text-sm mt-1">Powered by Fly Cargo Lanka</p>
      </div>
    </footer>
  );
}
