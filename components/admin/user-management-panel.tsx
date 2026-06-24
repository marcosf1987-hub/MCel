"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_ROLE_LABELS } from "@/lib/auth/roles";
import type { AdminUserRow } from "@/lib/admin/users-server";
import type { AppRole } from "@/types/database";
import { Download, Loader2 } from "lucide-react";

const ROLE_OPTIONS: AppRole[] = ["user", "moderator", "admin", "superadmin"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function UserManagementPanel({
  initialUsers,
  canAssignRoles,
  currentUserId,
  initialSuspendedFilter = "all",
}: {
  initialUsers: AdminUserRow[];
  canAssignRoles: boolean;
  currentUserId: string;
  initialSuspendedFilter?: "all" | "yes" | "no";
}) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [suspendedFilter, setSuspendedFilter] = useState<"all" | "yes" | "no">(
    initialSuspendedFilter
  );
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suspendReasons, setSuspendReasons] = useState<Record<string, string>>(
    {}
  );
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AppRole>>({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (suspendedFilter !== "all") params.set("suspended", suspendedFilter);

      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudieron cargar los usuarios.");
        return;
      }
      const list = data.users as AdminUserRow[];
      setUsers(list);
      setRoleDrafts(
        Object.fromEntries(list.map((u) => [u.id, u.app_role])) as Record<
          string,
          AppRole
        >
      );
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [query, roleFilter, suspendedFilter]);

  useEffect(() => {
    setRoleDrafts(
      Object.fromEntries(users.map((u) => [u.id, u.app_role])) as Record<
        string,
        AppRole
      >
    );
  }, [users]);

  const patchUser = async (
    userId: string,
    body: Record<string, unknown>
  ): Promise<boolean> => {
    setActingId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo actualizar el usuario.");
        return false;
      }
      await loadUsers();
      return true;
    } catch {
      setError("Error de conexión.");
      return false;
    } finally {
      setActingId(null);
    }
  };

  const downloadExport = async (userId: string) => {
    setActingId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/export`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo exportar.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `gdpr-export-${userId.slice(0, 8)}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Error de conexión.");
    } finally {
      setActingId(null);
    }
  };

  const isSelf = (id: string) => id === currentUserId;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <Label htmlFor="user-search">Buscar</Label>
          <Input
            id="user-search"
            placeholder="Usuario o nombre"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void loadUsers()}
          />
        </div>
        <div>
          <Label htmlFor="role-filter">Rol</Label>
          <select
            id="role-filter"
            className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AppRole | "all")}
          >
            <option value="all">Todos</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {APP_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="suspended-filter">Estado</Label>
          <select
            id="suspended-filter"
            className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            value={suspendedFilter}
            onChange={(e) =>
              setSuspendedFilter(e.target.value as "all" | "yes" | "no")
            }
          >
            <option value="all">Todos</option>
            <option value="no">Activos</option>
            <option value="yes">Suspendidos</option>
          </select>
        </div>
        <Button type="button" onClick={() => void loadUsers()} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Buscar
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {users.length === 0 && !loading ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No hay usuarios para mostrar.
        </p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const self = isSelf(user.id);
            return (
              <Card
                key={user.id}
                className={user.is_suspended ? "border-red-200" : undefined}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {user.display_name ?? user.username ?? "Sin nombre"}
                        {self && (
                          <span className="ml-2 text-xs font-normal text-[var(--color-muted-foreground)]">
                            (vos)
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {user.username && `@${user.username} · `}
                        {APP_ROLE_LABELS[user.app_role]}
                        {user.is_suspended && (
                          <span className="ml-2 text-red-600">Suspendido</span>
                        )}
                      </p>
                    </div>
                    {user.username && (
                      <Link
                        href={`/perfil/${user.username}`}
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                        target="_blank"
                      >
                        Ver perfil →
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-[var(--color-muted-foreground)]">
                  {user.email && <p>{user.email}</p>}
                  <p>
                    {user.review_count} evaluaciones · tier {user.tier} · alta{" "}
                    {formatDate(user.created_at)}
                  </p>
                  {user.is_suspended && user.suspended_reason && (
                    <p className="text-red-700">
                      Motivo: {user.suspended_reason}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={actingId === user.id}
                      onClick={() => void downloadExport(user.id)}
                    >
                      {actingId === user.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Export GDPR
                    </Button>

                    {!self && (
                      <>
                        {user.is_suspended ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actingId === user.id}
                            onClick={() =>
                              void patchUser(user.id, { unsuspend: true })
                            }
                          >
                            Reactivar
                          </Button>
                        ) : (
                          <>
                            <Textarea
                              placeholder="Motivo de suspensión (opcional)"
                              value={suspendReasons[user.id] ?? ""}
                              onChange={(e) =>
                                setSuspendReasons((prev) => ({
                                  ...prev,
                                  [user.id]: e.target.value,
                                }))
                              }
                              rows={1}
                              className="min-w-[200px] max-w-sm"
                              disabled={actingId === user.id}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-red-700"
                              disabled={actingId === user.id}
                              onClick={() =>
                                void patchUser(user.id, {
                                  suspend: true,
                                  reason: suspendReasons[user.id] ?? "",
                                })
                              }
                            >
                              Suspender
                            </Button>
                          </>
                        )}

                        {canAssignRoles && (
                          <div className="flex items-center gap-2">
                            <select
                              className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm"
                              value={roleDrafts[user.id] ?? user.app_role}
                              onChange={(e) =>
                                setRoleDrafts((prev) => ({
                                  ...prev,
                                  [user.id]: e.target.value as AppRole,
                                }))
                              }
                              disabled={actingId === user.id}
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {APP_ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              size="sm"
                              disabled={
                                actingId === user.id ||
                                (roleDrafts[user.id] ?? user.app_role) ===
                                  user.app_role
                              }
                              onClick={() =>
                                void patchUser(user.id, {
                                  app_role: roleDrafts[user.id] ?? user.app_role,
                                })
                              }
                            >
                              Asignar rol
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
