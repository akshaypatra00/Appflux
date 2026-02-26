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
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) throw error
        return NextResponse.json(data || [])
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, uid, all } = body

        const supabase = await createClient()

        if (all) {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', uid)
                .eq('is_read', false)
            if (error) throw error
        } else {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id)
            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        const supabase = await createClient()
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
