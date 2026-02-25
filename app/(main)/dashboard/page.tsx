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
    const supabase = createClient();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/sign-in");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            // Fetch user's apps
            const { data: apps, error: appsError } = await supabase
                .from("apps")
                .select('*')
                .eq('user_id', user.uid);

            const totalApps = apps?.length || 0;
            const totalViews = apps?.reduce((sum, app) => sum + (app.views || 0), 0) || 0;
            const totalDownloads = apps?.reduce((sum, app) => sum + (app.download_count || 0), 0) || 0;

            const uniqueDates = Array.from(new Set(apps?.map(app => startOfDay(new Date(app.created_at)).toISOString()) || [])).map(d => new Date(d));
            uniqueDates.sort((a, b) => b.getTime() - a.getTime());

            let streak = 0;
            const today = startOfDay(new Date());
            const yesterday = subDays(today, 1);
            if (uniqueDates.some(d => isSameDay(d, today)) || uniqueDates.some(d => isSameDay(d, yesterday))) {
                let count = 0;
                let currentDate = isSameDay(uniqueDates[0], today) ? today : yesterday;
                while (uniqueDates.some(d => isSameDay(d, currentDate))) {
                    count++;
                    currentDate = subDays(currentDate, 1);
                }
                streak = count;
            }

            const dailyActivity = [1, 0, -1].map(daysAgo => {
                const date = subDays(new Date(), daysAgo);
                const count = apps?.filter(app => isSameDay(new Date(app.created_at), date)).length || 0;
                return {
                    label: format(date, 'EEE'),
                    value: Math.min(count * 25, 100),
                    displayValue: count,
                    highlight: daysAgo === 0
                };
            });

            const { data: recentActivity } = await supabase
                .from("apps")
                .select('*')
                .eq('user_id', user.uid)
                .order("created_at", { ascending: false })
                .limit(5);

            const { data: deployments } = await supabase
                .from("deployments")
                .select('*, apps(name)')
                .eq('user_id', user.uid)
                .order("created_at", { ascending: false })
                .limit(5);

            const topApps = apps ? [...apps].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5) : [];

            setData({
                totalApps,
                totalViews,
                totalDownloads,
                streak,
                dailyActivity,
                recentActivity: recentActivity || [],
                deployments: deployments || [],
                topApps
            });
        };
        fetchData();
    }, [user, supabase]);

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
