"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";

type WizardFooterProps = {
  showBack?: boolean;
  onBack?: () => void;
  onPrimary: () => void;
  primaryLabel: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

export function WizardFooter({
  showBack,
  onBack,
  onPrimary,
  primaryLabel,
  loading = false,
  loadingLabel = "Enviando…",
  disabled = false,
  children,
}: WizardFooterProps) {
  return (
    <div className="sticky bottom-4 z-10 space-y-3 rounded-2xl border border-[var(--color-brand-light)] bg-white p-4 shadow-lg">
      <div className="space-y-2">
        {showBack && onBack && (
          <Button
            type="button"
            variant="ghost"
            disabled={loading || disabled}
            onClick={onBack}
            className="w-full gap-1 text-[var(--color-muted-foreground)]"
          >
            <ChevronLeft className="h-4 w-4" />
            Atrás
          </Button>
        )}
        <Button
          type="button"
          variant="default"
          size="lg"
          disabled={loading || disabled}
          className="w-full text-base"
          onClick={onPrimary}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {loadingLabel}
            </>
          ) : (
            primaryLabel
          )}
        </Button>
      </div>
      {children}
    </div>
  );
}
