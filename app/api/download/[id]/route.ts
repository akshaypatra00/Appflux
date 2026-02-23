import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "No ID provided" }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Fetch App Metadata
        const { data: app, error } = await supabase
            .from('apps')
            .select('github_download_url, download_count')
            .eq('id', id)
            .single();

        if (error || !app) {
            return NextResponse.json({ error: 'App not found' }, { status: 404 });
        }

        // 2. Increment Download Count
        // We do this asynchronously without waiting (fire and forget for speed)? 
        // Or await it to ensure accuracy. Await is safer.
        await supabase
            .from('apps')
            .update({ download_count: (app.download_count || 0) + 1 })
            .eq('id', id);

        // 3. Return the Redirect
        // This allows the user's browser to download directly from GitHub.
        // The user WILL see the URL in their browser's download manager.
        // If we MUST hide it completely, we would need to proxy the stream:
        /*
           const response = await fetch(app.github_download_url);
           return new Response(response.body, { ...headers... });
           // BUT: This consumes server bandwidth and execution time.
           // Given "Zero Budget", direct redirect is the only scalable way.
        */

        return NextResponse.redirect(app.github_download_url);

    } catch (error: any) {
        console.error('Download Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
