"use client";

import { TuringLanding } from "@/components/ui/hero-landing-page";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <TuringLanding user={user} />
    </>
  );
}
