
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const supabase = await createClient()

    // Using RPC is better for atomic increment, but direct update works for MVP if concurrency isn't massive
    // Or we can fetch current -> increment -> update (race condition prone but simple)

    // Better: create an RPC function in SQL if possible, otherwise read-update-write
    // Let's try read-update-write for now as we might not have RPC named 'increment_view_count'

    // Ideally:
    // const { error } = await supabase.rpc('increment_view_count', { row_id: id })

    const { data: app, error: fetchError } = await supabase
        .from('apps')
        .select('views')
        .eq('id', id)
        .single()

    if (fetchError || !app) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    const newViews = (app.views || 0) + 1;

    const { error: updateError } = await supabase
        .from('apps')
        .update({ views: newViews })
        .eq('id', id)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, views: newViews })
}
