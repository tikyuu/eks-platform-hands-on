import assert from "node:assert/strict";
import test from "node:test";
import { getServingNutrition, addSampleCartItem, findVariant, getProductVariants, getSampleStock, productHref, resolveInitialVariant, sampleVariants, filterProducts, isPriceRangeInvalid, sampleProducts } from "./sample-products.ts";

const defaults = { query: "", types: [], brands: [], minPrice: "", maxPrice: "", sort: "recommended" };
const find = (changes = {}) => filterProducts(sampleProducts, { ...defaults, ...changes }).map((product) => product.id);

test("栄養成分は1食分の量に応じて換算し、元の100gあたりの値は変更しない", () => {
  const nutrition = sampleProducts[0].nutrition;
  const before = structuredClone(nutrition);
  assert.deepEqual(getServingNutrition(nutrition), { energyKcal: 79.6, proteinG: 15, fatG: 1.2, carbohydrateG: 2.2, saltG: 0.08 });
  assert.deepEqual(nutrition, before);
  assert.equal(sampleProducts[1].nutrition.servingGrams, 30);
  assert.equal(getServingNutrition(sampleProducts[1].nutrition).proteinG, 25.5);
  assert.equal(getServingNutrition(sampleProducts[5].nutrition).saltG, 0.15);
});

test("味で栄養成分が異なり、同じ味なら袋の容量で変わらない", () => {
  assert.notDeepEqual(sampleProducts[0].nutrition, sampleProducts[3].nutrition);
  assert.deepEqual(sampleProducts[0].nutrition, sampleVariants.find((variant) => variant.id === 101).nutrition);
  for (const variant of sampleVariants) {
    assert.ok(variant.nutrition.servingGrams > 0);
    for (const value of Object.values(variant.nutrition.per100g)) assert.ok(Number.isFinite(value) && value >= 0);
  }
});

test("条件なしでは全6商品を表示する", () => {
  assert.deepEqual(find(), [1, 2, 3, 4, 5, 6]);
});

test("一覧のリンクは商品と選択した味・容量を特定する", () => {
  for (const variant of sampleProducts) {
    assert.equal(resolveInitialVariant(variant.productId, String(variant.id)), variant);
    assert.equal(productHref(variant), `/products/${variant.productId}?variant=${variant.id}`);
  }
});

test("商品内の味・容量だけを選択し、存在しない組み合わせを返さない", () => {
  assert.deepEqual(getProductVariants("daily-whey").map((variant) => variant.id), [1, 4, 101]);
  assert.equal(findVariant("daily-whey", "リッチチョコレート", "3kg").price, 9980);
  assert.equal(findVariant("daily-whey", "ストロベリーミルク", "3kg"), undefined);
  assert.equal(findVariant("daily-whey", "バニラ", "1kg"), undefined);
  assert.equal(new Set(sampleVariants.map((variant) => variant.id)).size, sampleVariants.length);
});

test("不正な商品は見つからず、不正なバリエーションはその商品の既定値に戻す", () => {
  assert.equal(resolveInitialVariant("missing", "1"), undefined);
  assert.equal(resolveInitialVariant("daily-whey", "2").id, 1);
  assert.equal(resolveInitialVariant("daily-whey", "101abc").id, 1);
  assert.equal(resolveInitialVariant("pure-isolate", undefined).id, 2);
});

test("カートは味・容量を別々に保持し、同じ組み合わせは数量を合算する", () => {
  const original = { 1: 1 };
  const cart = addSampleCartItem(addSampleCartItem(original, 101, 2), 1, 2);
  assert.deepEqual(cart, { 1: 3, 101: 2 });
  assert.deepEqual(original, { 1: 1 });
});

test("在庫数・上限10点を超えず、不正な数量や存在しない商品は追加しない", () => {
  assert.equal(getSampleStock(102), 0);
  assert.deepEqual(addSampleCartItem({}, 102, 1), {});
  assert.deepEqual(addSampleCartItem({}, 999, 1), {});
  assert.deepEqual(addSampleCartItem({ 101: 2 }, 101, 2), { 101: 3 });
  assert.deepEqual(addSampleCartItem({ 1: 9 }, 1, 3), { 1: 10 });
  for (const quantity of [0, -1, 1.5, NaN, Infinity]) assert.deepEqual(addSampleCartItem({}, 1, quantity), {});
});

test("同じ項目内の複数選択はOR条件", () => {
  assert.deepEqual(find({ types: ["WPC", "WPI"] }), [1, 2, 4, 5]);
  assert.deepEqual(find({ brands: ["エクスプロージョン", "グリコ"] }), [1, 3, 4, 6]);
});

test("種類・メーカー・価格の異なる項目間はAND条件", () => {
  assert.deepEqual(find({ types: ["WPC", "WPI"], brands: ["エクスプロージョン"], maxPrice: "4000" }), [1]);
  assert.deepEqual(find({ types: ["SOY"], brands: ["エクスプロージョン"] }), []);
});

test("検索は味・メーカー・種類に対応し、全角英数と複数単語を扱える", () => {
  assert.deepEqual(find({ query: "チョコ" }), [1]);
  assert.deepEqual(find({ query: "ＷＰＩ バニラ" }), [2]);
  assert.deepEqual(find({ query: "  グリコ　プレーン  " }), [6]);
});

test("価格は境界値を含み、片側だけの指定もできる", () => {
  assert.deepEqual(find({ minPrice: "3480", maxPrice: "3980" }), [1, 3]);
  assert.deepEqual(find({ maxPrice: "2980" }), [6]);
  assert.deepEqual(find({ minPrice: "6000" }), []);
});

test("価格順に並び替えても元の仮データの順番を変えない", () => {
  assert.deepEqual(find({ sort: "price-asc" }), [6, 3, 1, 4, 2, 5]);
  assert.deepEqual(find({ sort: "price-desc" }), [5, 2, 4, 1, 3, 6]);
  assert.deepEqual(find(), [1, 2, 3, 4, 5, 6]);
});

test("負数・小数・不正値・下限と上限の逆転を拒否する", () => {
  for (const [minPrice, maxPrice] of [["-1", ""], ["1.5", ""], ["abc", ""], ["9007199254740992", ""], ["4000", "3000"]]) {
    assert.equal(isPriceRangeInvalid(minPrice, maxPrice), true);
    assert.deepEqual(find({ minPrice, maxPrice }), []);
  }
  assert.equal(isPriceRangeInvalid("0", "0"), false);
  assert.equal(isPriceRangeInvalid("", ""), false);
});
