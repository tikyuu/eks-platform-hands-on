"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { addSampleCartItem, getSampleStock, sampleVariants, type SampleProduct } from "@/lib/sample-products";
import { Icon, ProductPack, yen } from "./store-ui";
import styles from "./protein-catalog.module.css";

interface CartContextValue {
  count: number;
  openCart: () => void;
  addToCart: (variant: SampleProduct, quantity?: number) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("CartProviderが必要です。");
  return cart;
}

// ページ間では共有するが、再読み込みするとリセットされる学習用カート。
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const items = sampleVariants.filter((variant) => (cart[variant.id] ?? 0) > 0);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = items.reduce((sum, variant) => sum + variant.price * cart[variant.id], 0);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function addToCart(variant: SampleProduct, quantity = 1) {
    const remaining = Math.min(10, getSampleStock(variant.id)) - (cart[variant.id] ?? 0);
    if (remaining <= 0) {
      setNotice("在庫数または同じ組み合わせの上限10点に達しています。");
      return;
    }
    setCart((current) => addSampleCartItem(current, variant.id, quantity));
    setNotice(`${variant.flavor} / ${variant.weight}を${Math.min(quantity, remaining)}点追加しました。`);
  }

  function changeQuantity(id: number, amount: number) {
    setCart((current) => ({ ...current, [id]: Math.max(0, Math.min(10, getSampleStock(id), (current[id] ?? 0) + amount)) }));
  }

  return <CartContext.Provider value={{ count, openCart: () => setOpen(true), addToCart }}>
    {children}
    <div className={styles.store}>
      <div className={styles.notice} role="status" aria-live="polite">{notice && <><Icon name="cart" size={18} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="通知を閉じる"><Icon name="close" size={16} /></button></>}</div>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="cart-title" onCancel={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <div className={styles.dialogContent}>
          <button className={styles.dialogClose} onClick={() => setOpen(false)} aria-label="閉じる"><Icon name="close" /></button>
          <div className={styles.cartContent}>
            <p className={styles.eyebrow}>YOUR SELECTION</p><h2 id="cart-title">カート <small>{count}点</small></h2>
            {items.length === 0 ? <div className={styles.emptyState}><Icon name="cart" size={36} /><h3>カートは空です</h3><button className={styles.primaryButton} onClick={() => setOpen(false)}>お買い物を続ける</button></div> : <>
              <ul className={styles.cartItems}>{items.map((variant) => <li key={variant.id}>
                <div className={styles.cartThumbnail} style={{ background: variant.background }}><ProductPack product={variant} /></div>
                <div className={styles.cartItemInfo}><b>{variant.brand} / {variant.name}</b><p>{variant.flavor} / {variant.weight}</p><strong>{yen(variant.price)}</strong>
                  <div className={styles.quantity}>
                    <button onClick={() => changeQuantity(variant.id, -1)} aria-label={`${variant.flavor} ${variant.weight}の数量を減らす`}>−</button><span>{cart[variant.id]}</span>
                    <button disabled={cart[variant.id] >= Math.min(10, getSampleStock(variant.id))} onClick={() => changeQuantity(variant.id, 1)} aria-label={`${variant.flavor} ${variant.weight}の数量を増やす`}>＋</button>
                    <button className={styles.removeButton} onClick={() => setCart((current) => ({ ...current, [variant.id]: 0 }))}>削除</button>
                  </div>
                </div>
              </li>)}</ul>
              <div className={styles.cartTotal}><span>商品合計（税込）</span><strong>{yen(total)}</strong></div>
              <p className={styles.demoNote}>学習用の仮データです。注文・決済は未実装で、再読み込みするとカートはリセットされます。</p>
              <button className={styles.primaryButton} onClick={() => setOpen(false)}>お買い物を続ける<Icon name="arrow" size={17} /></button>
            </>}
          </div>
        </div>
      </dialog>
    </div>
  </CartContext.Provider>;
}

export function StoreHeader() {
  const { count, openCart } = useCart();
  return <>
    <div className={styles.announcement}>自分に合う一杯を、ここから。<span>学習用ストア · 商品はすべてサンプルです</span></div>
    <header className={styles.header}>
      <Link href="/" className={styles.logo} aria-label="DAILY PROTEIN トップ"><span className={styles.logoMark}><Icon name="leaf" size={23} /></span><span>DAILY<span className={styles.logoLight}>PROTEIN</span><small>YOUR EVERYDAY NUTRITION</small></span></Link>
      <nav className={styles.navigation} aria-label="メインナビゲーション"><Link href="/#products">商品を探す</Link><Link href="/#protein-guide">プロテインの種類</Link></nav>
      <button className={styles.cartButton} onClick={openCart} aria-label={`カートを見る（${count}点）`}><Icon name="cart" /><span>カート</span><b>{count}</b></button>
    </header>
  </>;
}
