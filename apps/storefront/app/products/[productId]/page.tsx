import { Suspense } from "react";
import { notFound } from "next/navigation";
import { resolveInitialVariant } from "@/lib/sample-products";
import ProductDetail from "./product-detail";

type Props = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
};

async function DetailContent({ params, searchParams }: Props) {
  const { productId } = await params;
  const { variant } = await searchParams;
  const selected = resolveInitialVariant(productId, typeof variant === "string" ? variant : undefined);
  if (!selected) notFound();
  return <ProductDetail key={`${productId}-${selected.id}`} initialVariant={selected} />;
}

export default function ProductPage(props: Props) {
  return <Suspense fallback={<p role="status" style={{ padding: 32 }}>商品詳細を読み込んでいます…</p>}><DetailContent {...props} /></Suspense>;
}
