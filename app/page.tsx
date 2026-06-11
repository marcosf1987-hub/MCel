import { createClient } from "@/lib/supabase/server";
import { getHomePageData } from "@/lib/home-server";
import { GuestHome } from "@/components/home/guest-home";
import { AuthedHome } from "@/components/home/authed-home";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const homeData = await getHomePageData(supabase);

  return user ? <AuthedHome data={homeData} /> : <GuestHome data={homeData} />;
}
