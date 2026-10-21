"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findVariant, getProductVariants, getSampleStock, getServingNutrition, type SampleProduct } from "@/lib/sample-products";
import { StoreHeader, useCart } from "../../cart-provider";
import { Icon, ProductPack, yen } from "../../store-ui";
import styles from "../../protein-catalog.module.css";
import detail from "./product-detail.module.css";

const sampleReviews = [
  { name: "サンプルユーザーA", rating: 4, title: "味や容量を比較しやすいです", text: "商品を選ぶ流れを確認するための架空のレビューです。実際の商品の評価ではありません。" },
  { name: "サンプルユーザーB", rating: 5, title: "自分に合うサイズを探しています", text: "レビュー欄の表示例です。購入・投稿されたレビューではありません。" },
];

const nutritionRows = [
  { key: "energyKcal", label: "エネルギー", unit: "kcal" },
  { key: "proteinG", label: "たんぱく質（P）", unit: "g" },
  { key: "fatG", label: "脂質（F）", unit: "g" },
  { key: "carbohydrateG", label: "炭水化物（C）", unit: "g" },
  { key: "saltG", label: "食塩相当量", unit: "g" },
] as const;
const formatNutrition = (value: number) => value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });

export default function ProductDetail({ initialVariant }: { initialVariant: SampleProduct }) {
  const [selected, setSelected] = useState(initialVariant);
  const [quantity, setQuantity] = useState(1);
  const [selectionNotice, setSelectionNotice] = useState("");
  const [cartFeedback, setCartFeedback] = useState<{ added: number; id: number } | null>(null);
  const { addToCart } = useCart();
  const variants = getProductVariants(initialVariant.productId);
  const flavors = [...new Set(variants.map((variant) => variant.flavor))];
  const flavorVariants = variants.filter((variant) => variant.flavor === selected.flavor);
  const stock = getSampleStock(selected.id);
  const quantityLimit = Math.min(10, stock);
  const servingNutrition = getServingNutrition(selected.nutrition);

  useEffect(() => {
    if (!cartFeedback) return;
    const timer = window.setTimeout(() => setCartFeedback(null), cartFeedback.added > 0 ? 1100 : 3000);
    return () => window.clearTimeout(timer);
  }, [cartFeedback]);

  function selectVariant(variant: SampleProduct) {
    setSelected(variant);
    setQuantity(1);
    setCartFeedback(null);
  }

  function changeFlavor(flavor: string) {
    const sameWeight = findVariant(selected.productId, flavor, selected.weight);
    const next = sameWeight ?? variants.find((variant) => variant.flavor === flavor);
    if (!next) return;
    setSelectionNotice(sameWeight ? "" : `この味には${selected.weight}がないため、${next.weight}に変更しました。`);
    selectVariant(next);
  }

  return <div className={styles.store}>
    <StoreHeader />
    <main className={`${styles.main} ${detail.main}`}>
      <nav className={styles.breadcrumb} aria-label="パンくず"><Link href="/">HOME</Link><span>/</span><Link href="/#products">商品一覧</Link><span>/</span>{selected.brand}</nav>
      <Link href="/#products" className={detail.backLink}>← 商品一覧へ戻る</Link>
      <div className={detail.productLayout}>
        <div className={detail.visual} style={{ background: selected.background }}>
          <span className={detail.sampleBadge}>SAMPLE PRODUCT</span>
          <ProductPack product={selected} />
          <p>{selected.flavor} / {selected.weight}</p>
        </div>
        <section className={detail.info} aria-labelledby="product-title">
          <p className={styles.eyebrow}>{selected.brand}</p>
          <h1 id="product-title">{selected.name}</h1>
          <p className={detail.subtitle}>{selected.type} · 毎日の一杯を、自分のペースで。</p>
          <a className={detail.reviewLink} href="#reviews">★ 4.5 <span>レビュー表示例 2件</span></a>
          <p className={detail.price} aria-live="polite">{yen(selected.price)}<small>税込 / 1袋</small></p>
          <p className={detail.description}>{selected.description}</p>

          <div className={detail.selections}>
            <label htmlFor="product-flavor">味<span>FLAVOR</span></label>
            <select id="product-flavor" value={selected.flavor} onChange={(event) => changeFlavor(event.target.value)}>{flavors.map((flavor) => <option key={flavor}>{flavor}</option>)}</select>
            <label htmlFor="product-weight">容量<span>SIZE</span></label>
            <select id="product-weight" value={selected.weight} onChange={(event) => {
              const next = findVariant(selected.productId, selected.flavor, event.target.value);
              if (next) { selectVariant(next); setSelectionNotice(""); }
            }}>{flavorVariants.map((variant) => <option key={variant.id} value={variant.weight}>{variant.weight}{getSampleStock(variant.id) === 0 ? "（在庫なし）" : ""}</option>)}</select>
          </div>
          <p className={detail.selectionNotice} role="status">{selectionNotice}</p>
          <div className={detail.purchaseRow}>
            <label htmlFor="product-quantity">数量<select id="product-quantity" value={quantity} disabled={stock === 0} onChange={(event) => setQuantity(Number(event.target.value))}>{Array.from({ length: Math.max(1, quantityLimit) }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select></label>
            <p className={stock > 0 ? detail.inStock : detail.soldOut}>{stock > 0 ? `● 在庫あり（サンプル残り${stock}点）` : "在庫切れ（サンプル）"}</p>
          </div>
          <p className={detail.subtotal}>選択中：{selected.flavor} / {selected.weight}<br />小計（税込）：<strong>{yen(selected.price * quantity)}</strong></p>
          <button className={`${styles.primaryButton} ${detail.addButton}`} disabled={stock === 0} onClick={() => setCartFeedback({ added: addToCart(selected, quantity), id: performance.now() })}>
            <span key={cartFeedback?.id ?? "idle"} className={detail.buttonLabels} data-added={Boolean(cartFeedback && cartFeedback.added > 0)}>
              <span className={detail.defaultLabel}><Icon name="cart" />カートに入れる</span>
              {cartFeedback && cartFeedback.added > 0 && <span className={detail.successLabel} aria-hidden="true">✓ {cartFeedback.added}点追加しました</span>}
            </span>
          </button>
          <p className={`${detail.cartFeedback} ${cartFeedback?.added === 0 ? detail.cartFeedbackError : ""}`} role="status" aria-live="polite">
            {cartFeedback && <span key={cartFeedback.id} className={cartFeedback.added > 0 ? detail.feedbackFade : undefined}>{cartFeedback.added > 0 ? `${selected.flavor} / ${selected.weight}を追加しました。右上のカートから確認できます。` : "在庫数または追加上限に達しているため、追加できませんでした。"}</span>}
          </p>
          <button className={detail.buyButton} disabled>今すぐ買う（注文機能は準備中）</button>
          <p className={styles.demoNote}>学習用デモです。メーカー名は実在しますが、商品・味・容量・価格・在庫・パッケージは架空で、実際の商品情報とは異なります。注文・決済はできません。</p>
        </section>
      </div>

      <section className={detail.section} aria-labelledby="description-title">
        <p className={styles.eyebrow}>ABOUT THIS PRODUCT</p><h2 id="description-title">商品について</h2>
        <p>{selected.description}</p><p>味や容量を選び、自分に合う一袋を探すためのサンプル商品です。</p>
        <dl className={detail.specs}><div><dt>メーカー表示</dt><dd>{selected.brand}</dd></div><div><dt>種類</dt><dd>{selected.type}</dd></div><div><dt>選択中の味・容量</dt><dd>{selected.flavor} / {selected.weight}</dd></div></dl>
      </section>
      <section id="nutrition" className={detail.section} aria-labelledby="nutrition-title">
        <p className={styles.eyebrow}>NUTRITION / DEMO</p><h2 id="nutrition-title">栄養成分</h2>
        <p className={styles.demoNote}>数値はすべて学習用の架空データです。実際の商品の栄養成分ではありません。</p>
        <table className={detail.nutritionTable}>
          <caption>{selected.flavor}の栄養成分表示例（粉末のみ・水や牛乳などは含まない）</caption>
          <thead><tr><th scope="col">栄養成分</th><th scope="col">100gあたり</th><th scope="col">1食分<br />（{selected.nutrition.servingGrams}g）あたり</th></tr></thead>
          <tbody>{nutritionRows.map(({ key, label, unit }) => <tr key={key}><th scope="row">{label}</th><td>{formatNutrition(selected.nutrition.per100g[key])} {unit}</td><td>{formatNutrition(servingNutrition[key])} {unit}</td></tr>)}</tbody>
        </table>
        <p className={styles.demoNote}>味を変更すると数値も切り替わります。1食分の数値は100gあたりの値から計算し、小数第2位まで丸めています。袋の容量や購入数量では変わりません。</p>
      </section>
      <section id="reviews" className={detail.section} aria-labelledby="reviews-title">
        <p className={styles.eyebrow}>CUSTOMER VOICES / DEMO</p><h2 id="reviews-title">レビュー <small>表示例 2件</small></h2>
        <p className={styles.demoNote}>以下はUI確認用の架空レビューです。実際の評価ではなく、投稿機能もまだありません。</p>
        {sampleReviews.map((review) => <article className={detail.review} key={review.name}><p className={detail.stars} aria-label={`${review.rating}点（5点満点の表示例）`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p><h3>{review.title}</h3><p>{review.text}</p><small>{review.name}</small></article>)}
      </section>
    </main>
    <footer className={styles.footer}><span>DAILY PROTEIN<span className={styles.footerDot}>.</span></span><p>自分のペースで、毎日を少しずつ。</p><small>学習用デモサイト · 実際の注文・決済はできません</small></footer>
  </div>;
}
