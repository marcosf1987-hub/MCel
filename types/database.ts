export type UserTier = "none" | "bronze" | "silver" | "gold";

export type AppRole = "user" | "moderator" | "admin" | "superadmin";

export type GlutenCertification =
  | "sin_tacc"
  | "sin_gluten"
  | "con_trazas"
  | "no_certificado"
  | "desconocido";

export type PriceRange = "1" | "2" | "3" | "4";

export type TasteRating = "1" | "2" | "3" | "4";

export const PRICE_RANGE_LABELS: Record<PriceRange, string> = {
  "1": "$",
  "2": "$$",
  "3": "$$$",
  "4": "$$$$",
};

export const PRICE_RANGE_OPTIONS: { value: PriceRange; label: string }[] = [
  { value: "1", label: "$ — Económico" },
  { value: "2", label: "$$ — Accesible" },
  { value: "3", label: "$$$ — Medio" },
  { value: "4", label: "$$$$ — Premium" },
];

export const GENERAL_RATING_LABELS: Record<"1" | "2" | "3" | "4" | "5", string> = {
  "1": "Malo",
  "2": "Regular",
  "3": "Bueno",
  "4": "Muy bueno",
  "5": "Excelente",
};

export const TASTE_RATING_LABELS: Record<TasteRating, string> = {
  "1": "Malo (no me gustó)",
  "2": "Bueno (cumple)",
  "3": "Muy bueno (rico)",
  "4": "Excelente (delicioso)",
};

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
  app_role: AppRole;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
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
  is_system?: boolean;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  name_es: string | null;
  slug: string;
  is_system?: boolean;
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
  deleted_at?: string | null;
  brand?: Brand;
  category?: Category;
  subcategory?: Subcategory;
}

export type ImageSource = "community" | "off" | "official";
export type ImageQualityStatus = "pending" | "scored" | "needs_review" | "manual";

export interface ProductImageQualityDetails {
  framing?: number;
  sharpness?: number;
  clean_background?: number;
  label_legibility?: number;
  is_packaged_product?: boolean;
  issues?: string[];
  confidence?: number;
  scorer?: "vision" | "heuristic";
}

export interface ProductImage {
  id: string;
  product_id: string;
  user_id: string | null;
  url: string;
  is_official: boolean;
  sort_order: number;
  image_source: ImageSource;
  quality_score: number | null;
  quality_details: ProductImageQualityDetails | null;
  quality_status: ImageQualityStatus;
  is_hidden: boolean;
  scored_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  opinion: string;
  general_description: string | null;
  taste: string | null;
  taste_rating: TasteRating | null;
  price_range: PriceRange | null;
  gluten_certification: GlutenCertification;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export type ListVisibility = "public" | "unlisted" | "private";
export type ListVoteType = "up" | "down";
export type ListCollaboratorRole = "viewer" | "editor";
export type ListNotificationType = "list_vote" | "list_comment";

export type UserNotificationType =
  | "content_hidden"
  | "content_restored"
  | "account_suspended"
  | "account_unsuspended";

export interface UserNotification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: UserNotificationType;
  title: string;
  message: string;
  link_href: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ProductList {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string | null;
  visibility: ListVisibility;
  is_system: boolean;
  vote_count: number;
  downvote_count: number;
  save_count: number;
  created_at: string;
  updated_at: string;
  profile?: Pick<Profile, "username" | "display_name">;
}

export interface ListSave {
  list_id: string;
  user_id: string;
  created_at: string;
}

export interface ProductListItem {
  id: string;
  list_id: string;
  product_id: string;
  sort_order: number;
  note: string | null;
  created_at: string;
}

export interface ListVote {
  list_id: string;
  user_id: string;
  vote_type: ListVoteType;
  created_at: string;
}

export interface UserFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface ListCollaborator {
  list_id: string;
  user_id: string;
  invited_by: string;
  role: ListCollaboratorRole;
  created_at: string;
}

export interface ListNotification {
  id: string;
  user_id: string;
  actor_id: string;
  list_id: string;
  type: ListNotificationType;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ListComment {
  id: string;
  list_id: string;
  user_id: string;
  body: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type PlaceType = "comercio" | "restaurante";

export type PlaceCeliacLevel =
  | "opciones"
  | "dedicado"
  | "certificado"
  | "desconocido";

export type PlaceStatus = "pending" | "published" | "rejected";

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  comercio: "Comercio",
  restaurante: "Restaurante",
};

export const PLACE_CELIAC_LABELS: Record<PlaceCeliacLevel, string> = {
  opciones: "Opciones sin TACC",
  dedicado: "Dedicado sin TACC",
  certificado: "Certificado",
  desconocido: "Sin info",
};

export const PLACE_STATUS_LABELS: Record<PlaceStatus, string> = {
  pending: "Pendiente",
  published: "Publicado",
  rejected: "Rechazado",
};

export interface Place {
  id: string;
  name: string;
  slug: string;
  place_type: PlaceType;
  description: string | null;
  address: string | null;
  city: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  cover_image_url: string | null;
  google_place_id: string | null;
  celiac_level: PlaceCeliacLevel;
  celiac_notes: string | null;
  status: PlaceStatus;
  rejection_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  weighted_rating: number | null;
  review_count: number;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaceReview {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  opinion: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: Pick<Profile, "display_name" | "username" | "avatar_url" | "tier">;
}

export interface PlaceItem {
  id: string;
  place_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  deleted_at: string | null;
  weighted_rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlaceItemReview {
  id: string;
  place_item_id: string;
  user_id: string;
  rating: number;
  opinion: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ReportTargetType = "product" | "review" | "list" | "list_comment";

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  resolved_by: string | null;
  resolved_at: string | null;
  moderator_note: string | null;
  created_at: string;
}

export const REPORT_TARGET_TYPES: ReportTargetType[] = [
  "product",
  "review",
  "list",
  "list_comment",
];

/** @deprecated Usar lista sistema mis-favoritos */
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
