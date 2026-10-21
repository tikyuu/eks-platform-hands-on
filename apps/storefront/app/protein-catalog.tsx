"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { brands, filterProducts, isPriceRangeInvalid, proteinTypes, sampleProducts, type ProteinType, type SampleProduct, type SortOrder } from "@/lib/sample-products";
import styles from "./protein-catalog.module.css";

const yen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;
const typeDescriptions = { WPC: "ホエイプロテイン", WPI: "ホエイアイソレート", SOY: "ソイプロテイン" };

function Icon({ name, size = 20 }: { name: "search" | "cart" | "arrow" | "close" | "filter" | "leaf"; size?: number }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    cart: <><path d="M3 4h2l2 12h11l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    filter: <><path d="M4 7h3m4 0h9M4 17h9m4 0h3" /><circle cx="9" cy="7" r="2" /><circle cx="15" cy="17" r="2" /></>,
    leaf: <><path d="M19 4C8 2 3 8 6 15s15 6 13-11Z" /><path d="m4 21 11-12" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function ProductPack({ product }: { product: SampleProduct }) {
  return (
    <div className={styles.pack} style={{ "--pack-color": product.color } as CSSProperties} aria-hidden="true">
      <div className={styles.packSeal} />
      <span className={styles.packBrand}>{product.brand}</span>
      <Icon name="leaf" size={24} />
      <strong className={styles.packName}>{product.label.split(" ").map((word) => <span key={word}>{word}</span>)}</strong>
      <span className={styles.packFlavor}>{product.flavor}</span>
      <div className={styles.packBottom}><b>{product.type}</b><span>{product.weight}</span></div>
    </div>
  );
}

export default function ProteinCatalog() {
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<ProteinType[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOrder>("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<SampleProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  // 画面確認用のカート。再読み込みでリセットされ、注文・決済は行わない。
  const [cart, setCart] = useState<Record<number, number>>({});
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const modalOpen = activeProduct !== null || cartOpen;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (modalOpen && !element.open) element.showModal();
    if (!modalOpen && element.open) element.close();
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [modalOpen]);

  const priceInvalid = isPriceRangeInvalid(minPrice, maxPrice);
  const products = filterProducts(sampleProducts, { query, types, brands: selectedBrands, minPrice, maxPrice, sort });
  const filterCount = types.length + selectedBrands.length + Number(minPrice !== "" || maxPrice !== "");
  const cartItems = sampleProducts.filter((product) => (cart[product.id] ?? 0) > 0);
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = cartItems.reduce((sum, product) => sum + product.price * cart[product.id], 0);

  function toggleType(type: ProteinType) {
    setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }
  function toggleBrand(brand: string) {
    setSelectedBrands((current) => current.includes(brand) ? current.filter((item) => item !== brand) : [...current, brand]);
  }
  function resetFilters() {
    setTypes([]); setSelectedBrands([]); setMinPrice(""); setMaxPrice(""); setQuery("");
  }
  function closeDialog() { setActiveProduct(null); setCartOpen(false); }
  function addToCart(product: SampleProduct) {
    if ((cart[product.id] ?? 0) >= 10) { setNotice("同じ商品は10点まで追加できます。"); return; }
    setCart((current) => ({ ...current, [product.id]: Math.min((current[product.id] ?? 0) + 1, 10) }));
    setNotice(`${product.flavor}をカートに追加しました。カートは再読み込みでリセットされます。`);
  }
  function changeQuantity(id: number, amount: number) {
    setCart((current) => ({ ...current, [id]: Math.max(0, Math.min(10, (current[id] ?? 0) + amount)) }));
  }

  return (
    <div className={styles.store}>
      <a className={styles.skipLink} href="#products">商品一覧へスキップ</a>
      <div className={styles.announcement}>自分に合う一杯を、ここから。<span>学習用ストア · 商品はすべてサンプルです</span></div>
      <header className={styles.header}>
        <a href="/" className={styles.logo} aria-label="DAILY PROTEIN トップ">
          <span className={styles.logoMark}><Icon name="leaf" size={23} /></span>
          <span>DAILY<span className={styles.logoLight}>PROTEIN</span><small>YOUR EVERYDAY NUTRITION</small></span>
        </a>
        <nav className={styles.navigation} aria-label="メインナビゲーション"><a href="#products" className={styles.activeNav}>商品を探す</a><a href="#protein-guide">プロテインの種類</a></nav>
        <button className={styles.cartButton} onClick={() => { setActiveProduct(null); setCartOpen(true); }} aria-label={`カートを見る（${cartCount}点）`}><Icon name="cart" /><span>カート</span><b>{cartCount}</b></button>
      </header>

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
              <button className={styles.productVisual} style={{ background: product.background }} onClick={() => setActiveProduct(product)} aria-label={`${product.name} ${product.flavor}の商品詳細を見る`}>
                <span className={styles.typeBadge}>{product.type}</span>{product.id === 1 && <span className={styles.pickBadge}>PICK UP</span>}
                <ProductPack product={product} /><span className={styles.visualCaption}>{product.flavor}</span>
              </button>
              <div className={styles.productInfo}>
                <p className={styles.productBrand}>{product.brand}</p>
                <button className={styles.productName} onClick={() => setActiveProduct(product)}>{product.name}</button>
                <p className={styles.productMeta}>{product.flavor}<span> / {product.weight}</span></p>
                <div className={styles.productBottom}><p className={styles.productPrice}>{yen(product.price)}<small>税込</small></p><button className={styles.addButton} onClick={() => addToCart(product)} aria-label={`${product.name} ${product.flavor}をカートに追加`}><Icon name="cart" size={18} /><span>追加</span></button></div>
              </div>
            </li>)}</ul> : <div className={styles.emptyState}><Icon name="search" size={32} /><h3>{priceInvalid ? "価格帯を確認してください" : "条件に合う商品がありません"}</h3><p>検索ワードや絞り込み条件を変えてお試しください。</p><button className={styles.primaryButton} onClick={resetFilters}>条件をすべてクリア</button></div>}
            <p className={styles.catalogNote}>表示価格はすべて税込です。商品・ブランド・商品パッケージは画面確認用の架空データです。</p>
          </section>
        </div>

        <section id="protein-guide" className={styles.guide} aria-labelledby="guide-title">
          <div><p className={styles.eyebrow}>FIND YOUR TYPE</p><h2 id="guide-title">あなたは、どのタイプ？</h2><p>気になる種類を選んで、商品を絞り込めます。</p></div>
          <div className={styles.guideTypes}>{proteinTypes.map((type) => <button key={type} aria-pressed={types.length === 1 && types[0] === type} onClick={() => { setTypes([type]); document.getElementById("products")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}><strong>{type}</strong><span>{typeDescriptions[type]}</span><Icon name="arrow" size={17} /></button>)}</div>
        </section>
      </main>
      <footer className={styles.footer}><span>DAILY PROTEIN<span className={styles.footerDot}>.</span></span><p>自分のペースで、毎日を少しずつ。</p><small>学習用デモサイト · 実際の注文・決済はできません</small></footer>
      <div className={styles.notice} role="status" aria-live="polite">{notice && <><Icon name="cart" size={18} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="通知を閉じる"><Icon name="close" size={16} /></button></>}</div>

      <dialog ref={dialog} className={styles.dialog} aria-labelledby="dialog-title" onCancel={closeDialog} onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
        <div className={styles.dialogContent}>
          <button className={styles.dialogClose} onClick={closeDialog} aria-label="閉じる"><Icon name="close" /></button>
          {activeProduct ? <div className={styles.detailLayout}>
            <div className={styles.detailVisual} style={{ background: activeProduct.background }}><ProductPack product={activeProduct} /></div>
            <div className={styles.detailInfo}>
              <p className={styles.eyebrow}>{activeProduct.brand}</p><h2 id="dialog-title">{activeProduct.name}</h2>
              <p>{activeProduct.flavor} / {activeProduct.weight}</p><span className={styles.detailType}>{activeProduct.type}</span>
              <p className={styles.detailDescription}>{activeProduct.description}</p><p className={styles.detailPrice}>{yen(activeProduct.price)}<small>税込</small></p>
              <button className={styles.primaryButton} onClick={() => { addToCart(activeProduct); closeDialog(); }}><Icon name="cart" size={18} />カートに追加</button>
              <p className={styles.demoNote}>サンプル商品です。実際には購入できません。</p>
            </div>
          </div> : cartOpen ? <div className={styles.cartContent}>
            <p className={styles.eyebrow}>YOUR SELECTION</p><h2 id="dialog-title">カート <small>{cartCount}点</small></h2>
            {cartItems.length === 0 ? <div className={styles.emptyState}><Icon name="cart" size={36} /><h3>カートは空です</h3><p>気になる商品を追加してみましょう。</p><button className={styles.primaryButton} onClick={closeDialog}>商品を探す</button></div> : <>
              <ul className={styles.cartItems}>{cartItems.map((product) => <li key={product.id}>
                <div className={styles.cartThumbnail} style={{ background: product.background }}><ProductPack product={product} /></div>
                <div className={styles.cartItemInfo}><b>{product.name}</b><p>{product.flavor} / {product.weight}</p><strong>{yen(product.price)}</strong>
                  <div className={styles.quantity}><button onClick={() => changeQuantity(product.id, -1)} aria-label={`${product.flavor}の数量を減らす`}>−</button><span>{cart[product.id]}</span><button disabled={cart[product.id] >= 10} onClick={() => changeQuantity(product.id, 1)} aria-label={`${product.flavor}の数量を増やす`}>＋</button><button className={styles.removeButton} onClick={() => setCart((current) => ({ ...current, [product.id]: 0 }))}>削除</button></div>
                </div>
              </li>)}</ul>
              <div className={styles.cartTotal}><span>商品合計（税込）</span><strong>{yen(total)}</strong></div>
              <p className={styles.demoNote}>今回はカートの操作確認までです。注文・決済機能は未実装です。カートは再読み込みするとリセットされます。</p>
              <button className={styles.primaryButton} onClick={closeDialog}>お買い物を続ける<Icon name="arrow" size={17} /></button>
            </>}
          </div> : null}
        </div>
      </dialog>
    </div>
  );
}
