import assert from "node:assert/strict";
import test from "node:test";
import { filterProducts, isPriceRangeInvalid, sampleProducts } from "./sample-products.ts";

const defaults = { query: "", types: [], brands: [], minPrice: "", maxPrice: "", sort: "recommended" };
const find = (changes = {}) => filterProducts(sampleProducts, { ...defaults, ...changes }).map((product) => product.id);

test("条件なしでは全6商品を表示する", () => {
  assert.deepEqual(find(), [1, 2, 3, 4, 5, 6]);
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
