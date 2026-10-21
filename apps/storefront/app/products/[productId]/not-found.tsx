import Link from "next/link";

export default function ProductNotFound() {
  return <main style={{ padding: 40 }}><h1>商品が見つかりません</h1><p>商品一覧から選び直してください。</p><Link href="/">商品一覧へ戻る</Link></main>;
}
