# Dockerで商品APIを動かす手順

## 用意したファイル

- `apps/product-api/Dockerfile`：Pythonと依存ライブラリを含むイメージの作り方、APIの起動方法を定義する。
- `apps/product-api/.dockerignore`：ローカルの `.venv/` や `__pycache__/` をビルド対象から除く。

## 実行した手順

以下のコマンドはリポジトリのルートで実行する。

1. イメージを作成し、ローカルのDockerで使えるようにする。

   ```bash
   docker buildx build --load -t product-api:local apps/product-api
   ```

2. イメージからコンテナを起動する。

   ```bash
   docker run --rm -p 8001:8000 product-api:local
   ```

   `8001` はMac側、`8000` はコンテナ側のポート。`--rm` は停止後にコンテナを削除する指定。

3. 別のターミナルでAPIと稼働状態を確認する。

   ```bash
   curl http://127.0.0.1:8001/products
   docker ps
   ```

   商品2件が返り、APIのログには `GET /products` と `200 OK` が表示された。

4. 起動したターミナルで `Ctrl+C` を押して停止し、後片付けを確認する。

   ```bash
   docker ps -a
   docker image ls product-api
   ```

   コンテナは消えたが、`product-api:local` イメージは残っていた。

**流れ：Dockerfile → イメージ作成 → コンテナ起動 → API確認 → コンテナ停止。**
