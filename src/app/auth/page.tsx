
"use client";

import { useState } from 'react';
import ReactCardFlip from 'react-card-flip';
import { useForm, type SubmitHandler, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, LogIn, UserPlus, Mail, Lock, RefreshCcw, Loader2 } from 'lucide-react';
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

interface LoginCardProps {
  loginForm: UseFormReturn<LoginFormValues>;
  handleLogin: SubmitHandler<LoginFormValues>;
  onFormError: (errors: any, formType: 'login' | 'signup' | 'forgotPassword') => void;
  handleGoogleSignIn: () => void;
  setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  setShowForgotPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isAnyAuthOperationPending: boolean;
  isGoogleSigningIn: boolean;
}

const LoginCard: React.FC<LoginCardProps> = ({
  loginForm,
  handleLogin,
  onFormError,
  handleGoogleSignIn,
  setIsFlipped,
  setShowForgotPassword,
  isAnyAuthOperationPending,
  isGoogleSigningIn
}) => {
  return (
    <Card className="w-full shadow-2xl">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl sm:text-3xl font-headline text-accent">Welcome Back!</CardTitle>
        <CardDescription>Log in to access your FlyCargo services.</CardDescription>
      </CardHeader>
      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(handleLogin, (errors) => onFormError(errors, 'login'))}>
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
              <Button 
                type="button" 
                variant="link" 
                onClick={() => !isAnyAuthOperationPending && setShowForgotPassword(true)} 
                className="px-0 text-sm text-primary hover:text-primary/80"
                disabled={isAnyAuthOperationPending}
              >
                  Forgot Password?
              </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
                type="submit" 
                className="w-full py-3 text-base" 
                size="lg"
                disabled={isAnyAuthOperationPending}
            >
              {loginForm.formState.isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Logging in...</>
              ) : (
                <><LogIn className="mr-2 h-5 w-5"/> Login</>
              )}
            </Button>
            <div className="relative w-full my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button 
                variant="outline" 
                type="button" 
                onClick={handleGoogleSignIn} 
                className="w-full py-3 text-base" 
                size="lg"
                disabled={isAnyAuthOperationPending}
            >
                {isGoogleSigningIn ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Signing in...</>
                ) : (
                  <><Image src="/google-logo.svg" alt="Google" width={20} height={20} className="mr-2" /> Sign in with Google</>
                )}
            </Button>
            <p className="text-sm text-muted-foreground pt-2">
              Don't have an account?{' '}
              <Button 
                variant="link" 
                type="button" 
                onClick={() => !isAnyAuthOperationPending && setIsFlipped(prev => !prev)} 
                className="text-primary hover:text-primary/80 px-1"
                disabled={isAnyAuthOperationPending}
              >
                Sign Up <UserPlus className="ml-1 h-4 w-4" />
              </Button>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

interface SignupCardProps {
  signupForm: UseFormReturn<SignupFormValues>;
  handleSignup: SubmitHandler<SignupFormValues>;
  onFormError: (errors: any, formType: 'login' | 'signup' | 'forgotPassword') => void;
  handleGoogleSignIn: () => void;
  setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  isAnyAuthOperationPending: boolean;
  isGoogleSigningIn: boolean;
}

const SignupCard: React.FC<SignupCardProps> = ({
  signupForm,
  handleSignup,
  onFormError,
  handleGoogleSignIn,
  setIsFlipped,
  isAnyAuthOperationPending,
  isGoogleSigningIn
}) => {
  return (
    <Card className="w-full shadow-2xl">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl sm:text-3xl font-headline text-accent">Create Your Account</CardTitle>
        <CardDescription>Join FlyCargo Lanka for seamless shipping.</CardDescription>
      </CardHeader>
        <Form {...signupForm}>
        <form onSubmit={signupForm.handleSubmit(handleSignup, (errors) => onFormError(errors, 'signup'))}>
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
            <Button 
                type="submit" 
                className="w-full py-3 text-base" 
                size="lg"
                disabled={isAnyAuthOperationPending}
            >
              {signupForm.formState.isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Signing Up...</>
              ) : (
                <><UserPlus className="mr-2 h-5 w-5"/> Sign Up</>
              )}
            </Button>
              <div className="relative w-full my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
              <Button 
                variant="outline" 
                type="button" 
                onClick={handleGoogleSignIn} 
                className="w-full py-3 text-base" 
                size="lg"
                disabled={isAnyAuthOperationPending}
              >
                {isGoogleSigningIn ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Signing in...</>
                ) : (
                  <><Image src="/google-logo.svg" alt="Google" width={20} height={20} className="mr-2" /> Sign up with Google</>
                )}
            </Button>
            <p className="text-sm text-muted-foreground pt-2">
              Already have an account?{' '}
              <Button 
                variant="link" 
                type="button" 
                onClick={() => !isAnyAuthOperationPending && setIsFlipped(prev => !prev)} 
                className="text-primary hover:text-primary/80 px-1"
                disabled={isAnyAuthOperationPending}
              >
                Login <LogIn className="ml-1 h-4 w-4" />
              </Button>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

interface AuthFlipCardComponentProps extends LoginCardProps, SignupCardProps {
  isFlipped: boolean;
}

const AuthFlipCardComponent: React.FC<AuthFlipCardComponentProps> = (props) => {
  return (
    <div className="w-full max-w-md opacity-0 animate-fadeInUp">
      <ReactCardFlip isFlipped={props.isFlipped} flipDirection="horizontal" containerStyle={{width: '100%'}}>
        <LoginCard {...props} />
        <SignupCard {...props} />
      </ReactCardFlip>
    </div>
  );
};


interface ForgotPasswordCardComponentProps {
  forgotPasswordForm: UseFormReturn<ForgotPasswordFormValues>;
  handleForgotPassword: SubmitHandler<ForgotPasswordFormValues>;
  onFormError: (errors: any, formType: 'login' | 'signup' | 'forgotPassword') => void;
  setShowForgotPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isAnyAuthOperationPending: boolean;
}

const ForgotPasswordCardComponent: React.FC<ForgotPasswordCardComponentProps> = ({
  forgotPasswordForm,
  handleForgotPassword,
  onFormError,
  setShowForgotPassword,
  isAnyAuthOperationPending
}) => {
  return (
    <div className="w-full max-w-md opacity-0 animate-fadeInUp">
      <Card className="shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-xl sm:text-2xl font-headline text-accent">Reset Password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link.</CardDescription>
        </CardHeader>
        <Form {...forgotPasswordForm}>
          <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword, (errors) => onFormError(errors, 'forgotPassword'))}>
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
              <Button 
                type="submit" 
                className="w-full py-3 text-base" 
                size="lg"
                disabled={isAnyAuthOperationPending}
              >
                {forgotPasswordForm.formState.isSubmitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Sending Link...</>
                ) : (
                  <><RefreshCcw className="mr-2 h-5 w-5" /> Send Reset Link</>
                )}
              </Button>
              <Button 
                variant="link" 
                type="button" 
                onClick={() => !isAnyAuthOperationPending && setShowForgotPassword(false)} 
                className="text-sm"
                disabled={isAnyAuthOperationPending}
                >
                Back to Login
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};


export default function AuthPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
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

  const isAnyAuthOperationPending = 
    loginForm.formState.isSubmitting || 
    signupForm.formState.isSubmitting || 
    forgotPasswordForm.formState.isSubmitting ||
    isGoogleSigningIn;

  const handleLogin: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      await signInWithEmail(data.email, data.password);
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
      setShowForgotPassword(false); 
      loginForm.reset(); 
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
    if (isAnyAuthOperationPending) return;
    setIsGoogleSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
        toast({
        title: "Google Sign-In Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
    } finally {
      setIsGoogleSigningIn(false);
    }
  };
  
  const onFormError = (errors: any, formType: 'login' | 'signup' | 'forgotPassword') => {
    const firstErrorKey = Object.keys(errors)[0];
    const title = formType === 'login' ? "Login Error" : formType === 'signup' ? "Signup Error" : "Password Reset Error";
    if (!firstErrorKey) {
      toast({
        title: title,
        description: "An unknown error occurred. Please check the form.",
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
      return;
    }
    const firstError = errors[firstErrorKey];
    const errorMessage = (firstError as any)?.message || "Please check the form for errors.";
      toast({
        title: title,
        description: errorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
  };

  const authFlipCardProps = {
    isFlipped,
    loginForm,
    signupForm,
    handleLogin,
    handleSignup,
    onFormError,
    handleGoogleSignIn,
    setIsFlipped,
    setShowForgotPassword,
    isAnyAuthOperationPending,
    isGoogleSigningIn,
  };

  const forgotPasswordCardProps = {
    forgotPasswordForm,
    handleForgotPassword,
    onFormError,
    setShowForgotPassword,
    isAnyAuthOperationPending,
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full py-8 md:py-12 px-4">
       {showForgotPassword 
         ? <ForgotPasswordCardComponent {...forgotPasswordCardProps} /> 
         : <AuthFlipCardComponent {...authFlipCardProps} />
       }
    </div>
  );
}
    

    

    