
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Users, Package, Settings2, BadgeCheck, ArrowRight, DatabaseZap, Plane, Landmark } from "lucide-react";
import PageHeader from '@/components/PageHeader';

const adminNavItems = [
  { 
    href: '/admin/orders', 
    label: 'Manage Orders', 
    description: "View and update all customer bookings.",
    icon: Package 
  },
  { 
    href: '/admin/manage-roles', 
    label: 'Manage Roles', 
    description: "Assign or change roles for users.",
    icon: Users 
  },
  { 
    href: '/admin/rates', 
    label: 'Manage Rates', 
    description: "Set shipping prices for countries and weights.",
    icon: Settings2
  },
  { 
    href: '/admin/verify-nic', 
    label: 'Verify NIC', 
    description: "Approve or reject user NIC submissions.",
    icon: BadgeCheck 
  },
  {
    href: '/admin/import-rates',
    label: 'Import Rates',
    description: "Bulk upload shipping rates from a CSV file.",
    icon: DatabaseZap
  },
  {
    href: '/admin/manage-offers',
    label: 'Special Offers',
    description: "Manage special bulk cargo offers for homepage.",
    icon: Plane
  },
   {
    href: '/admin/manage-payments',
    label: 'Manage Payments',
    description: "Enable or disable payment gateways like Payhere.",
    icon: Landmark
  },
];


export default function AdminDashboardPage() {
  return (
    <div className="opacity-0 animate-fadeInUp space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Select a task below to manage your application."
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminNavItems.map((item) => (
            <Link href={item.href} key={item.href} className="group">
                <Card className="shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-accent">
                    <item.icon className="mr-3 h-7 w-7 text-primary"/>{item.label}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
                <CardDescription className="p-6 pt-0 text-sm text-primary group-hover:underline flex items-center">
                    Go to {item.label} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </CardDescription>
                </Card>
            </Link>
        ))}
      </div>
    </div>
  );
}
