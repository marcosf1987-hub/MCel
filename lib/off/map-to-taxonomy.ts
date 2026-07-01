import {
  findOtrosSelection,
  findSubcategoryOtros,
  type TaxonomyCategory,
  type TaxonomySelection,
} from "@/lib/catalog-taxonomy";

export type OffTaxonomyMatchLevel = "full" | "category" | "none";

export type OffTaxonomyMatch = TaxonomySelection & {
  matchLevel: OffTaxonomyMatchLevel;
  categorySlug: string;
  subcategorySlug: string;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

/** Reglas OFF/pnns → slug de categoría del catálogo. */
const CATEGORY_RULES: { slug: string; keywords: string[] }[] = [
  {
    slug: "almacen-y-despensa",
    keywords: [
      "harina",
      "flour",
      "premezcla",
      "arroz",
      "rice",
      "legumbre",
      "pulse",
      "cereal",
      "semilla",
      "pasta",
      "fideo",
      "noodle",
      "aceite",
      "oil",
      "condimento",
      "sauce",
      "spice",
      "conserva",
      "canned",
      "dulce",
      "untable",
      "spread",
      "mermelada",
      "grocery",
      "plant based",
    ],
  },
  {
    slug: "panaderia-y-reposteria",
    keywords: [
      "bread",
      "pan",
      "bakery",
      "pastry",
      "reposteria",
      "panificacion",
      "cake",
      "torta",
      "salado",
      "salty",
    ],
  },
  {
    slug: "snacks-y-golosinas",
    keywords: [
      "snack",
      "galletita",
      "biscuit",
      "cookie",
      "cracker",
      "chocolate",
      "candy",
      "sweet",
      "golosina",
      "alfajor",
      "barrita",
      "bar",
      "sugary",
    ],
  },
  {
    slug: "lacteos",
    keywords: [
      "milk",
      "leche",
      "dairy",
      "lacteo",
      "yogur",
      "yogurt",
      "queso",
      "cheese",
      "manteca",
      "butter",
      "margarina",
      "margarine",
      "cream",
      "crema",
    ],
  },
  {
    slug: "congelados-y-comidas-listas",
    keywords: [
      "frozen",
      "congelad",
      "freezer",
      "prepared meal",
      "comida preparada",
      "ready meal",
      "vegetable",
      "vegetal",
      "papa",
      "potato",
      "fresh pasta",
      "pasta fresca",
      "meat",
      "carne",
      "fiambre",
      "ham",
      "embutido",
      "rebozad",
      "breaded",
      "nugget",
    ],
  },
  {
    slug: "bebidas",
    keywords: [
      "beverage",
      "bebida",
      "drink",
      "water",
      "agua",
      "juice",
      "jugo",
      "soda",
      "gaseosa",
      "beer",
      "cerveza",
      "wine",
      "vino",
      "alcohol",
      "spirit",
      "tea",
      "te",
      "coffee",
      "cafe",
      "infusion",
      "mate",
    ],
  },
];

/** Reglas OFF → slug de subcategoría (por categoría padre). */
const SUBCATEGORY_RULES: Record<string, { slug: string; keywords: string[] }[]> = {
  "almacen-y-despensa": [
    { slug: "harinas-y-premezclas", keywords: ["harina", "flour", "premezcla", "mix"] },
    { slug: "arroz-y-legumbres", keywords: ["arroz", "rice", "legumbre", "lenteja", "poroto", "pulse"] },
    { slug: "cereales-y-semillas", keywords: ["cereal", "semilla", "seed", "granola", "avena", "oat"] },
    { slug: "pastas-y-fideos", keywords: ["pasta", "fideo", "noodle", "spaghetti", "ravio"] },
    { slug: "aceites-y-condimentos", keywords: ["aceite", "oil", "vinagre", "condimento", "salsa", "spice", "sal "] },
    { slug: "conservas-y-enlatados", keywords: ["conserva", "canned", "enlatad", "atun", "tomate"] },
    { slug: "dulces-y-untables", keywords: ["dulce", "mermelada", "jalea", "dulce de leche", "untable", "spread", "miel", "honey"] },
  ],
  "panaderia-y-reposteria": [
    { slug: "panes", keywords: ["pan", "bread", "tostada"] },
    { slug: "salados", keywords: ["salado", "salty", "medialuna", "chipa"] },
    { slug: "reposteria-y-panificacion-dulce", keywords: ["reposteria", "pastry", "cake", "torta", "bizcocho", "muffin", "brownie"] },
  ],
  "snacks-y-golosinas": [
    { slug: "snacks-salados", keywords: ["snack", "salado", "salty", "papas frita", "chizito", "palito"] },
    { slug: "galletitas-dulces", keywords: ["galletita", "cookie", "biscuit", "cracker dulce"] },
    { slug: "chocolates-y-confites", keywords: ["chocolate", "candy", "caramelo", "confite"] },
    { slug: "alfajores-y-barritas", keywords: ["alfajor", "barrita", "bar ", "energy"] },
  ],
  "lacteos": [
    { slug: "leches-y-cremas", keywords: ["leche", "milk", "crema", "cream"] },
    { slug: "yogures-y-postres", keywords: ["yogur", "yogurt", "postre", "flan", "dulce de leche"] },
    { slug: "quesos", keywords: ["queso", "cheese"] },
    { slug: "mantecas-y-margarinas", keywords: ["manteca", "butter", "margarina", "margarine"] },
  ],
  "congelados-y-comidas-listas": [
    { slug: "comidas-preparadas", keywords: ["preparada", "ready meal", "pizza", "lasaña", "empanada congel"] },
    { slug: "vegetales-y-papas-congeladas", keywords: ["vegetal", "vegetable", "papa", "potato", "verdura congel"] },
    { slug: "pastas-frescas-congeladas", keywords: ["pasta fresca", "fresh pasta", "ravio congel", "ñoqui congel"] },
    { slug: "carnes-fiambres-y-rebozados", keywords: ["carne", "meat", "fiambre", "ham", "jamón", "embutido", "rebozad", "nugget", "milanesa congel"] },
  ],
  "bebidas": [
    { slug: "bebidas-sin-alcohol", keywords: ["agua", "water", "jugo", "juice", "gaseosa", "soda", "leche vegetal drink"] },
    { slug: "bebidas-con-alcohol", keywords: ["alcohol", "cerveza", "beer", "vino", "wine", "spirit", "licor"] },
    { slug: "infusiones", keywords: ["te", "tea", "cafe", "coffee", "mate", "infusion", "yerba"] },
  ],
};

function matchCategorySlug(offCategory: string): string | null {
  const text = normalize(offCategory);
  if (!text) return null;
  for (const rule of CATEGORY_RULES) {
    if (hasAny(text, rule.keywords.map(normalize))) return rule.slug;
  }
  return null;
}

function matchSubcategorySlug(
  categorySlug: string,
  offSubcategory: string,
  offCategory: string
): string | null {
  const combined = normalize(`${offCategory} ${offSubcategory}`);
  if (!combined) return null;
  const rules = SUBCATEGORY_RULES[categorySlug] ?? [];
  for (const rule of rules) {
    if (hasAny(combined, rule.keywords.map(normalize))) return rule.slug;
  }
  return null;
}

function resolveBySlugs(
  categories: TaxonomyCategory[],
  categorySlug: string,
  subcategorySlug: string
): OffTaxonomyMatch | null {
  const cat = categories.find((c) => c.slug === categorySlug);
  const sub = cat?.subcategories.find((s) => s.slug === subcategorySlug);
  if (!cat || !sub) return null;
  return {
    categoryId: cat.id,
    subcategoryId: sub.id,
    categorySlug,
    subcategorySlug,
    matchLevel: "full",
  };
}

export function mapOffToTaxonomy(
  offCategory: string,
  offSubcategory: string,
  categories: TaxonomyCategory[]
): OffTaxonomyMatch {
  const otros = findOtrosSelection(categories);
  const fallback: OffTaxonomyMatch = {
    categoryId: otros?.categoryId ?? "",
    subcategoryId: otros?.subcategoryId ?? "",
    categorySlug: "otros",
    subcategorySlug: "otros",
    matchLevel: "none",
  };

  if (!categories.length || !otros) return fallback;

  const categorySlug = matchCategorySlug(offCategory);
  if (!categorySlug) return fallback;

  const subSlug =
    matchSubcategorySlug(categorySlug, offSubcategory, offCategory) ?? "otros";

  const full = resolveBySlugs(categories, categorySlug, subSlug);
  if (full) {
    return {
      ...full,
      matchLevel: subSlug === "otros" ? "category" : "full",
    };
  }

  const partial = findSubcategoryOtros(categories, categorySlug);
  if (partial) {
    return {
      ...partial,
      categorySlug,
      subcategorySlug: "otros",
      matchLevel: "category",
    };
  }

  return fallback;
}

export function isOffCategoryUseful(category: string, subcategory: string): boolean {
  return Boolean(normalize(category) || normalize(subcategory));
}

/** Expuesto para tests en scripts/test-taxonomy-map.mjs */
export const __testing = {
  normalize,
  matchCategorySlug,
  matchSubcategorySlug,
};
