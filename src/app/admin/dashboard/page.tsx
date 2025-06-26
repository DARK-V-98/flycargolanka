
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Users, Package, Settings2, BadgeCheck, ArrowRight, DatabaseZap, PowerOff, AlertTriangle, Loader2 } from "lucide-react";
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from 'react';
import { getMaintenanceStatus, setMaintenanceMode } from '../actions';
import { useToast } from '@/hooks/use-toast';


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
];


export default function AdminDashboardPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
        if (role === 'developer') {
            setIsUpdating(true);
            const status = await getMaintenanceStatus();
            setIsMaintenanceMode(status.isDown);
            setIsUpdating(false);
        }
    }
    fetchStatus();
  }, [role]);

  const handleToggleMaintenanceMode = async () => {
    setIsUpdating(true);
    setShowDialog(false);
    const newStatus = !isMaintenanceMode;

    const result = await setMaintenanceMode(newStatus);
    if (result.success) {
      setIsMaintenanceMode(newStatus);
      toast({
        title: "Success",
        description: `Maintenance mode has been ${newStatus ? 'activated' : 'deactivated'}.`,
        variant: 'default',
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update maintenance mode.",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

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

        {role === 'developer' && (
            <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
                <Card className={`shadow-lg h-full flex flex-col border-2 ${isMaintenanceMode ? 'border-destructive' : 'border-green-500'}`}>
                    <CardHeader>
                        <CardTitle className={`flex items-center text-xl ${isMaintenanceMode ? 'text-destructive' : 'text-green-600'}`}>
                            <PowerOff className="mr-3 h-7 w-7" />
                            Maintenance Mode
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-muted-foreground">
                            {isMaintenanceMode 
                                ? "The site is currently DOWN for maintenance. Deactivate to bring it back online." 
                                : "The site is LIVE. Activate to take it down for maintenance."
                            }
                        </p>
                    </CardContent>
                    <CardDescription className="p-6 pt-0">
                         <Button 
                            onClick={() => setShowDialog(true)} 
                            disabled={isUpdating} 
                            variant={isMaintenanceMode ? 'default' : 'destructive'} 
                            className="w-full"
                         >
                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isMaintenanceMode ? "Deactivate" : "Activate"}
                        </Button>
                    </CardDescription>
                </Card>

                 <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                         <AlertTriangle className="mr-2 text-destructive h-6 w-6"/> Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will {isMaintenanceMode ? 'immediately make the website available to all users' : 'take the website offline for all non-admin users'}. Please confirm you want to proceed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleToggleMaintenanceMode} 
                        className={buttonVariants({ variant: isMaintenanceMode ? 'default' : 'destructive' })}
                        >
                        Confirm {isMaintenanceMode ? 'Deactivation' : 'Activation'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
            </AlertDialog>
        )}

      </div>
    </div>
  );
}
