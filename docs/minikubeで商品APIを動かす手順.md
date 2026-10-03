# minikubeで商品APIを動かす手順

前提：Docker Desktopを起動し、`product-api:local` イメージを作成しておく（[Dockerでの商品API実行手順](./Dockerで商品APIを動かす手順.md)）。コマンドはリポジトリのルートで実行する。

## 実行した手順

1. 初回だけminikubeをインストールし、ローカルのKubernetesを起動する。

   ```bash
   brew install minikube
   minikube version
   minikube start --driver=docker
   kubectl get nodes
   ```

   `minikube` Nodeが `Ready` になった。ここでは商品APIのPodはまだ作られない。

2. Dockerで作ったイメージをminikubeから使えるようにする。

   ```bash
   minikube image load product-api:local
   minikube image ls
   ```

   一覧に `docker.io/library/product-api:local` が表示された。イメージの再ビルドやPodの起動ではない。

3. [Deploymentの設定](../k8s/local/product-api/deployment.yaml)を確認してから適用する。

   ```bash
   kubectl apply --dry-run=client -f k8s/local/product-api/deployment.yaml
   kubectl apply -f k8s/local/product-api/deployment.yaml
   kubectl get deployment product-api
   kubectl get pods -n default
   ```

   Deploymentは `READY 1/1`、商品APIのPodは `Running` になった。DeploymentがReplicaSetを作り、ReplicaSetがPodを1個維持する。

4. DashboardとAPIで動作を確認する。

   ```bash
   minikube dashboard
   ```

   `default` 名前空間でDeployment・ReplicaSet・Podを確認した。PodのログにはUvicornの起動完了が表示された。Dashboardを開いたターミナルはそのままにする。

   別のターミナルで一時的な接続を作る。

   ```bash
   kubectl port-forward deployment/product-api 8001:8000
   ```

   さらに別のターミナルでAPIを確認する。

   ```bash
   curl http://127.0.0.1:8001/products
   ```

   商品2件が返った。`port-forward` を `Ctrl+C` で止めても、Podは動き続ける。

**流れ：Dockerイメージ → minikubeへ読み込み → Deployment → ReplicaSet → Pod → 一時的な接続でAPI確認。** Serviceはまだ作成していない。
