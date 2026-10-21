// 画面の操作確認用。メーカー名は実在するものを使用するが、商品・価格は架空で、APIやDBには接続しない。
export const proteinTypes = ["WPC", "WPI", "SOY"] as const;
export type ProteinType = (typeof proteinTypes)[number];

export interface SampleProduct {
  readonly id: number;
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
}

export const sampleProducts: readonly SampleProduct[] = [
  { id: 1, brand: "エクスプロージョン", name: "デイリーホエイプロテイン", type: "WPC", flavor: "リッチチョコレート", weight: "1kg", price: 3980, color: "#795744", background: "#f0e9df", label: "DAILY WHEY", description: "毎日の一杯を楽しめる、チョコレートフレーバーのホエイプロテイン。まず試したい定番の一袋です。" },
  { id: 2, brand: "ザバス", name: "ピュアホエイアイソレート", type: "WPI", flavor: "バニラ", weight: "1kg", price: 5480, color: "#b19a5c", background: "#f2efdf", label: "PURE ISOLATE", description: "バニラフレーバーのWPIプロテイン。味や価格を比べながら、自分に合う一杯を見つけてください。" },
  { id: 3, brand: "グリコ", name: "プラントソイプロテイン", type: "SOY", flavor: "宇治抹茶", weight: "750g", price: 3480, color: "#63764d", background: "#e9eddf", label: "PLANT SOY", description: "大豆由来のプロテインを、抹茶フレーバーで。植物性の選択肢を探している方に向けたデモ商品です。" },
  { id: 4, brand: "エクスプロージョン", name: "デイリーホエイプロテイン", type: "WPC", flavor: "ストロベリーミルク", weight: "1kg", price: 4180, color: "#b4777b", background: "#f5e8e6", label: "DAILY WHEY", description: "ストロベリーミルクフレーバーのホエイプロテイン。チョコレート以外の味も比較して選べます。" },
  { id: 5, brand: "ザバス", name: "ピュアホエイアイソレート", type: "WPI", flavor: "カフェラテ", weight: "1kg", price: 5680, color: "#8d7561", background: "#ece7e1", label: "PURE ISOLATE", description: "カフェラテフレーバーのWPIプロテイン。種類・メーカー・価格の条件を組み合わせて探してみましょう。" },
  { id: 6, brand: "グリコ", name: "プラントソイプロテイン", type: "SOY", flavor: "プレーン", weight: "750g", price: 2980, color: "#8e9875", background: "#efeee5", label: "PLANT SOY", description: "プレーンタイプの大豆由来プロテイン。シンプルなフレーバーを選びたい方に向けたデモ商品です。" },
];

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
