"use client";

import { PricingSection } from '@/components/ui/pricing-section';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/auth-provider';

export default function PricingPage() {
    const { user } = useAuth();

    return (
        <div className="h-screen w-full bg-black overflow-hidden flex flex-col">
            <Navbar user={user as any} />
            <div className="flex-1 flex items-center justify-center">
                <PricingSection />
            </div>
        </div>
    );
}
