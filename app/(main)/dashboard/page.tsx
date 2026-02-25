import DashboardContent from "@/components/dashboard-with-collapsible-sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
import { startOfDay, subDays, isSameDay, format } from "date-fns";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    // Fetch user's apps
    const { data: apps, error: appsError } = await supabase
        .from("apps")
        .select('*')
        .eq('user_id', user.id);

    if (appsError) {
        console.error("Error fetching apps:", appsError);
    }

    const totalApps = apps?.length || 0;
    const totalViews = apps?.reduce((sum, app) => sum + (app.views || 0), 0) || 0;
    const totalDownloads = apps?.reduce((sum, app) => sum + (app.download_count || 0), 0) || 0;

    // Calculate Streak
    // Get unique dates of activity (normalized to start of day)
    const uniqueDates = Array.from(new Set(apps?.map(app => startOfDay(new Date(app.created_at)).toISOString()) || [])).map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime()); // Descending

    let streak = 0;
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    // Check if streak is active (activity today or yesterday)
    const hasActivityToday = uniqueDates.some(d => isSameDay(d, today));
    const hasActivityYesterday = uniqueDates.some(d => isSameDay(d, yesterday));

    if (hasActivityToday || hasActivityYesterday) {
        streak = hasActivityToday ? 1 : 0;
        let currentDate = hasActivityToday ? today : yesterday;
        let count = 0;

        // Count backwards
        while (true) {
            const hasActivity = uniqueDates.some(d => isSameDay(d, currentDate));
            if (hasActivity) {
                count++;
                currentDate = subDays(currentDate, 1);
            } else {
                break;
            }
        }
        streak = count;
    }

    // Calculate Last 3 Days Activity
    const dailyActivity = [1, 0, -1].map(daysAgo => {
        const date = subDays(new Date(), daysAgo);
        const count = apps?.filter(app => isSameDay(new Date(app.created_at), date)).length || 0;
        return {
            label: format(date, 'EEE'), // Sat, Sun, Mon
            value: Math.min(count * 25, 100), // Scale for visualization
            displayValue: count,
            highlight: daysAgo === 0 // Highlight today
        };
    });

    // Fetch recent activity (limit 5)
    // Since we don't have a separate activity log, we'll use app uploads as activity
    const { data: recentActivity } = await supabase
        .from("apps")
        .select('*')
        .eq('user_id', user.id)
        .order("created_at", { ascending: false })
        .limit(5);

    // Fetch Deployments
    const { data: deployments } = await supabase
        .from("deployments")
        .select('*, apps(name)')
        .eq('user_id', user.id)
        .order("created_at", { ascending: false })
        .limit(5);

    // Top Apps by download
    const topApps = apps ? [...apps].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5) : [];

    return (
        <DashboardContent
            user={user}
            stats={{
                totalApps,
                totalViews,
                totalDownloads,
                streak
            }}
            dailyActivity={dailyActivity}
            recentActivity={recentActivity || []}
            deployments={deployments || []}
            topApps={topApps}
        />
    );
}
