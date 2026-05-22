export type UserTier = "none" | "bronze" | "silver" | "gold";

export type GlutenCertification =
  | "sin_tacc"
  | "sin_gluten"
  | "con_trazas"
  | "no_certificado"
  | "desconocido";

export const GLUTEN_LABELS: Record<GlutenCertification, string> = {
  sin_tacc: "SIN TACC certificado",
  sin_gluten: "Sin gluten",
  con_trazas: "Puede contener trazas",
  no_certificado: "Sin certificación",
  desconocido: "Desconocido",
};

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  preferences: UserPreferences;
  collaboration_count: number;
  tier: UserTier;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  dietary_restrictions?: string[];
  email_notifications?: boolean;
  profile_public?: boolean;
  locale?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_es: string | null;
  slug: string;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  name_es: string | null;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  barcode: string;
  brand_id: string;
  category_id: string;
  subcategory_id: string;
  name: string;
  slug: string;
  ai_summary: string | null;
  weighted_rating: number | null;
  review_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  brand?: Brand;
  category?: Category;
  subcategory?: Subcategory;
}

export interface ProductImage {
  id: string;
  product_id: string;
  user_id: string | null;
  url: string;
  is_official: boolean;
  sort_order: number;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  opinion: string;
  general_description: string;
  taste: string | null;
  price: number;
  gluten_certification: GlutenCertification;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: "product" | "review";
  target_id: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export const TIER_WEIGHTS: Record<UserTier, number> = {
  none: 0.7,
  bronze: 1.0,
  silver: 1.3,
  gold: 1.55,
};

export const TIER_LABELS: Record<UserTier, string> = {
  none: "Colaborador",
  bronze: "Bronce",
  silver: "Plata",
  gold: "Oro",
};

export function tierFromCollaborations(count: number): UserTier {
  if (count >= 100) return "gold";
  if (count >= 50) return "silver";
  if (count >= 10) return "bronze";
  return "none";
}
