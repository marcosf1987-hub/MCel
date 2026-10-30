import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getCategoriesNavData } from "@/lib/categories-cache";
import type { CategoriesNavData } from "@/lib/categories-types";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let categories: CategoriesNavData = { categories: [], totalProducts: 0 };
  try {
    categories = await getCategoriesNavData();
  } catch (e) {
    console.error("Site categories:", e);
  }

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </main>
      <Footer />
      <InstallPrompt />
    </>
  );
}
