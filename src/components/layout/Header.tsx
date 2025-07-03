
"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, LogIn, UserCircle, LogOut, ShieldCheck, PackageSearch, UserCog, Info, BookMarked, Bell, Package, Fingerprint } from "lucide-react";
import { useAuth, type AppNotification } from '@/contexts/AuthContext';
import type { Route } from 'next';
import { formatDistanceToNow } from 'date-fns';


const baseNavItems = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'About Us' },
  { href: '/book', label: 'Book Courier' },
  { href: '/track-package', label: 'Track Package' },
];

export default function Header() {
  const { user, userProfile, role, logout, loading, notifications, markNotificationAsRead } = useAuth();
  const router = useRouter();

  const handleNotificationClick = async (notification: AppNotification) => {
    await markNotificationAsRead(notification.id);
    router.push(notification.link as Route);
  };


  const getNavItems = () => {
    let items = [...baseNavItems];
    if (!loading && user) {
      items.push({ href: '/my-bookings' as Route, label: 'My Bookings' });
      if (role === 'admin' || role === 'developer') {
        items.push({ href: '/admin/dashboard' as Route, label: 'Admin Dashboard' });
      }
    }
    return items;
  };

  const navItemsToDisplay = getNavItems();
  const unreadCount = notifications.length;

  return (
    <header className="bg-accent text-accent-foreground sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <FlyCargoLogo />
        </Link>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <nav className="hidden md:flex space-x-1 items-center">
            {navItemsToDisplay.map((item) => (
              <NavLink key={item.label} href={item.href as Route} className="text-base px-2 py-1.5">
                {item.label === 'Admin Dashboard' && <ShieldCheck className="inline-block mr-0.5 h-3.5 w-3.5" />}
                {item.label === 'Track Package' && <PackageSearch className="inline-block mr-0.5 h-3.5 w-3.5" />}
                {item.label === 'About Us' && <Info className="inline-block mr-0.5 h-3.5 w-3.5" />}
                {item.label === 'My Bookings' && <BookMarked className="inline-block mr-0.5 h-3.5 w-3.5" />}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 sm:w-96" align="end" forceMount>
                 <DropdownMenuLabel>
                    <p className="font-semibold">Notifications</p>
                 </DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 <ScrollArea className={unreadCount > 3 ? "h-[300px]" : "h-auto"}>
                    {unreadCount > 0 ? (
                        notifications.map((n) => (
                           <DropdownMenuItem key={n.id} onSelect={() => handleNotificationClick(n)} className="cursor-pointer items-start">
                             <div className="flex items-start space-x-3 py-1">
                                <div className="mt-1">
                                    {n.type === 'new_booking' ? <Package className="h-4 w-4 text-primary" /> 
                                    : n.type === 'nic_verification' ? <Fingerprint className="h-4 w-4 text-primary" />
                                    : <PackageSearch className="h-4 w-4 text-primary" />
                                    }
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm leading-snug whitespace-normal">{n.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {n.createdAt ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                                    </p>
                                </div>
                             </div>
                           </DropdownMenuItem>
                        ))
                    ) : (
                        <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                    )}
                 </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
                    <NavLink key={item.label} href={item.href as Route} className="text-lg text-center py-2.5">
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
