import { TuringLanding } from "@/components/ui/hero-landing-page";
import { ContainerScroll } from "@/components/container-scroll-animation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <TuringLanding user={user} />
    </>
  );
}
