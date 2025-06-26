"use client";

import { AuthProvider } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

// This component acts as a client-side boundary.
// It wraps its children with the AuthProvider, which contains client-side logic (hooks).
// This allows the root layout.tsx to remain a Server Component and export metadata.
export default function ClientLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
