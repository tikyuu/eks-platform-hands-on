"use client";

import Link from "next/link";
import { useState } from "react";
import { StoreHeader, useCart } from "./cart-provider";
import { Icon, ProductPack, yen } from "./store-ui";
import { brands, productHref, filterProducts, isPriceRangeInvalid, proteinTypes, sampleProducts, type ProteinType, type SortOrder } from "@/lib/sample-products";
import styles from "./protein-catalog.module.css";

const typeDescriptions = { WPC: "ホエイプロテイン", WPI: "ホエイアイソレート", SOY: "ソイプロテイン" };

export default function ProteinCatalog() {
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<ProteinType[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOrder>("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { addToCart } = useCart();

  const priceInvalid = isPriceRangeInvalid(minPrice, maxPrice);
  const products = filterProducts(sampleProducts, { query, types, brands: selectedBrands, minPrice, maxPrice, sort });
  const filterCount = types.length + selectedBrands.length + Number(minPrice !== "" || maxPrice !== "");

  function toggleType(type: ProteinType) {
    setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }
  function toggleBrand(brand: string) {
    setSelectedBrands((current) => current.includes(brand) ? current.filter((item) => item !== brand) : [...current, brand]);
  }
  function resetFilters() {
    setTypes([]); setSelectedBrands([]); setMinPrice(""); setMaxPrice(""); setQuery("");
  }

  return (
    <div className={styles.store}>
      <a className={styles.skipLink} href="#products">商品一覧へスキップ</a>
      <StoreHeader />

      <main className={styles.main}>
        <div className={styles.breadcrumb}>HOME <span>/</span> プロテイン</div>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>FIND YOUR DAILY PROTEIN</p>
            <h1 id="hero-title">毎日に、<br />ちょうどいい一杯。</h1>
            <p className={styles.heroDescription}>好きな味も、続けやすい価格も。<br />あなたのペースに合うプロテインを見つけよう。</p>
            <a href="#products" className={styles.heroLink}>商品を探す <Icon name="arrow" size={18} /></a>
          </div>
          <div className={styles.heroArt} aria-hidden="true"><span className={styles.heroCircle} /><div className={styles.heroPackBack}><ProductPack product={sampleProducts[2]} /></div><div className={styles.heroPackFront}><ProductPack product={sampleProducts[0]} /></div><span className={styles.heroCaption}>A LITTLE BETTER, EVERY DAY.</span></div>
          <span className={styles.heroNote}>DAILY SELECTION / 01</span>
        </section>

        <div className={styles.searchRow}>
          <label className={styles.searchBox}><Icon name="search" /><span className={styles.srOnly}>商品名・フレーバー・メーカーで検索</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="商品名・フレーバー・メーカーで検索" /></label>
          <span className={styles.searchHint}>お気に入りの一杯を探そう</span>
        </div>

        <div className={styles.catalogLayout}>
          <button className={styles.mobileFilterButton} onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="catalog-filters"><Icon name="filter" size={18} /> 絞り込み {filterCount > 0 && `(${filterCount})`}<span>{filtersOpen ? "閉じる −" : "開く ＋"}</span></button>
          <aside id="catalog-filters" className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ""}`} aria-label="商品の絞り込み">
            <div className={styles.filterHeading}><h2><Icon name="filter" size={18} />絞り込み</h2><button onClick={resetFilters}>クリア</button></div>
            <fieldset className={styles.filterGroup}>
              <legend>プロテインの種類</legend>
              {proteinTypes.map((type) => <label className={styles.checkboxRow} key={type}><input type="checkbox" checked={types.includes(type)} onChange={() => toggleType(type)} /><span><b>{type}</b><small>{typeDescriptions[type]}</small></span><em>{sampleProducts.filter((product) => product.type === type).length}</em></label>)}
            </fieldset>
            <fieldset className={styles.filterGroup}>
              <legend>メーカー</legend>
              {brands.map((brand) => <label className={styles.checkboxRow} key={brand}><input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)} /><span className={styles.brandLabel}>{brand}</span><em>{sampleProducts.filter((product) => product.brand === brand).length}</em></label>)}
            </fieldset>
            <fieldset className={styles.filterGroup}>
              <legend>価格帯（税込）</legend>
              <div className={styles.priceFields}>
                <label><span className={styles.srOnly}>価格の下限（円）</span><span aria-hidden="true">¥</span><input type="number" min="0" step="1" inputMode="numeric" value={minPrice} placeholder="下限なし" onChange={(event) => setMinPrice(event.target.value)} aria-invalid={priceInvalid} aria-describedby={priceInvalid ? "price-error" : undefined} /></label>
                <span>〜</span>
                <label><span className={styles.srOnly}>価格の上限（円）</span><span aria-hidden="true">¥</span><input type="number" min="0" step="1" inputMode="numeric" value={maxPrice} placeholder="上限なし" onChange={(event) => setMaxPrice(event.target.value)} aria-invalid={priceInvalid} aria-describedby={priceInvalid ? "price-error" : undefined} /></label>
              </div>
              {priceInvalid && <p id="price-error" className={styles.error} role="alert">価格は0以上の整数で、下限が上限以下になるよう指定してください。</p>}
            </fieldset>
            <div className={styles.filterTip}><Icon name="leaf" size={20} /><p>種類やメーカーは<br /><strong>複数選んで比較できます。</strong></p></div>
          </aside>

          <section id="products" className={styles.productsSection} aria-labelledby="products-title">
            <div className={styles.resultsHeading}>
              <div><p className={styles.eyebrow}>ALL PRODUCTS</p><h2 id="products-title">プロテイン一覧 <span aria-live="polite">{products.length}<small>件</small></span></h2></div>
              <label className={styles.sortLabel}>並び替え<select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)}><option value="recommended">おすすめ順</option><option value="price-asc">価格が安い順</option><option value="price-desc">価格が高い順</option></select></label>
            </div>
            {(filterCount > 0 || query) && <div className={styles.chips}>
              {query && <button onClick={() => setQuery("")}>検索：{query}<Icon name="close" size={13} /></button>}
              {types.map((type) => <button key={type} onClick={() => toggleType(type)}>{type}<Icon name="close" size={13} /></button>)}
              {selectedBrands.map((brand) => <button key={brand} onClick={() => toggleBrand(brand)}>{brand}<Icon name="close" size={13} /></button>)}
              {(minPrice || maxPrice) && <button onClick={() => { setMinPrice(""); setMaxPrice(""); }}>{minPrice ? yen(Number(minPrice)) : "下限なし"} 〜 {maxPrice ? yen(Number(maxPrice)) : "上限なし"}<Icon name="close" size={13} /></button>}
            </div>}
            {products.length > 0 ? <ul className={styles.productGrid}>{products.map((product) => <li key={product.id} className={styles.productCard}>
              <Link className={styles.productVisual} style={{ background: product.background }} href={productHref(product)} aria-label={`${product.name} ${product.flavor}の商品詳細を見る`}>
                <span className={styles.typeBadge}>{product.type}</span>{product.id === 1 && <span className={styles.pickBadge}>PICK UP</span>}
                <ProductPack product={product} /><span className={styles.visualCaption}>{product.flavor}</span>
              </Link>
              <div className={styles.productInfo}>
                <p className={styles.productBrand}>{product.brand}</p>
                <Link className={styles.productName} href={productHref(product)}>{product.name}</Link>
                <p className={styles.productMeta}>{product.flavor}<span> / {product.weight}</span></p>
                <div className={styles.productBottom}><p className={styles.productPrice}>{yen(product.price)}<small>税込</small></p><button className={styles.addButton} onClick={() => addToCart(product)} aria-label={`${product.name} ${product.flavor}をカートに追加`}><Icon name="cart" size={18} /><span>追加</span></button></div>
              </div>
            </li>)}</ul> : <div className={styles.emptyState}><Icon name="search" size={32} /><h3>{priceInvalid ? "価格帯を確認してください" : "条件に合う商品がありません"}</h3><p>検索ワードや絞り込み条件を変えてお試しください。</p><button className={styles.primaryButton} onClick={resetFilters}>条件をすべてクリア</button></div>}
            <p className={styles.catalogNote}>メーカー名は実在しますが、商品名・味・容量・価格・パッケージは学習用の架空データで、実際の商品情報とは異なります。</p>
          </section>
        </div>

        <section id="protein-guide" className={styles.guide} aria-labelledby="guide-title">
          <div><p className={styles.eyebrow}>FIND YOUR TYPE</p><h2 id="guide-title">あなたは、どのタイプ？</h2><p>気になる種類を選んで、商品を絞り込めます。</p></div>
          <div className={styles.guideTypes}>{proteinTypes.map((type) => <button key={type} aria-pressed={types.length === 1 && types[0] === type} onClick={() => { setTypes([type]); document.getElementById("products")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}><strong>{type}</strong><span>{typeDescriptions[type]}</span><Icon name="arrow" size={17} /></button>)}</div>
        </section>
      </main>
      <footer className={styles.footer}><span>DAILY PROTEIN<span className={styles.footerDot}>.</span></span><p>自分のペースで、毎日を少しずつ。</p><small>学習用デモサイト · 実際の注文・決済はできません</small></footer>
    </div>
  );
}
