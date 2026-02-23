import { PricingSection } from '@/components/ui/pricing-section';
import { Navbar } from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';

export default async function PricingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="h-screen w-full bg-black overflow-hidden flex flex-col">
            <Navbar user={user} />
            <div className="flex-1 flex items-center justify-center">
                <PricingSection />
            </div>
        </div>
    );
}
