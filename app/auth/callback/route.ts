import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            let baseUrl = origin
            if (!isLocalEnv && forwardedHost) {
                baseUrl = `https://${forwardedHost}`
            }

            return NextResponse.redirect(`${baseUrl}${next}`)
        }

        console.error('Auth callback exchange error:', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_failed&error_description=${encodeURIComponent(error.message)}`)
    }

    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (errorParam) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${errorParam}&error_description=${encodeURIComponent(errorDescription || '')}`)
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=missing_code`)
}
