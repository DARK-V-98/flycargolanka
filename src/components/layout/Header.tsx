
import NavLink from './NavLink';
import FlyCargoLogo from '@/components/icons/FlyCargoLogo';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/calculator', label: 'Calculator' },
  { href: '/book', label: 'Book Courier' },
];

export default function Header() {
  return (
    <header className="bg-background/80 backdrop-blur-md sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <FlyCargoLogo />
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href as any} className="text-lg">
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <NavLink key={item.href} href={item.href as any} className="text-xl text-center">
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
