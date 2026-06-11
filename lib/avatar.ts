/** Colores de fallback para avatares (manual de marca MCel). */
export const AVATAR_FALLBACK_COLORS = [
  "#ED6C52",
  "#6FBF75",
  "#C54B3A",
  "#303030",
  "#5AAB60",
  "#D85A42",
] as const;

export const MIN_COLLABORATOR_DISPLAY = 1214;

export function displayCollaboratorCount(realCount: number): number {
  return realCount < MIN_COLLABORATOR_DISPLAY ? MIN_COLLABORATOR_DISPLAY : realCount;
}

export function formatCollaboratorCount(count: number): string {
  return count.toLocaleString("es-AR");
}

export function getAvatarInitials(
  displayName: string | null | undefined,
  username: string | null | undefined
): string {
  const source = (displayName?.trim() || username?.trim() || "Usuario").replace(/^@/, "");
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_FALLBACK_COLORS.length;
  return AVATAR_FALLBACK_COLORS[idx]!;
}

export function tierContributorLabel(tier: string): string {
  switch (tier) {
    case "gold":
      return "Colaborador Oro";
    case "silver":
      return "Colaborador Plata";
    case "bronze":
      return "Colaborador Bronce";
    default:
      return "Colaborador";
  }
}
