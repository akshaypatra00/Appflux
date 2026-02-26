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
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', uid)
            .eq('is_read', false)

        if (error) throw error

        return NextResponse.json({ count: count || 0 })
    } catch (err: any) {
        console.error("Unread notifications API error:", err)
        return NextResponse.json({ count: 0, error: err.message }, { status: 500 })
    }
}
