
"use client";

import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, Mail, User, Save, AlertTriangle, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name cannot exceed 50 characters." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, userProfile, loading, role, updateUserDisplayName } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
    if (userProfile && userProfile.displayName) {
      form.reset({ displayName: userProfile.displayName });
    } else if (userProfile && !userProfile.displayName && user && user.email) {
      // Fallback to part of email if display name is not set
      form.reset({ displayName: user.email.split('@')[0] });
    }
  }, [user, userProfile, loading, router, form]);

  if (loading || !user || !userProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading Profile...</p>
      </div>
    );
  }

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    try {
      await updateUserDisplayName(data.displayName);
      toast({
        title: "Profile Updated",
        description: "Your display name has been successfully updated.",
        variant: "default",
        action: <CheckCircle2 className="text-green-500" />,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update your profile. Please try again.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />,
      });
    }
  };

  const onFormError = (errors: any) => {
    const firstErrorKey = Object.keys(errors)[0];
    if (!firstErrorKey) {
      toast({
        title: "Profile Update Error",
        description: "An unknown error occurred. Please check the form.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
      return;
    }
    const firstError = errors[firstErrorKey];
    const errorMessage = (firstError as any)?.message || "Please check the form for errors.";
     toast({
        title: "Profile Update Error",
        description: errorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
  };


  return (
    <div className="opacity-0 animate-fadeInUp">
      <PageHeader title="Your Profile" description="View and manage your account details." />
      <Card className="max-w-2xl mx-auto shadow-xl opacity-0 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary p-1">
            <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || user.email || 'User'} />
            <AvatarFallback className="text-3xl">
              {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <UserCircle className="h-12 w-12" />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-headline text-accent">
            {userProfile.displayName || user.email?.split('@')[0]}
          </CardTitle>
          <CardDescription className="flex items-center text-muted-foreground">
            <Mail className="mr-2 h-4 w-4" /> {user.email}
          </CardDescription>
           {role && (role === 'admin' || role === 'developer') && (
            <p className="text-sm text-primary capitalize mt-1">{role}</p>
          )}
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onFormError)}>
            <CardContent className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base flex items-center">
                      <User className="mr-2 h-5 w-5 text-muted-foreground" /> Display Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Your preferred display name" {...field} className="text-base py-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                 <FormLabel className="text-base flex items-center"><Mail className="mr-2 h-5 w-5 text-muted-foreground" /> Email Address (Read-only)</FormLabel>
                <FormControl>
                  <Input type="email" value={user.email || ''} readOnly disabled className="text-base py-3 bg-muted/50 cursor-not-allowed" />
                </FormControl>
              </FormItem>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full py-3 text-base" size="lg" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-5 w-5" /> {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              {(role === 'admin' || role === 'developer') && (
                <Button asChild variant="outline" className="w-full py-3 text-base" size="lg">
                  <Link href="/admin/dashboard">
                    <LayoutDashboard className="mr-2 h-5 w-5" /> Go to Admin Dashboard
                  </Link>
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
