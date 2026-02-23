
import { StoreGrid } from "@/components/store/StoreGrid"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function StorePage() {
    // 1. Fetch apps from Supabase
    const supabase = await createClient();
    const { data: apps, error } = await supabase
        .from('apps')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching apps:", error);
    }

    return (
        <main className="p-8 min-h-screen max-w-7xl mx-auto">
            <StoreGrid initialApps={apps || []} />
        </main>
    )
}
