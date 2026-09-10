"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type GaEventName } from "@/lib/analytics";

/** Dispara un evento GA una sola vez al montar (fichas / vistas). */
export function TrackOnce({
  event,
  params,
}: {
  event: GaEventName;
  params?: Record<string, string | number | boolean | undefined>;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackEvent(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount
  }, [event]);

  return null;
}
