import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    try {
        const supabase = await createClient();

        // Use RPC to safely increment or just select and update if RPC isn't available
        // But for simplicity if we don't have RPC set up:
        const { data: current, error: fetchError } = await supabase
            .from("apps")
            .select("views")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
            .from("apps")
            .update({ views: (current?.views || 0) + 1 })
            .eq("id", id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("View update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
