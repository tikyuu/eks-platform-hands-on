export interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: number;
}

function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "id" in value &&
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id) &&
    "name" in value &&
    typeof value.name === "string" &&
    "price" in value &&
    typeof value.price === "number" &&
    Number.isSafeInteger(value.price) &&
    value.price >= 0
  );
}

// Next.jsのサーバー側から呼び出す。DBには直接接続しない。
export async function getProducts(): Promise<Product[]> {
  const baseUrl = process.env.PRODUCT_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("PRODUCT_API_BASE_URLを設定してください。");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/products`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error("商品APIから商品一覧を取得できませんでした。");
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isProduct)) {
    throw new Error("商品APIの応答が想定した形式ではありません。");
  }

  return data;
}
