'use client';

import { useState, useEffect, useRef } from 'react';
import { getUserAvatar } from '@/lib/avatar';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, User as UserIcon, Mail, Trash2, Github, Globe, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ProfileData {
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
}

import { useAuth } from '@/components/auth-provider';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<ProfileData>({
        username: '',
        first_name: '',
        last_name: '',
        full_name: '',
        email: '',
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const fetchProfile = async () => {
        if (!user) return;

        setAvatarUrl(user.photoURL || getUserAvatar(user));

        try {
            // Fetch Profile from our Proxy
            const res = await fetch(`/api/user/profile?uid=${user.uid}`);
            if (res.ok) {
                const profileData = await res.json();
                if (profileData) {
                    setProfile({
                        username: profileData.username || '',
                        first_name: profileData.first_name || '',
                        last_name: profileData.last_name || '',
                        full_name: profileData.full_name || '',
                        email: profileData.email || user.email || '',
                    });
                    if (profileData.avatar_url) {
                        setAvatarUrl(profileData.avatar_url);
                    }
                } else {
                    setProfile({
                        username: '',
                        first_name: '',
                        last_name: '',
                        full_name: user.displayName || '',
                        email: user.email || '',
                    })
                }
            }
        } catch (err) {
            console.error("Profile fetch error:", err);
            // Fallback to basic Firebase data
            setProfile({
                username: '',
                first_name: '',
                last_name: '',
                full_name: user.displayName || '',
                email: user.email || '',
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/sign-in');
            } else {
                fetchProfile();
            }
        }
    }, [user, authLoading, router]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !user) return;

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `profiles/${user.uid}/${Date.now()}.${fileExt}`;

        setUploading(true);
        setMessage(null);

        try {
            // Upload to Supabase Storage via Proxy
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', fileName);
            formData.append('bucket', 'app-assets');

            const uploadRes = await fetch('/api/storage/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const errorData = await uploadRes.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const { url: publicUrl } = await uploadRes.json();

            // Update Firebase Profile
            const { updateProfile } = await import('firebase/auth');
            await updateProfile(user, {
                photoURL: publicUrl
            });

            // Update Profiles Collection via Proxy
            const updateRes = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.uid,
                    avatar_url: publicUrl
                })
            });

            if (!updateRes.ok) {
                const errorData = await updateRes.json();
                throw new Error(errorData.error || "Failed to update profile record");
            }

            setAvatarUrl(publicUrl);
            setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        } catch (error: any) {
            console.error("Upload error:", error);
            setMessage({ type: 'error', text: error.message || 'Error updating profile picture' });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setMessage(null);

        try {
            const updates = {
                id: user.uid,
                username: profile.username,
                first_name: profile.first_name,
                last_name: profile.last_name,
                full_name: `${profile.first_name} ${profile.last_name}`.trim(),
                email: user.email || '',
            };

            const updateRes = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!updateRes.ok) {
                const errorData = await updateRes.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            // Optional: Update Firebase displayName
            const { updateProfile } = await import('firebase/auth');
            await updateProfile(user, {
                displayName: updates.full_name
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            console.error("Update profile error:", error);
            setMessage({ type: 'error', text: error.message || 'Error updating profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await firebaseSignOut(auth);
            router.push('/sign-in');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error signing out' });
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">


            <div className="container mx-auto px-4 pt-8 pb-12 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8 text-foreground">Profile Settings</h1>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg bg-card border ${message.type === 'success' ? 'text-green-500 border-green-500/20' : 'text-red-500 border-red-500/20'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid gap-8 md:grid-cols-3">
                    {/* Sidebar / Info Card */}
                    <Card className="bg-card border-border text-card-foreground md:col-span-1 h-fit shadow-sm">
                        <CardHeader>
                            <CardTitle>Your Profile</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Manage your personal information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center text-center space-y-4">
                            <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-muted shadow-xl">
                                {avatarUrl ? (
                                    <Image
                                        src={avatarUrl}
                                        alt="Avatar"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                                        {profile.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}

                                <div
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-8 w-8 text-white" />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg text-foreground">
                                    {profile.full_name || profile.username || 'User'}
                                </h3>
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                            />

                            <Button
                                variant="outline"
                                className="w-full border-input hover:bg-accent hover:text-accent-foreground"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                                    </>
                                ) : (
                                    'Change Picture'
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full mt-2 border-input text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-colors"
                                onClick={handleSignOut}
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Details Form */}
                    <Card className="bg-card border-border text-card-foreground md:col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Update your profile information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name" className="text-foreground">First Name</Label>
                                        <Input
                                            id="first_name"
                                            value={profile.first_name}
                                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                            className="bg-background border-input text-foreground focus-visible:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name" className="text-foreground">Last Name</Label>
                                        <Input
                                            id="last_name"
                                            value={profile.last_name}
                                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                            className="bg-background border-input text-foreground focus-visible:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-foreground">Username</Label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="username"
                                            value={profile.username}
                                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                            className="pl-10 bg-background border-input text-foreground focus-visible:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-foreground">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            value={profile.email}
                                            readOnly
                                            disabled
                                            className="pl-10 bg-muted border-input text-muted-foreground cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                                </Button>
                            </form>

                            <div className="pt-6 border-t border-border space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">Connected Accounts</h4>
                                <div className="space-y-3">
                                    {user?.providerData?.map((provider: any) => {
                                        return (
                                            <div key={provider.uid} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-muted p-2 rounded-md capitalize font-medium text-sm text-foreground">
                                                        {provider.providerId === 'github.com' ? <Github className="w-5 h-5" /> :
                                                            provider.providerId === 'google.com' ? <span className="font-bold text-lg">G</span> :
                                                                <Globe className="w-5 h-5" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium uppercase text-card-foreground">
                                                            {provider.providerId.split('.')[0]}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {provider.email || provider.uid.slice(0, 8)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-muted-foreground italic px-2">
                                                    Connected
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
