
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, UserCog, Mail, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react'; 
import { useAuth, type UserRole } from '@/contexts/AuthContext'; 
import { useState } from 'react';
import Link from 'next/link';


const manageRoleSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  role: z.enum(['user', 'admin', 'developer'], { required_error: "Please select a role." }),
});

type ManageRoleFormValues = z.infer<typeof manageRoleSchema>;

export default function ManageRolesPage() {
  const { toast } = useToast();
  const { user, role: currentUserRole, updateUserRoleByEmail } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ManageRoleFormValues>({
    resolver: zodResolver(manageRoleSchema),
    defaultValues: {
      email: '',
      role: 'user',
    },
  });

  const availableRoles: UserRole[] = [];
  if (currentUserRole === 'developer') {
    availableRoles.push('developer', 'admin', 'user');
  } else if (currentUserRole === 'admin') {
    availableRoles.push('admin', 'user');
  }
  
  const onSubmit: SubmitHandler<ManageRoleFormValues> = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!currentUserRole) {
      toast({ title: "Permission Denied", description: "Your role could not be determined.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    if (data.email === user?.email) {
        toast({ title: "Cannot Change Own Role", description: "You cannot change your own role using this form.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }

    try {
      await updateUserRoleByEmail(data.email, data.role as UserRole);
      toast({
        title: "Role Updated Successfully!",
        description: `User with email ${data.email} has been assigned the role of ${data.role}.`,
        variant: "default",
        action: <CheckCircle2 className="text-green-500" />,
      });
      form.reset();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Role Update Failed",
        description: error.message || "Could not update user role. Please check the email and try again.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInvalidSubmit = (errors: any) => {
    const firstErrorKey = Object.keys(errors)[0];
    const firstErrorMessage = errors[firstErrorKey]?.message || "Please correct the form errors.";
    toast({
        title: "Invalid Input",
        description: firstErrorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />,
    });
  };


  return (
    <div className="opacity-0 animate-fadeInUp space-y-6">
       <Button asChild variant="outline">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

      <Card className="shadow-xl border-border/50 max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline text-accent">
            <UserCog className="mr-3 h-7 w-7 text-primary" /> Manage User Roles 
          </CardTitle>
          <CardDescription>Assign or update roles for users by their email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>User Email</FormLabel>
                    <FormControl><Input type="email" placeholder="user@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><ShieldAlert className="mr-2 h-4 w-4 text-muted-foreground"/>Assign Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={availableRoles.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role to assign" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map(roleValue => (
                          <SelectItem key={roleValue} value={roleValue} className="capitalize">
                            {roleValue}
                          </SelectItem>
                        ))}
                         {availableRoles.length === 0 && <SelectItem value="no_roles" disabled>You cannot assign roles.</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || availableRoles.length === 0}>
                 {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Updating Role...</>
                  ) : (
                    "Update Role"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
