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
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('avatar_url, full_name, username')
            .eq('id', uid)
            .single()

        if (error) throw error

        return NextResponse.json(profile)
    } catch (err: any) {
        console.error("Profile proxy error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
