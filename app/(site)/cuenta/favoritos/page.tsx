import { redirect } from "next/navigation";

export default function FavoritesRedirectPage() {
  redirect("/cuenta/listas/mis-favoritos");
}
