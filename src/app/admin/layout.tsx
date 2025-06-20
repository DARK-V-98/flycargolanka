
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarHeader as AdminSidebarHeaderComponent,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter as AdminSidebarFooterComponent,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import FlyCargoLogo from '@/components/icons/FlyCargoLogo';
import { LogOut, UserCog, LayoutDashboard, ChevronLeft, Menu as MenuIcon, Package, Users, Settings2 } from 'lucide-react'; // Added Settings2
import { useEffect } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminSidebarHeader() {
  const { state: sidebarState } = useSidebar();
  return (
    <AdminSidebarHeaderComponent className="p-0">
      <Link href="/" className="flex items-center justify-center h-16 border-b border-border/30 p-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-t-md">
        <FlyCargoLogo hideText={sidebarState === 'collapsed'} showSpinner={false} />
      </Link>
    </AdminSidebarHeaderComponent>
  );
}


export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, userProfile, role, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || (role !== 'admin' && role !== 'developer'))) {
      router.push('/'); 
    }
  }, [user, role, loading, router]);

  if (loading || !user || !userProfile || (role !== 'admin' && role !== 'developer')) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <p className="text-foreground">Loading or Access Denied...</p>
      </div>
    );
  }

  const adminNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/manage-roles', label: 'Manage Roles', icon: Users },
    { href: '/admin/rates', label: 'Manage Rates', icon: Settings2 }, // Added Manage Rates
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen bg-muted/40 text-foreground">
        <Sidebar collapsible="icon" className="border-r border-border/50 bg-card shadow-md">
          <AdminSidebarHeader />
          <SidebarContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <Link href={item.href as any}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <AdminSidebarFooterComponent className="p-2 mt-auto border-t border-border/30">
             <SidebarMenu>
                <SidebarMenuItem>
                   <SidebarMenuButton asChild tooltip="Back to Site">
                        <Link href="/">
                            <ChevronLeft className="h-5 w-5" />
                            <span>Back to Site</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </AdminSidebarFooterComponent>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col overflow-hidden bg-background">
          <header className="bg-card text-card-foreground border-b border-border/50 h-16 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground h-8 w-8 data-[state=open]:bg-muted data-[state=closed]:bg-card hover:bg-muted md:hidden">
                <MenuIcon className="h-5 w-5"/>
              </SidebarTrigger>
               <SidebarTrigger className="text-foreground h-8 w-8 data-[state=open]:bg-muted data-[state=closed]:bg-card hover:bg-muted hidden md:flex">
               </SidebarTrigger>
              <h1 className="text-xl font-semibold text-accent hidden sm:block">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || user.email || 'User'} />
                        <AvatarFallback>
                          {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <UserCog />)}
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
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
