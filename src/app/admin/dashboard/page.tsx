
"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function AdminDashboardPage() {
  const { role, user, userProfile, loading } = useAuth();

  // Auth check and redirection are now handled by AdminLayout.
  // If loading, AdminLayout shows a loading state.
  // If not authorized, AdminLayout redirects.
  // If execution reaches here, user is authenticated, authorized, and data is loaded.

  if (loading) {
    // This case should ideally be handled by AdminLayout's loading state,
    // but as a fallback for this specific page's content:
    return <div className="flex justify-center items-center h-full"><p>Loading dashboard...</p></div>;
  }
  
  // Ensure user and userProfile are non-null if not loading and authorized.
  // This check might be redundant if AdminLayout perfectly handles it.
  if (!user || !userProfile) {
    return <div className="flex justify-center items-center h-full"><p>Error loading user data.</p></div>;
  }

  return (
    <div className="opacity-0 animate-fadeInUp">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline text-accent">
            <ShieldCheck className="mr-3 h-7 w-7 text-primary" /> Welcome, {userProfile?.displayName || user.email}!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-lg">This is the main content area of the admin dashboard.</p>
          <p>You can manage users, site settings, and view analytics here.</p>
          
          <div className="mt-4 pt-4 border-t border-border/30">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Your Details:</h3>
            <p><span className="font-semibold">Role:</span> <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm">{role}</span></p>
            {user.email && <p className="mt-1"><span className="font-semibold">Email:</span> {user.email}</p>}
            {userProfile.uid && <p className="mt-1"><span className="font-semibold">User ID:</span> <span className="text-xs">{userProfile.uid}</span></p>}
          </div>
        </CardContent>
      </Card>
      {/* Add more dashboard specific widgets and content below */}
      {/* Example:
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader><CardTitle>Users Online</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">12</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Shipments</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">1,234</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">5</p></CardContent>
        </Card>
      </div>
      */}
    </div>
  );
}
