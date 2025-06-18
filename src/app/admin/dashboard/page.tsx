
"use client";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function AdminDashboardPage() {
  const { role, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (role !== "admin" && role !== "developer"))) {
      router.push("/"); // Redirect to home if not authorized
    }
  }, [user, role, loading, router]);

  if (loading || (!user || (role !== "admin" && role !== "developer"))) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading or Access Denied...</p>
      </div>
    );
  }

  return (
    <div className="opacity-0 animate-fadeInUp">
      <PageHeader
        title="Admin Dashboard"
        description="Manage users and site settings."
      />
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline text-accent">
            <ShieldCheck className="mr-2 h-6 w-6 text-primary" /> Welcome, {role}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the admin dashboard. More features coming soon!</p>
          <p className="mt-2">Your role: <span className="font-semibold capitalize">{role}</span></p>
          <p className="mt-2">Your email: <span className="font-semibold">{user.email}</span></p>
        </CardContent>
      </Card>
    </div>
  );
}
