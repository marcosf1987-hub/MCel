import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session-profile";
import { canAssignRoles } from "@/lib/auth/roles";
import { fetchAdminUsers } from "@/lib/admin/users-server";
import { UserManagementPanel } from "@/components/admin/user-management-panel";
import type { AppRole } from "@/types/database";

export const metadata = { title: "Usuarios — Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ suspended?: string; role?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const auth = await requireRole(supabase, "admin");
  if (!auth.ok) return null;

  const suspended =
    params.suspended === "yes" || params.suspended === "no"
      ? params.suspended
      : "all";

  const users = await fetchAdminUsers(supabase, {
    q: params.q,
    suspended,
    role:
      params.role &&
      ["user", "moderator", "admin", "superadmin"].includes(params.role)
        ? (params.role as AppRole)
        : "all",
  });
  const assignRoles = canAssignRoles(auth.session.profile.app_role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Gestión de usuarios
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Suspender cuentas, asignar roles (solo superadmin) y exportar datos
          GDPR. Las acciones quedan en{" "}
          <code className="rounded bg-white px-1">admin_audit_log</code>.
        </p>
      </div>

      <UserManagementPanel
        initialUsers={users}
        canAssignRoles={assignRoles}
        currentUserId={auth.session.userId}
        initialSuspendedFilter={suspended}
      />

      <Link
        href="/admin"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al resumen
      </Link>
    </div>
  );
}
