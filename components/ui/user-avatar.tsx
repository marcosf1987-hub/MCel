import Image from "next/image";
import { cn } from "@/lib/utils";
import { getAvatarColor, getAvatarInitials } from "@/lib/avatar";

export function UserAvatar({
  userId,
  displayName,
  username,
  avatarUrl,
  size = "md",
  blurred = false,
  className,
}: {
  userId?: string;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  blurred?: boolean;
  className?: string;
}) {
  const sizePx = { sm: 32, md: 40, lg: 56 }[size];
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];
  const initials = getAvatarInitials(displayName, username);
  const bg = getAvatarColor(userId ?? username ?? displayName ?? "user");

  if (avatarUrl) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-white",
          blurred && "blur-[2px]",
          className
        )}
        style={{ width: sizePx, height: sizePx }}
      >
        <Image
          src={avatarUrl}
          alt=""
          width={sizePx}
          height={sizePx}
          className="h-full w-full object-cover"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white",
        textSize,
        blurred && "blur-[1px]",
        className
      )}
      style={{ width: sizePx, height: sizePx, backgroundColor: bg }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
