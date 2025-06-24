
'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (role !== 'admin' && role !== 'developer'))) {
      router.push('/auth?redirect=/admin/dashboard'); 
    }
  }, [user, role, loading, router]);

  if (loading || !user || !role || (role !== 'admin' && role !== 'developer')) {
    return (
      <div className="flex flex-col flex-grow justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading or Access Denied...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex-grow">
      {children}
    </div>
  );
}
