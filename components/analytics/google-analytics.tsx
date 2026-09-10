"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GA_MEASUREMENT_ID, trackEvent } from "@/lib/analytics";

/** Dispara page_view en navegación client-side (App Router). */
function GoogleAnalyticsPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const qs = searchParams?.toString();
    const pagePath = qs ? `${pathname}?${qs}` : pathname;
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: pagePath,
    });
  }, [pathname, searchParams]);

  return null;
}

/** Lee ?ga=login|sign_up tras auth y limpia la URL. */
function AuthGaBridge() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const ga = searchParams.get("ga");
    if (ga !== "login" && ga !== "sign_up") return;

    const methodParam = searchParams.get("ga_method");
    const stored =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("ga_auth_method")
        : null;
    const method = stored || methodParam || "email";
    if (stored) sessionStorage.removeItem("ga_auth_method");

    if (ga === "login") trackEvent("login", { method });
    if (ga === "sign_up") trackEvent("sign_up", { method });

    const next = new URLSearchParams(searchParams.toString());
    next.delete("ga");
    next.delete("ga_method");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams, router]);

  return null;
}

export function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageviews />
        <AuthGaBridge />
      </Suspense>
    </>
  );
}
