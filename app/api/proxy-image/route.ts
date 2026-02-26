import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
        return new Response("Missing URL", { status: 400 })
    }

    try {
        // Log for debugging (Vercel logs)
        console.log(`Proxying image: ${url}`);

        // Fetch the image from the external source (Supabase)
        const response = await fetch(url, {
            headers: {
                'Accept': 'image/*',
            },
            // Avoid caching errors locally while testing
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`Failed to fetch image from ${url}: Status ${response.status}`);
            return new Response(`Error fetching image: ${response.statusText}`, { status: response.status });
        }

        const blob = await response.blob()
        const contentType = response.headers.get('content-type') || 'image/png'

        // Return the image data
        return new NextResponse(blob, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
            }
        })

    } catch (err: any) {
        console.error("Image proxy error:", err)
        return new Response("Internal Server Error", { status: 500 })
    }
}
