
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
  activeClassName = "bg-primary/20 text-primary font-semibold",
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
          : "border-transparent hover:text-primary/80" // Default and hover styles for dark header
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
