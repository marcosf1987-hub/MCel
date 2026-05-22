export interface OffProductData {
  code: string;
  brand: string;
  productName: string;
  category: string;
  subcategory: string;
  imageUrl: string | null;
  found: boolean;
}

export function parseOffResponse(data: unknown): OffProductData | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const status = root.status;
  if (status === 0 || status === "0") {
    return {
      code: "",
      brand: "",
      productName: "",
      category: "",
      subcategory: "",
      imageUrl: null,
      found: false,
    };
  }
  const product = root.product as Record<string, unknown> | undefined;
  if (!product) return null;

  const code = String(product.code ?? "");
  const tags = product.brands_tags;
  const firstTag = Array.isArray(tags) ? String(tags[0] ?? "") : "";
  const brandsRaw = String(product.brands ?? firstTag ?? "");
  const brand = brandsRaw.split(",")[0]?.trim() ?? "";
  const productName = String(product.product_name ?? product.product_name_es ?? "").trim();
  const category = String(product.pnns_groups_1 ?? product.categories ?? "").trim();
  const subcategory = String(product.pnns_groups_2 ?? "").trim();
  const imageUrl =
    (product.image_front_url as string) ||
    (product.image_url as string) ||
    null;

  return {
    code,
    brand,
    productName,
    category,
    subcategory,
    imageUrl,
    found: Boolean(productName || brand),
  };
}
