
"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Users, Package, Settings } from "lucide-react"; // Example icons

export default function AdminDashboardPage() {
  const { role, user, userProfile, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading dashboard...</p></div>;
  }
  
  if (!user || !userProfile) {
    return <div className="flex justify-center items-center h-full"><p>Error loading user data.</p></div>;
  }

  return (
    <div className="opacity-0 animate-fadeInUp space-y-6">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl sm:text-2xl font-headline text-accent">
            <ShieldCheck className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" /> Welcome, {userProfile?.displayName || user.email}!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm sm:text-base">
          <p className="text-base sm:text-lg">This is the main content area of the admin dashboard.</p>
          <p>You can manage users, site settings, and view analytics here.</p>
          
          <div className="mt-4 pt-4 border-t border-border/30">
            <h3 className="text-base sm:text-lg font-semibold text-muted-foreground mb-2">Your Details:</h3>
            <p><span className="font-semibold">Role:</span> <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs sm:text-sm">{role}</span></p>
            {user.email && <p className="mt-1"><span className="font-semibold">Email:</span> {user.email}</p>}
            {userProfile.uid && <p className="mt-1"><span className="font-semibold">User ID:</span> <span className="text-xs break-all">{userProfile.uid}</span></p>}
          </div>
        </CardContent>
      </Card>
      
      {/* Example: Responsive Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="shadow-lg border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl flex items-center text-accent">
              <Users className="mr-2 h-5 w-5 text-primary"/>Online Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold">12</p> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl flex items-center text-accent">
              <Package className="mr-2 h-5 w-5 text-primary"/>Total Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold">1,234</p> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl flex items-center text-accent">
              <Settings className="mr-2 h-5 w-5 text-primary"/>Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold">5</p> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
