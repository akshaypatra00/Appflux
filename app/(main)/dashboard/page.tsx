"use client";

import DashboardContent from "@/components/dashboard-with-collapsible-sidebar";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { startOfDay, subDays, isSameDay, format } from "date-fns";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    useEffect(() => {
        if (!loading && !user) {
            router.push("/sign-in");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const res = await fetch(`/api/dashboard/data?uid=${user.uid}`);
                if (!res.ok) throw new Error("Failed to fetch dashboard data");

                const dashboardData = await res.json();
                setData(dashboardData);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setData({
                    stats: { totalApps: 0, totalViews: 0, totalDownloads: 0, streak: 0 },
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
