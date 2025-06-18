
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Route } from 'next';

type NavLinkProps<T extends string> = {
  href: Route<T> | URL;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
};

export default function NavLink<T extends string>({
  href,
  children,
  className,
  activeClassName = "bg-primary/30 backdrop-blur-md text-primary font-semibold border-primary",
}: NavLinkProps<T>) {
  const pathname = usePathname();
  const isActive = pathname === href.toString();

  return (
    <Link
      href={href}
      className={cn(
        "inline-block px-4 py-2 rounded-lg border transition-all duration-300 ease-in-out", // Base structure: padding, rounded, border, transition
        className, // Allows passing additional classes like text-lg
        isActive
          ? activeClassName // Active state styles
          : "bg-card/50 backdrop-blur-md border-transparent text-foreground hover:text-primary hover:bg-card/60 hover:border-primary/70" // Default and hover styles
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
