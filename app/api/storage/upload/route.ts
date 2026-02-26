import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const path = formData.get('path') as string
        const bucket = (formData.get('bucket') as string) || 'app-assets'

        if (!file || !path) {
            return NextResponse.json({ error: "Missing file or path" }, { status: 400 })
        }

        const supabase = await createClient()

        // Convert File to Buffer for Supabase upload
        const buffer = Buffer.from(await file.arrayBuffer())

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path)

        return NextResponse.json({ url: publicUrl })

    } catch (err: any) {
        console.error("Storage upload error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
