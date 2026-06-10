"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FollowUserButton({
  userId,
  initialFollowing,
  isLoggedIn,
  isSelf,
}: {
  userId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
  isSelf: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (isSelf) return null;

  const toggle = async () => {
    if (!isLoggedIn) {
      window.alert("Iniciá sesión para seguir usuarios");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        following?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error");
      setFollowing(Boolean(data.following));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={following ? "outline" : "accent"}
      size="sm"
      className="gap-2"
      disabled={loading}
      onClick={() => void toggle()}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4" />
          Siguiendo
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Seguir
        </>
      )}
    </Button>
  );
}
