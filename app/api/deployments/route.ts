import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { app_id, user_id, status } = body

        if (!app_id || !user_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from("deployments")
            .insert({
                app_id,
                user_id,
                status: status || 'success',
                deployed_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)

    } catch (err: any) {
        console.error("Deployment creation API error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
