import { createClient } from "@/lib/supabase/server"
import { StoreGrid } from "@/components/store/StoreGrid"

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function StorePage() {
    const supabase = await createClient();
    let apps: any[] = [];
    let error = null;

    try {
        const { data, error: fetchError } = await supabase
            .from('apps')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        apps = data || [];
    } catch (err: any) {
        console.error("Supabase fetch error:", err);
        error = { message: "Failed to fetch apps from Supabase. Ensure your table 'apps' exists." };
    }

    const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'placeholder';

    return (
        <main className="p-8 min-h-screen max-w-7xl mx-auto">
            {!isConfigured && (
                <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-sm">
                    <strong>Configuration Warning:</strong> Supabase environment variables are missing or incorrect in your deployment. Please add them to Vercel and redeploy.
                </div>
            )}
            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    <strong>Database Error:</strong> {error.message}
                </div>
            )}
            <StoreGrid initialApps={apps || []} />
        </main>
    )
}
