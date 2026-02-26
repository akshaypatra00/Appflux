"use client";

import DashboardContent from "@/components/dashboard-with-collapsible-sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { startOfDay, subDays, isSameDay, format } from "date-fns";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/sign-in");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // 1. Fetch user's apps from Supabase
                const { data: appsData, error: appsError } = await supabase
                    .from("apps")
                    .select("*")
                    .eq("user_id", user.uid);

                if (appsError) throw appsError;
                const apps = appsData || [];

                const totalApps = apps.length;
                const totalViews = apps.reduce((sum: number, app: any) => sum + (app.views || 0), 0);
                const totalDownloads = apps.reduce((sum: number, app: any) => sum + (app.download_count || 0), 0);

                const uniqueDates = Array.from(new Set(apps.map((app: any) => {
                    const date = new Date(app.created_at);
                    return startOfDay(date).toISOString();
                }))).map(d => new Date(d as string));
                uniqueDates.sort((a, b) => b.getTime() - a.getTime());

                let streak = 0;
                const today = startOfDay(new Date());
                const yesterday = subDays(today, 1);
                if (uniqueDates.length > 0 && (isSameDay(uniqueDates[0], today) || isSameDay(uniqueDates[0], yesterday))) {
                    let count = 0;
                    let currentDate = isSameDay(uniqueDates[0], today) ? today : yesterday;
                    while (uniqueDates.some(d => isSameDay(d, currentDate))) {
                        count++;
                        currentDate = subDays(currentDate, 1);
                    }
                    streak = count;
                }

                const dailyActivity = [6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
                    const date = subDays(new Date(), daysAgo);
                    const count = apps.filter((app: any) => {
                        const appDate = new Date(app.created_at);
                        return isSameDay(appDate, date);
                    }).length;
                    return {
                        label: format(date, 'EEE'),
                        value: Math.min(count * 25, 100),
                        displayValue: count,
                        highlight: daysAgo === 0
                    };
                });

                // 2. Fetch recent activity (recent apps)
                const { data: recentData } = await supabase
                    .from("apps")
                    .select("*")
                    .eq("user_id", user.uid)
                    .order("created_at", { ascending: false })
                    .limit(5);

                const recentActivity = recentData || [];

                // 3. Fetch deployments
                const { data: deploymentsData } = await supabase
                    .from("deployments")
                    .select("*, apps(id, name, icon_url)")
                    .eq("user_id", user.uid)
                    .order("created_at", { ascending: false })
                    .limit(5);

                const deployments = deploymentsData || [];

                // 4. Fetch user profile
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.uid)
                    .single();

                const topApps = [...apps].sort((a: any, b: any) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5);

                setData({
                    totalApps,
                    totalViews,
                    totalDownloads,
                    streak,
                    dailyActivity,
                    recentActivity,
                    deployments,
                    topApps,
                    profile
                });
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setData({
                    totalApps: 0,
                    totalViews: 0,
                    totalDownloads: 0,
                    streak: 0,
                    dailyActivity: [],
                    recentActivity: [],
                    deployments: [],
                    topApps: []
                });
            }
        };
        fetchData();
    }, [user]);

    if (loading || !user || !data) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
            </div>
        );
    }

    return (
        <DashboardContent
            user={user}
            profile={data.profile}
            stats={{
                totalApps: data.totalApps,
                totalViews: data.totalViews,
                totalDownloads: data.totalDownloads,
                streak: data.streak
            }}
            dailyActivity={data.dailyActivity}
            recentActivity={data.recentActivity}
            deployments={data.deployments}
            topApps={data.topApps}
        />
    );
}
