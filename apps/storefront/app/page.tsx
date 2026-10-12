import { Suspense } from "react";
import { getProducts, type Product } from "@/lib/products";

async function ProductList() {
  let products: Product[];

  try {
    products = await getProducts();
  } catch {
    console.error("商品一覧の取得に失敗しました。");
    return (
      <p role="alert">
        商品一覧を取得できませんでした。時間をおいて再度お試しください。
      </p>
    );
  }

  if (products.length === 0) {
    return <p>商品はまだありません。</p>;
  }

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          {product.name}：{product.price.toLocaleString("ja-JP")}円
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main>
      <h1>商品一覧</h1>
      <p>販売中の商品をご紹介します。</p>
      <Suspense fallback={<p role="status">商品を読み込んでいます…</p>}>
        <ProductList />
      </Suspense>
    </main>
  );
}
