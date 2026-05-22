"use client";

import { Button } from "@/components/ui/button";

export function OfflineRetry() {
  return (
    <Button
      type="button"
      variant="outline"
      className="mt-4"
      onClick={() => window.location.reload()}
    >
      Reintentar
    </Button>
  );
}
