"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { uploadAvatarFromBrowser } from "@/lib/upload-avatar";

export function AvatarUpload({
  userId,
  displayName,
  username,
  avatarUrl,
}: {
  userId: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState(avatarUrl);

  const handleFile = async (file: File) => {
    setUploading(true);
    setMessage(null);
    const result = await uploadAvatarFromBrowser(file);
    setUploading(false);
    if ("error" in result) {
      setMessage(result.error);
      return;
    }
    setPreviewUrl(result.url);
    setMessage("Foto de perfil actualizada");
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <UserAvatar
        userId={userId}
        displayName={displayName}
        username={username}
        avatarUrl={previewUrl}
        size="lg"
      />
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Subiendo…" : "Cambiar foto"}
        </Button>
        {message && (
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{message}</p>
        )}
      </div>
    </div>
  );
}
