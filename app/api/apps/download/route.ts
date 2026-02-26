
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    try {
        const supabase = await createClient();

        const { data: current, error: fetchError } = await supabase
            .from("apps")
            .select("download_count")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
            .from("apps")
            .update({ download_count: (current?.download_count || 0) + 1 })
            .eq("id", id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Download update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
