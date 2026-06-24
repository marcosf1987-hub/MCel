import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListCollaboratorRole, ListVoteType } from "@/types/database";

export async function getUserListVote(
  supabase: SupabaseClient,
  listId: string,
  userId: string
): Promise<ListVoteType | null> {
  const { data } = await supabase
    .from("list_votes")
    .select("vote_type")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.vote_type as ListVoteType) ?? null;
}

export async function isFollowingUser(
  supabase: SupabaseClient,
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  return Boolean(data);
}

export async function getCollaboratorRole(
  supabase: SupabaseClient,
  listId: string,
  userId: string
): Promise<ListCollaboratorRole | null> {
  const { data } = await supabase
    .from("list_collaborators")
    .select("role")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.role as ListCollaboratorRole) ?? null;
}

export async function canEditList(
  supabase: SupabaseClient,
  listId: string,
  userId: string
): Promise<boolean> {
  const { data: list } = await supabase
    .from("product_lists")
    .select("user_id")
    .eq("id", listId)
    .maybeSingle();

  if (list?.user_id === userId) return true;

  const role = await getCollaboratorRole(supabase, listId, userId);
  return role === "editor";
}

export async function canViewListAsCollaborator(
  supabase: SupabaseClient,
  listId: string,
  userId: string
): Promise<boolean> {
  const role = await getCollaboratorRole(supabase, listId, userId);
  return role === "viewer" || role === "editor";
}

export async function isListOwner(
  supabase: SupabaseClient,
  listId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("product_lists")
    .select("user_id")
    .eq("id", listId)
    .maybeSingle();

  return data?.user_id === userId;
}
