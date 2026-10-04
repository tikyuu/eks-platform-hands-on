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

5. [Serviceの設定](../k8s/local/product-api/service.yaml)を適用し、接続先のPodを確認する。

   ```bash
   kubectl apply --dry-run=client -f k8s/local/product-api/service.yaml
   kubectl apply -f k8s/local/product-api/service.yaml
   kubectl describe service product-api
   kubectl get pods -l app=product-api -o wide
   ```

   `Service` の `Endpoints` に商品APIのPod IPが表示された。Serviceは `ClusterIP` 型なので、クラスター外へは公開しない。

## 仕組みを図で振り返る

[商品APIの構成図](./minikube商品APIの構成図.md)に、Podを管理する流れとServiceを通る通信の流れを1枚で記録した。

### Podを入れ替えたとき

`kubectl delete pod` で商品APIのPodを削除すると、ReplicaSetが新しいPodを補充した。今回の観察例では、Pod IPは `10.244.0.5` から `10.244.0.6` に変わったが、ServiceのIP `10.103.36.128` は変わらず、`Endpoints` が新しいPod IPに更新された。これらのIPはminikubeが割り当てた今回の値で、再作成時に同じ値になるとは限らない。

### Podを2個に増やしたとき

```bash
kubectl scale deployment/product-api --replicas=2
kubectl get pods -l app=product-api -o wide
kubectl describe service product-api
```

2つのPodが `Running` になり、Serviceの `Endpoints` に両方のPod IPが表示された。実験後は次のコマンドで、[Deploymentの設定](../k8s/local/product-api/deployment.yaml)と同じ1個に戻した。

```bash
kubectl scale deployment/product-api --replicas=1
```

**覚えること：Deployment → ReplicaSet → Podは管理の関係。Service → Podは通信の関係。PodのIPや数が変わっても、呼び出し元は同じService名を使える。**
