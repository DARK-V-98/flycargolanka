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

export default function NavLink<T extends string>({ href, children, className, activeClassName = 'text-primary font-bold border-b-2 border-primary' }: NavLinkProps<T>) {
  const pathname = usePathname();
  const isActive = pathname === href.toString();

  return (
    <Link
      href={href}
      className={cn(
        "text-foreground hover:text-primary transition-colors py-2",
        className,
        isActive && activeClassName
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
