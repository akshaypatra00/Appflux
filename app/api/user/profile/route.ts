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
            .select('*')
            .eq('id', uid)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return NextResponse.json(profile || null)
    } catch (err: any) {
        console.error("Profile proxy error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 })
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('profiles')
            .upsert({ id, ...updates, updated_at: new Date().toISOString() })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (err: any) {
        console.error("Profile update error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
