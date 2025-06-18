
"use client";

import { useState } from 'react';
import ReactCardFlip from 'react-card-flip';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, LogIn, UserPlus, Mail, Lock, ExternalLink, RefreshCcw } from 'lucide-react';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type SignupFormValues = z.infer<typeof signupSchema>;

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
});
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;


export default function AuthPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signInWithGoogle, signUpWithEmail, signInWithEmail, sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });


  const handleLogin: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      await signInWithEmail(data.email, data.password);
      // Redirect is handled by AuthContext
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
    }
  };

  const handleSignup: SubmitHandler<SignupFormValues> = async (data) => {
    try {
      await signUpWithEmail(data.email, data.password);
      // Redirect is handled by AuthContext
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
    }
  };
  
  const handleForgotPassword: SubmitHandler<ForgotPasswordFormValues> = async (data) => {
    try {
      await sendPasswordReset(data.email);
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, a password reset link has been sent.",
        variant: "default",
      });
      setShowForgotPassword(false); // Hide the modal/form
      loginForm.reset(); // Optionally reset login form if email was prefilled
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Could not send password reset email.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
    }
  };


  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Redirect is handled by AuthContext
    } catch (error: any) {
       toast({
        title: "Google Sign-In Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
    }
  };
  
  const onFormError = (errors: any) => {
    const firstError = Object.values(errors)[0];
    const errorMessage = (firstError as any)?.message || "Please check the form for errors.";
     toast({
        title: "Form Error",
        description: errorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
  };

  if (showForgotPassword) {
    return (
      <div className="opacity-0 animate-fadeInUp flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] py-12">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-accent">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link.</CardDescription>
          </CardHeader>
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword, onFormError)}>
              <CardContent className="space-y-6">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input type="email" placeholder="you@example.com" {...field} className="pl-10 text-base py-3" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full py-3 text-base" size="lg">
                  <RefreshCcw className="mr-2 h-5 w-5" /> Send Reset Link
                </Button>
                <Button variant="link" onClick={() => setShowForgotPassword(false)} className="text-sm">
                  Back to Login
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    );
  }


  return (
    <div className="opacity-0 animate-fadeInUp">
      <PageHeader
        title={isFlipped ? "Create Your Account" : "Welcome Back!"}
        description={isFlipped ? "Join FlyCargo Lanka for seamless shipping." : "Log in to access your FlyCargo services."}
      />
       <div className="flex justify-center items-start min-h-[calc(100vh-25rem)]">
        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal" containerStyle={{width: '100%', maxWidth: '450px'}}>
          {/* LOGIN CARD (FRONT) */}
          <Card className="w-full shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-headline text-accent">Login</CardTitle>
              <CardDescription>Access your account or sign in with Google.</CardDescription>
            </CardHeader>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin, onFormError)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Email Address</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="email" placeholder="you@example.com" {...field} className="pl-10 text-base py-3"/>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" {...field} className="pl-10 text-base py-3"/>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <Button variant="link" onClick={() => setShowForgotPassword(true)} className="px-0 text-sm text-primary hover:text-primary/80">
                        Forgot Password?
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full py-3 text-base" size="lg">
                    <LogIn className="mr-2 h-5 w-5"/> Login
                  </Button>
                  <Button variant="outline" onClick={handleGoogleSignIn} className="w-full py-3 text-base" size="lg">
                     <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="mr-2" />
                    Sign in with Google
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Button variant="link" type="button" onClick={() => setIsFlipped(prev => !prev)} className="text-primary hover:text-primary/80 px-1">
                      Sign Up <UserPlus className="ml-1 h-4 w-4" />
                    </Button>
                  </p>
                </CardFooter>
              </form>
            </Form>
          </Card>

          {/* SIGNUP CARD (BACK) */}
          <Card className="w-full shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-headline text-accent">Sign Up</CardTitle>
              <CardDescription>Create an account to get started with FlyCargo Lanka.</CardDescription>
            </CardHeader>
             <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignup, onFormError)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Email Address</FormLabel>
                         <FormControl>
                           <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="email" placeholder="you@example.com" {...field} className="pl-10 text-base py-3"/>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="password" placeholder="Create a strong password" {...field} className="pl-10 text-base py-3"/>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="password" placeholder="Confirm your password" {...field} className="pl-10 text-base py-3"/>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full py-3 text-base" size="lg">
                    <UserPlus className="mr-2 h-5 w-5"/> Sign Up
                  </Button>
                   <Button variant="outline" onClick={handleGoogleSignIn} className="w-full py-3 text-base" size="lg">
                     <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="mr-2" />
                    Sign up with Google
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Button variant="link" type="button" onClick={() => setIsFlipped(prev => !prev)} className="text-primary hover:text-primary/80 px-1">
                      Login <LogIn className="ml-1 h-4 w-4" />
                    </Button>
                  </p>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </ReactCardFlip>
      </div>
    </div>
  );
}
