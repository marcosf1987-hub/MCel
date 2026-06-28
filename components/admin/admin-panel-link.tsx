import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminPanelLinkProps = {
  className?: string;
  variant?: "default" | "accent" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
};

export function AdminPanelLink({
  className,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: AdminPanelLinkProps) {
  return (
    <Button asChild variant={variant} size={size} className={cn("gap-2", className)}>
      <Link href="/admin" aria-label="Panel de administración">
        <Shield className="h-4 w-4 shrink-0" />
        {showLabel && <span>Panel admin</span>}
      </Link>
    </Button>
  );
}
