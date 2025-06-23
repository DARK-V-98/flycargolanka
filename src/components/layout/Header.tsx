
"use client";
import Link from 'next/link';
import NavLink from './NavLink';
import FlyCargoLogo from '@/components/icons/FlyCargoLogo';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogIn, UserCircle, LogOut, ShieldCheck, PackageSearch, UserCog, Info, BookMarked } from "lucide-react"; // Added BookMarked
import { useAuth } from '@/contexts/AuthContext';
import type { Route } from 'next';


const baseNavItems = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'About Us' },
  { href: '/book', label: 'Book Courier' },
];

export default function Header() {
  const { user, userProfile, role, logout, loading } = useAuth();

  const getNavItems = () => {
    let items = [...baseNavItems];
    if (!loading && user) {
      items.push({ href: '/my-bookings' as Route, label: 'My Bookings' });
      items.push({ href: '/track-package' as Route, label: 'Track Package' });
      if (role === 'admin' || role === 'developer') {
        items.push({ href: '/admin/dashboard' as Route, label: 'Admin Dashboard' });
      }
    }
    return items;
  };

  const navItemsToDisplay = getNavItems();

  return (
    <header className="bg-accent text-accent-foreground sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <FlyCargoLogo />
        </Link>
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-1 items-center">
            {navItemsToDisplay.map((item) => (
              <NavLink key={item.label} href={item.href} className="text-base px-2 py-1.5">
                {item.label === 'Admin Dashboard' && <ShieldCheck className="inline-block mr-0.5 h-3.5 w-3.5" />}
                {item.label === 'Track Package' && <PackageSearch className="inline-block mr-0.5 h-3.5 w-3.5" />}
                {item.label === 'About Us' && <Info className="inline-block mr-0.5 h-3.5 w-3.5" />}
                {item.label === 'My Bookings' && <BookMarked className="inline-block mr-0.5 h-3.5 w-3.5" />}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {loading ? (
             <Button variant="ghost" size="icon" className="animate-pulse">
                <UserCircle className="h-6 w-6" />
             </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || user.email || 'User'} />
                    <AvatarFallback>
                      {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <UserCircle />)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.displayName || user.email?.split('@')[0]}</p>
                    {user.email && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
                    {role && <p className="text-xs leading-none text-primary capitalize pt-1">{role}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <NavLink href="/auth" className="text-base px-3 py-1.5">
              <LogIn className="inline-block mr-2 h-4 w-4" /> Login
            </NavLink>
          )}

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                 <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="flex flex-col space-y-3 mt-8">
                  {navItemsToDisplay.map((item) => (
                    <NavLink key={item.label} href={item.href} className="text-lg text-center py-2.5">
                       {item.label === 'Admin Dashboard' && <ShieldCheck className="inline-block mr-2 h-5 w-5" />}
                       {item.label === 'Track Package' && <PackageSearch className="inline-block mr-2 h-5 w-5" />}
                       {item.label === 'About Us' && <Info className="inline-block mr-2 h-5 w-5" />}
                       {item.label === 'My Bookings' && <BookMarked className="inline-block mr-2 h-5 w-5" />}
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
