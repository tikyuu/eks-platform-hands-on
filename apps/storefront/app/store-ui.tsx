import type { CSSProperties } from "react";
import type { SampleProduct } from "@/lib/sample-products";
import styles from "./protein-catalog.module.css";

export const yen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export function Icon({ name, size = 20 }: { name: "search" | "cart" | "arrow" | "close" | "filter" | "leaf"; size?: number }) {
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

export function ProductPack({ product }: { product: SampleProduct }) {
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
