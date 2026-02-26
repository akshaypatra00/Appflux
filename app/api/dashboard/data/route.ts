import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { startOfDay, subDays, isSameDay, format } from "date-fns"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (!uid) {
        return NextResponse.json({ error: "Missing UID" }, { status: 400 })
    }

    try {
        const supabase = await createClient()

        // 1. Fetch user's apps
        const { data: appsData, error: appsError } = await supabase
            .from("apps")
            .select("*")
            .eq("user_id", uid)

        if (appsError) throw appsError
        const apps = appsData || []

        // 2. Fetch recent deployments
        const { data: deploymentsData } = await supabase
            .from("deployments")
            .select("*, apps(id, name, icon_url)")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(5)

        const deployments = deploymentsData || []

        // 3. Fetch user profile
        let profile = null;
        try {
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", uid)
                .single()
            if (!profileError) profile = profileData;
        } catch (e) {
            console.error("Profile fetch error in dashboard:", e);
        }

        // Calculate stats
        const totalApps = apps.length
        const totalViews = apps.reduce((sum: number, app: any) => sum + (app.views || 0), 0)
        const totalDownloads = apps.reduce((sum: number, app: any) => sum + (app.download_count || 0), 0)

        // Calculate Streak
        const uniqueDates = Array.from(new Set(apps.map((app: any) => {
            const date = new Date(app.created_at)
            return startOfDay(date).toISOString()
        }))).map(d => new Date(d as string))
        uniqueDates.sort((a, b) => b.getTime() - a.getTime())

        let streak = 0
        const today = startOfDay(new Date())
        const yesterday = subDays(today, 1)
        if (uniqueDates.length > 0 && (isSameDay(uniqueDates[0], today) || isSameDay(uniqueDates[0], yesterday))) {
            let count = 0
            let currentDate = isSameDay(uniqueDates[0], today) ? today : yesterday
            while (uniqueDates.some(d => isSameDay(d, currentDate))) {
                count++
                currentDate = subDays(currentDate, 1)
            }
            streak = count
        }

        // Daily Activity
        const dailyActivity = [6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
            const date = subDays(new Date(), daysAgo)
            const count = apps.filter((app: any) => {
                const appDate = new Date(app.created_at)
                return isSameDay(appDate, date)
            }).length
            return {
                label: format(date, 'EEE'),
                value: Math.min(count * 25, 100),
                displayValue: count,
                highlight: daysAgo === 0
            }
        })

        const topApps = [...apps].sort((a: any, b: any) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5)
        const recentActivity = apps.slice(0, 5) // Simple recent activity

        return NextResponse.json({
            stats: {
                totalApps,
                totalViews,
                totalDownloads,
                streak
            },
            dailyActivity,
            recentActivity,
            deployments,
            topApps,
            profile
        })

    } catch (err: any) {
        console.error("Dashboard data API error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
