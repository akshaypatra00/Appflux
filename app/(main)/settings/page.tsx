'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Bell, Shield, Eye, Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner' // Assuming sonner is available or use standard alert

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const supabase = createClient()

    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        updates: true,
        marketing: false
    })

    const [privacy, setPrivacy] = useState({
        publicProfile: true,
        showEmail: false,
        activityStatus: true
    })

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
        // Here you would fetch actual user settings from Supabase
    }, [])

    const handleNotificationChange = (key: keyof typeof notifications) => {
        setNotifications(prev => {
            const newState = { ...prev, [key]: !prev[key] }
            // Simulating save
            // toast.success("Settings saved") 
            return newState
        })
    }

    const handlePrivacyChange = (key: keyof typeof privacy) => {
        setPrivacy(prev => ({ ...prev, [key]: !prev[key] }))
    }

    if (!mounted) return null

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
            <div className="container mx-auto px-4 pt-8 pb-12 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">Settings</h1>

                <div className="grid gap-8">
                    {/* Notifications Settings */}
                    <Card className="bg-card border-border text-card-foreground">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-violet-500" />
                                <CardTitle>Notifications</CardTitle>
                            </div>
                            <CardDescription className="text-muted-foreground">
                                Manage how you receive updates and alerts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-foreground">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive emails about your account activity</p>
                                </div>
                                <Switch
                                    checked={notifications.email}
                                    onCheckedChange={() => handleNotificationChange('email')}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-foreground">Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                                </div>
                                <Switch
                                    checked={notifications.push}
                                    onCheckedChange={() => handleNotificationChange('push')}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-foreground">Product Updates</Label>
                                    <p className="text-sm text-muted-foreground">Get notified about new features and improvements</p>
                                </div>
                                <Switch
                                    checked={notifications.updates}
                                    onCheckedChange={() => handleNotificationChange('updates')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Privacy & Security */}
                    <Card className="bg-card border-border text-card-foreground">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-500" />
                                <CardTitle>Privacy & Security</CardTitle>
                            </div>
                            <CardDescription className="text-muted-foreground">
                                Control your privacy and account security
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-foreground">Public Profile</Label>
                                    <p className="text-sm text-muted-foreground">Allow others to see your profile</p>
                                </div>
                                <Switch
                                    checked={privacy.publicProfile}
                                    onCheckedChange={() => handlePrivacyChange('publicProfile')}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-foreground">Show Email Address</Label>
                                    <p className="text-sm text-muted-foreground">Display your email on your public profile</p>
                                </div>
                                <Switch
                                    checked={privacy.showEmail}
                                    onCheckedChange={() => handlePrivacyChange('showEmail')}
                                />
                            </div>

                            <div className="pt-6 mt-6 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base text-foreground">Two-Factor Authentication</Label>
                                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                                    </div>
                                    <Button variant="outline" className="border-border hover:bg-muted hover:text-foreground">
                                        Setup 2FA
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base text-destructive">Delete Account</Label>
                                        <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                                    </div>
                                    <Button variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20">
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appearance */}
                    <Card className="bg-card border-border text-card-foreground">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-500" />
                                <CardTitle>Appearance</CardTitle>
                            </div>
                            <CardDescription className="text-muted-foreground">
                                Customize how AppFlux looks for you
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-base text-foreground">Theme Preference</Label>
                                    <p className="text-sm text-muted-foreground">Choose between light and dark mode</p>
                                </div>
                                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setTheme('light')}
                                        className={`rounded-md ${theme === 'light' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        <Sun className="w-4 h-4 mr-2" />
                                        Light
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setTheme('dark')}
                                        className={`rounded-md ${theme === 'dark' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        <Moon className="w-4 h-4 mr-2" />
                                        Dark
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setTheme('system')}
                                        className={`rounded-md ${theme === 'system' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        <Monitor className="w-4 h-4 mr-2" />
                                        System
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-border">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-foreground">Language</Label>
                                    <p className="text-sm text-muted-foreground">Select your preferred language</p>
                                </div>
                                <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                                    English (US)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
