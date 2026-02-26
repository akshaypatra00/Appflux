import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (!uid) {
        return NextResponse.json({ error: "Missing UID" }, { status: 400 })
    }

    try {
        const supabase = await createClient()

        // Use a simpler count query that is less likely to fail
        const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', uid)
            .eq('is_read', false)

        if (error) {
            console.error("Supabase unread count error:", error);
            // Return 0 if the table doesn't exist yet or other non-critical error
            return NextResponse.json({ count: 0 })
        }

        return NextResponse.json({ count: count || 0 })
    } catch (err: any) {
        console.error("Unread notifications API error:", err)
        // Always return a valid JSON even on error to prevent 500s in UI
        return NextResponse.json({ count: 0, error: "Internal Server Error" }, { status: 200 })
    }
}
