"use client";
import React, { useState } from 'react';
import Image from "next/image";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ChevronDown, Loader2 } from 'lucide-react';
import Link from 'next/link';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

const GithubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);

interface SignUpPageProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    heroImageSrc?: string;
    onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
    onGoogleSignUp?: () => void;
    onGithubSignUp?: () => void;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
        {children}
    </div>
);

export const SignUpPage: React.FC<SignUpPageProps> = ({
    title = <span className="font-semibold text-white tracking-tight">Create an account</span>,
    description = "Welcome! Create an account to get started.",
    heroImageSrc,
    onSignUp,
    onGoogleSignUp,
    onGithubSignUp,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVerificationSent, setIsVerificationSent] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const username = formData.get('username') as string;
        const terms = formData.get('terms');

        if (!terms) {
            setError("You must agree to the Terms and Privacy Policy");
            setIsLoading(false);
            return;
        }

        if (!firstName || !lastName || !username) {
            setError("All fields are required");
            setIsLoading(false);
            return;
        }

        // Check if username is already taken
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            setError("Username is already taken");
            setIsLoading(false);
            return;
        }

        try {
            // First, try to sign up with metadata
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        username: username,
                        full_name: `${firstName} ${lastName}`.trim(),
                    },
                },
            });

            if (error) {
                throw error;
            }

            // Fallback: If sign up successful, try to manually insert profile if trigger failed or didn't run
            // Note: This might fail if RLS prevents it or if user is not fully authenticated yet, 
            // but the Critical Step (creating the user) is done.
            if (data?.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        email,
                        first_name: firstName,
                        last_name: lastName,
                        username: username,
                        full_name: `${firstName} ${lastName}`.trim(),
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'id' });

                if (profileError) {
                    console.error("Profile creation error (non-fatal):", profileError);
                    // We don't throw here because the user account IS created.
                }
            }

            setUserEmail(email);
            setIsVerificationSent(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
                },
            });
            if (error) throw error;
        } catch (e: any) {
            setError(e.message);
            setIsLoading(false);
        }
    };

    const handleGithubSignUp = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
                },
            });
            if (error) throw error;
        } catch (e: any) {
            setError(e.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] dark bg-black text-white">
            {/* Left column: sign-up form */}
            <section className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col items-center gap-2">
                            <Image
                                src="/finlogo.svg"
                                alt="AppFlux Logo"
                                width={40}
                                height={40}
                                className="w-10 h-10"
                                priority
                            />
                            <h1 className="animate-element animate-delay-100 text-3xl md:text-4xl font-semibold leading-tight text-center">
                                {isVerificationSent ? 'Check your email' : title}
                            </h1>
                            <p className="animate-element animate-delay-200 text-muted-foreground text-center max-w-sm">
                                {isVerificationSent
                                    ? `We've sent a verification link to ${userEmail}. Please check your inbox and verify your account.`
                                    : description}
                            </p>
                            {!isVerificationSent && (
                                <p className="text-[10px] text-zinc-500 animate-element animate-delay-200 text-center max-w-xs mt-2 bg-zinc-900/50 p-2 rounded border border-zinc-800">
                                    Note: If you want to deploy apps, you must have a GitHub account.
                                </p>
                            )}
                        </div>

                        {isVerificationSent ? (
                            <div className="animate-element animate-delay-300 flex flex-col items-center justify-center w-full mt-6 gap-4">
                                <Link
                                    href="/sign-in"
                                    className="w-full rounded-2xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors text-center text-sm"
                                >
                                    Back to Sign In
                                </Link>
                                <button
                                    onClick={() => setIsVerificationSent(false)}
                                    className="text-xs text-muted-foreground hover:text-white transition-colors"
                                >
                                    Use a different email
                                </button>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}
                                <form className="space-y-3" onSubmit={handleSignUp}>

                                    {/* Name Fields */}
                                    <div className="grid grid-cols-2 gap-4 animate-element animate-delay-400">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">First name</label>
                                            <GlassInputWrapper>
                                                <input name="firstName" type="text" className="w-full bg-transparent text-sm p-3 rounded-2xl focus:outline-none" />
                                            </GlassInputWrapper>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Last name</label>
                                            <GlassInputWrapper>
                                                <input name="lastName" type="text" className="w-full bg-transparent text-sm p-3 rounded-2xl focus:outline-none" />
                                            </GlassInputWrapper>
                                        </div>
                                    </div>

                                    {/* Username Field */}
                                    <div className="animate-element animate-delay-500">
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Username</label>
                                        <GlassInputWrapper>
                                            <input name="username" type="text" className="w-full bg-transparent text-sm p-3 rounded-2xl focus:outline-none" />
                                        </GlassInputWrapper>
                                    </div>

                                    {/* Email Field */}
                                    <div className="animate-element animate-delay-500">
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Email address</label>
                                        <GlassInputWrapper>
                                            <input name="email" type="email" className="w-full bg-transparent text-sm p-3 rounded-2xl focus:outline-none" />
                                        </GlassInputWrapper>
                                    </div>

                                    {/* Password Field */}
                                    <div className="animate-element animate-delay-600">
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
                                        <GlassInputWrapper>
                                            <div className="relative">
                                                <input name="password" type={showPassword ? 'text' : 'password'} className="w-full bg-transparent text-sm p-3 pr-10 rounded-2xl focus:outline-none" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                                                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />}
                                                </button>
                                            </div>
                                        </GlassInputWrapper>
                                    </div>

                                    <div className="animate-element animate-delay-700 flex items-center gap-2 text-xs mt-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="terms" className="custom-checkbox w-4 h-4 rounded-full" />
                                            <span className="text-muted-foreground">I agree to the <span className="text-foreground font-medium">Terms</span> and <span className="text-foreground font-medium">Privacy Policy</span></span>
                                        </label>
                                    </div>

                                    <button type="submit" disabled={isLoading} className="animate-element animate-delay-800 w-full rounded-2xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-black">
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create account'}
                                    </button>
                                </form>

                                <div className="animate-element animate-delay-700 relative flex items-center justify-center -my-2">
                                    <span className="w-full border-t border-border"></span>
                                    <span className="px-4 text-xs text-muted-foreground bg-black absolute">Or</span>
                                </div>

                                <div className="flex flex-row gap-3">
                                    <button onClick={handleGoogleSignUp} disabled={isLoading} className="flex-1 animate-element animate-delay-800 flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 hover:bg-secondary transition-colors disabled:opacity-50">
                                        <GoogleIcon />
                                    </button>
                                    <button onClick={handleGithubSignUp} disabled={isLoading} className="flex-1 animate-element animate-delay-800 flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 hover:bg-secondary transition-colors disabled:opacity-50">
                                        <GithubIcon />
                                    </button>
                                </div>

                                <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground mt-2">
                                    Already have an account? <Link href="/sign-in" className="text-violet-400 hover:underline transition-colors">Sign In</Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Right column: hero image */}
            {heroImageSrc && (
                <section className="hidden md:block flex-1 relative p-4">
                    <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl overflow-hidden">
                        <Image
                            src={isVerificationSent ? "/verificationsvg.svg" : heroImageSrc}
                            alt="Sign Up Hero"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                </section>
            )}
        </div>
    );
};
