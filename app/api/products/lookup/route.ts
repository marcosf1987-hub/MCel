import { NextRequest, NextResponse } from "next/server";
import { parseOffResponse } from "@/lib/off/parse";
import { findProductByBarcode } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get("barcode");
  if (!barcode) {
    return NextResponse.json({ error: "barcode requerido" }, { status: 400 });
  }

  const existing = await findProductByBarcode(barcode);
  if (existing) {
    return NextResponse.json({
      existsInDb: true,
      product: existing,
    });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,brands,product_name,pnns_groups_1,pnns_groups_2,image_front_url,image_url`,
      { next: { revalidate: 3600 } }
    );
    const json = await res.json();
    const off = parseOffResponse(json);

    return NextResponse.json({
      existsInDb: false,
      off,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al consultar Open Food Facts" },
      { status: 502 }
    );
  }
}
