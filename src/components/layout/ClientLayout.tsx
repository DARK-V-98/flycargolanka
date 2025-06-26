
"use client";

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

export default function ClientLayout({ children }: { children: ReactNode }) {
  // This component acts as the client-side boundary.
  // It wraps the application in the AuthProvider, which handles auth state and renders the dynamic layout.
  return <AuthProvider>{children}</AuthProvider>;
}
