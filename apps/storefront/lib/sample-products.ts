// 画面の操作確認用。メーカー名は実在するものを使用するが、商品・価格は架空で、APIやDBには接続しない。
export const proteinTypes = ["WPC", "WPI", "SOY"] as const;
export type ProteinType = (typeof proteinTypes)[number];

export interface NutritionValues {
  readonly energyKcal: number;
  readonly proteinG: number;
  readonly fatG: number;
  readonly carbohydrateG: number;
  readonly saltG: number;
}

export interface ProductNutrition {
  readonly servingGrams: number;
  readonly per100g: NutritionValues;
}

// メーカーの実データではなく、栄養成分表の操作確認用の架空の数値。
const sampleNutrition: readonly ProductNutrition[] = [
  { servingGrams: 20, per100g: { energyKcal: 398, proteinG: 75, fatG: 6, carbohydrateG: 11, saltG: 0.4 } },
  { servingGrams: 30, per100g: { energyKcal: 376, proteinG: 85, fatG: 2, carbohydrateG: 4.5, saltG: 0.5 } },
  { servingGrams: 20, per100g: { energyKcal: 369, proteinG: 72, fatG: 5, carbohydrateG: 9, saltG: 0.8 } },
  { servingGrams: 20, per100g: { energyKcal: 400, proteinG: 74, fatG: 6, carbohydrateG: 12, saltG: 0.45 } },
  { servingGrams: 30, per100g: { energyKcal: 380, proteinG: 84, fatG: 2, carbohydrateG: 6.5, saltG: 0.55 } },
  { servingGrams: 25, per100g: { energyKcal: 373, proteinG: 80, fatG: 5, carbohydrateG: 2, saltG: 0.6 } },
];

export function getServingNutrition(nutrition: ProductNutrition): NutritionValues {
  const scale = (value: number) => Math.round(value * nutrition.servingGrams / 100 * 100) / 100;
  return {
    energyKcal: scale(nutrition.per100g.energyKcal),
    proteinG: scale(nutrition.per100g.proteinG),
    fatG: scale(nutrition.per100g.fatG),
    carbohydrateG: scale(nutrition.per100g.carbohydrateG),
    saltG: scale(nutrition.per100g.saltG),
  };
}

export interface SampleProduct {
  readonly id: number;
  readonly productId: string;
  readonly brand: string;
  readonly name: string;
  readonly type: ProteinType;
  readonly flavor: string;
  readonly weight: string;
  readonly price: number;
  readonly color: string;
  readonly background: string;
  readonly label: string;
  readonly description: string;
  readonly nutrition: ProductNutrition;
}

export const sampleProducts: readonly SampleProduct[] = [
  { id: 1, nutrition: sampleNutrition[0], productId: "daily-whey", brand: "エクスプロージョン", name: "デイリーホエイプロテイン", type: "WPC", flavor: "リッチチョコレート", weight: "1kg", price: 3980, color: "#795744", background: "#f0e9df", label: "DAILY WHEY", description: "毎日の一杯を楽しめる、チョコレートフレーバーのホエイプロテイン。まず試したい定番の一袋です。" },
  { id: 2, nutrition: sampleNutrition[1], productId: "pure-isolate", brand: "ザバス", name: "ピュアホエイアイソレート", type: "WPI", flavor: "バニラ", weight: "1kg", price: 5480, color: "#b19a5c", background: "#f2efdf", label: "PURE ISOLATE", description: "バニラフレーバーのWPIプロテイン。味や価格を比べながら、自分に合う一杯を見つけてください。" },
  { id: 3, nutrition: sampleNutrition[2], productId: "plant-soy", brand: "グリコ", name: "プラントソイプロテイン", type: "SOY", flavor: "宇治抹茶", weight: "750g", price: 3480, color: "#63764d", background: "#e9eddf", label: "PLANT SOY", description: "大豆由来のプロテインを、抹茶フレーバーで。植物性の選択肢を探している方に向けたデモ商品です。" },
  { id: 4, nutrition: sampleNutrition[3], productId: "daily-whey", brand: "エクスプロージョン", name: "デイリーホエイプロテイン", type: "WPC", flavor: "ストロベリーミルク", weight: "1kg", price: 4180, color: "#b4777b", background: "#f5e8e6", label: "DAILY WHEY", description: "ストロベリーミルクフレーバーのホエイプロテイン。チョコレート以外の味も比較して選べます。" },
  { id: 5, nutrition: sampleNutrition[4], productId: "pure-isolate", brand: "ザバス", name: "ピュアホエイアイソレート", type: "WPI", flavor: "カフェラテ", weight: "1kg", price: 5680, color: "#8d7561", background: "#ece7e1", label: "PURE ISOLATE", description: "カフェラテフレーバーのWPIプロテイン。種類・メーカー・価格の条件を組み合わせて探してみましょう。" },
  { id: 6, nutrition: sampleNutrition[5], productId: "plant-soy", brand: "グリコ", name: "プラントソイプロテイン", type: "SOY", flavor: "プレーン", weight: "750g", price: 2980, color: "#8e9875", background: "#efeee5", label: "PLANT SOY", description: "プレーンタイプの大豆由来プロテイン。シンプルなフレーバーを選びたい方に向けたデモ商品です。" },
];

// 一覧は代表の6件。詳細では同じproductIdに属する味・容量を選択する。
export const sampleVariants: readonly SampleProduct[] = [
  ...sampleProducts,
  { ...sampleProducts[0], id: 101, weight: "3kg", price: 9980 },
  { ...sampleProducts[1], id: 102, weight: "3kg", price: 13980 },
  { ...sampleProducts[2], id: 103, weight: "1.5kg", price: 6280 },
];

// 在庫も操作確認用の仮データ。実際の購入時はサーバー側で再確認する。
export function getSampleStock(variantId: number): number {
  if (!sampleVariants.some((variant) => variant.id === variantId)) return 0;
  if (variantId === 102) return 0;
  return variantId === 101 ? 3 : 10;
}

export function getProductVariants(productId: string): SampleProduct[] {
  return sampleVariants.filter((variant) => variant.productId === productId);
}

export function findVariant(productId: string, flavor: string, weight: string): SampleProduct | undefined {
  return sampleVariants.find((variant) => variant.productId === productId && variant.flavor === flavor && variant.weight === weight);
}

export function productHref(variant: SampleProduct): string {
  return `/products/${variant.productId}?variant=${variant.id}`;
}

export function resolveInitialVariant(productId: string, variantId: string | undefined): SampleProduct | undefined {
  const variants = getProductVariants(productId);
  return variants.find((variant) => String(variant.id) === variantId) ?? variants[0];
}

export function addSampleCartItem(cart: Readonly<Record<number, number>>, variantId: number, quantity: number): Record<number, number> {
  const limit = Math.min(10, getSampleStock(variantId));
  if (!Number.isInteger(quantity) || quantity < 1 || limit === 0) return { ...cart };
  return { ...cart, [variantId]: Math.min((cart[variantId] ?? 0) + quantity, limit) };
}

export const brands = [...new Set(sampleProducts.map((product) => product.brand))];
export type SortOrder = "recommended" | "price-asc" | "price-desc";

export interface ProductFilters {
  query: string;
  types: readonly ProteinType[];
  brands: readonly string[];
  minPrice: string;
  maxPrice: string;
  sort: SortOrder;
}

export function isPriceRangeInvalid(min: string, max: string): boolean {
  const values = [min, max].filter((value) => value !== "");
  if (values.some((value) => !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) return true;
  return min !== "" && max !== "" && Number(min) > Number(max);
}

export function filterProducts(products: readonly SampleProduct[], filters: ProductFilters): SampleProduct[] {
  if (isPriceRangeInvalid(filters.minPrice, filters.maxPrice)) return [];
  const words = filters.query.normalize("NFKC").toLocaleLowerCase("ja-JP").trim().split(/\s+/).filter(Boolean);
  const result = products.filter((product) => {
    const text = `${product.brand} ${product.name} ${product.flavor} ${product.type}`.normalize("NFKC").toLocaleLowerCase("ja-JP");
    return words.every((word) => text.includes(word))
      && (filters.types.length === 0 || filters.types.includes(product.type))
      && (filters.brands.length === 0 || filters.brands.includes(product.brand))
      && (filters.minPrice === "" || product.price >= Number(filters.minPrice))
      && (filters.maxPrice === "" || product.price <= Number(filters.maxPrice));
  });
  if (filters.sort === "price-asc") result.sort((a, b) => a.price - b.price);
  if (filters.sort === "price-desc") result.sort((a, b) => b.price - a.price);
  return result;
}
