# minikubeで商品APIを動かす手順

前提：Docker Desktopを起動しておく（[Dockerでの商品API実行手順](./Dockerで商品APIを動かす手順.md)）。コマンドはリポジトリのルートで実行する。

## 実行した手順

1. 初回だけminikubeをインストールし、ローカルのKubernetesを起動する。

   minikubeをMacにインストールする。

   ```bash
   brew install minikube
   ```

   インストールされたminikubeのバージョンを確認する。

   ```bash
   minikube version
   ```

   Dockerを使ってローカルのKubernetesクラスターを起動する。

   ```bash
   minikube start --driver=docker
   ```

   クラスターのNodeが利用可能な状態か確認する。

   ```bash
   kubectl get nodes
   ```

   `minikube` Nodeが `Ready` になった。ここでは商品APIのPodはまだ作られない。

2. `/readyz` を含む商品APIのイメージを作り、minikubeから使えるようにする。

   商品APIのコードから、`readiness-v1` タグのDockerイメージを作る。

   ```bash
   docker build -t product-api:readiness-v1 apps/product-api
   ```

   作ったイメージをminikube内でも使えるように読み込む。

   ```bash
   minikube image load product-api:readiness-v1
   ```

   読み込まれたイメージの名前とタグを確認する。

   ```bash
   minikube image ls
   ```

   一覧に `docker.io/library/product-api:readiness-v1` が表示された。この時点ではPodはまだ起動しない。

3. [Deploymentの設定](../k8s/local/product-api/deployment.yaml)を確認してから適用する。

   Deploymentを作成せず、YAMLが受け付けられるか事前確認する。

   ```bash
   kubectl apply --dry-run=client -f k8s/local/product-api/deployment.yaml
   ```

   Deploymentをクラスターに作成・更新する。

   ```bash
   kubectl apply -f k8s/local/product-api/deployment.yaml
   ```

   希望するPod数が準備できたか確認する。

   ```bash
   kubectl get deployment product-api
   ```

   `default` 名前空間に商品APIのPodが起動したか確認する。

   ```bash
   kubectl get pods -n default
   ```

   Deploymentは `READY 1/1`、商品APIのPodは `Running` になった。DeploymentがReplicaSetを作り、ReplicaSetがPodを1個維持する。

4. DashboardとAPIで動作を確認する。

   クラスター内のリソースをブラウザで確認するため、Dashboardを開く。

   ```bash
   minikube dashboard
   ```

   `default` 名前空間でDeployment・ReplicaSet・Podを確認した。PodのログにはUvicornの起動完了が表示された。Dashboardを開いたターミナルはそのままにする。

   別のターミナルで、Macの8001番から商品APIの8000番へ一時的な接続を作る。

   ```bash
   kubectl port-forward deployment/product-api 8001:8000
   ```

   さらに別のターミナルから `/products` にアクセスし、商品APIの応答を確認する。

   ```bash
   curl http://127.0.0.1:8001/products
   ```

   商品2件が返った。`port-forward` を `Ctrl+C` で止めても、Podは動き続ける。

5. [Serviceの設定](../k8s/local/product-api/service.yaml)を適用し、接続先のPodを確認する。

   Serviceを作成せず、YAMLが受け付けられるか事前確認する。

   ```bash
   kubectl apply --dry-run=client -f k8s/local/product-api/service.yaml
   ```

   Serviceをクラスターに作成・更新する。

   ```bash
   kubectl apply -f k8s/local/product-api/service.yaml
   ```

   Serviceが選ぶPodの条件と、現在の接続先を確認する。

   ```bash
   kubectl describe service product-api
   ```

   商品APIのPodのIPと配置先Nodeを確認する。

   ```bash
   kubectl get pods -l app=product-api -o wide
   ```

   `Service` の `Endpoints` に商品APIのPod IPが表示された。Serviceは `ClusterIP` 型なので、クラスター外へは公開しない。

6. Readiness Probeが動作し、Serviceに準備済みPodが登録されたことを確認する。

   Deploymentの更新が完了し、Podが利用可能になるまで待つ。

   ```bash
   kubectl rollout status deployment/product-api --timeout=60s
   ```

   商品APIのPodでReadiness Probeの設定とReady状態を確認する。

   ```bash
   kubectl describe pod -l app=product-api
   ```

   ReadyになったPodがServiceの接続先に入ったか確認する。

   ```bash
   kubectl describe service product-api
   ```

   [Deploymentの設定](../k8s/local/product-api/deployment.yaml)では、Node上のkubeletがPodの `/readyz:8000` を定期的に確認する。今回の確認ではPodが `Ready: True` になり、Serviceの `Endpoints` にそのPodのIPとポートが表示された。起動直後に一時的な接続拒否が記録されても、後から `Ready: True` になれば準備は完了している。

7. TraefikをminikubeのIngress Controllerとして有効にする。

   Traefikと従来のIngressアドオンが、既に有効か確認する。

   ```bash
   minikube addons list
   ```

   ローカルクラスターにTraefikを導入する。

   ```bash
   minikube addons enable traefik
   ```

   TraefikのPodが起動しているか確認する。

   ```bash
   kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
   ```

   TraefikのIngressClassが登録されたか確認する。

   ```bash
   kubectl get ingressclass
   ```

   TraefikのPodが `Running` になり、`traefik` IngressClassが登録された。Traefikはローカル用で、AWSのALBは作らない。

8. [Ingressの設定](../k8s/local/product-api/ingress.yaml)をminikubeに適用する。

   誤ったクラスターに適用しないよう、現在の接続先が `minikube` か確認する。

   ```bash
   kubectl config current-context
   ```

   Ingressを作成せず、YAMLが受け付けられるか事前確認する。

   ```bash
   kubectl apply --dry-run=client -f k8s/local/product-api/ingress.yaml
   ```

   `/products` の経路ルールをクラスターに作成する。

   ```bash
   kubectl apply -f k8s/local/product-api/ingress.yaml
   ```

   作成されたIngressの担当クラスなどを確認する。

   ```bash
   kubectl get ingress product-api
   ```

   接続先が `minikube` であることを確認してから適用した。Ingressの `CLASS` は `traefik`。`/products` に一致するリクエストのbackendとして `product-api:8000` を指定している。

9. Traefikを経由して商品APIへ届くか確認する。

   TraefikのHTTP入口と、外部IPが割り当てられているかを確認する。

   ```bash
   kubectl get service traefik -n kube-system
   ```

   1つ目のターミナルで、Macの18080番からTraefikのHTTP入口へ一時的な接続を作る。

   ```bash
   kubectl port-forward -n kube-system service/traefik 18080:80
   ```

   別のターミナルからTraefik経由で `/products` にアクセスし、HTTPステータスと応答本文を確認する。

   ```bash
   curl -i http://127.0.0.1:18080/products
   ```

   HTTP 200と商品データが返った。手順4は商品APIへの直接接続、こちらはTraefik経由のローカル検証で、AWSのALB経由ではない。確認後は `port-forward` を `Ctrl+C` で停止できる。

## 仕組みを図で振り返る

[商品APIの構成図](./minikube商品APIの構成図.md)に、Podの管理と、Traefikから商品APIへ届く流れを1枚で記録した。

### Podを入れ替えたとき

`kubectl delete pod` で商品APIのPodを削除すると、ReplicaSetが新しいPodを補充した。今回の観察例では、Pod IPは `10.244.0.5` から `10.244.0.6` に変わったが、ServiceのIP `10.103.36.128` は変わらず、`Endpoints` が新しいPod IPに更新された。これらのIPはminikubeが割り当てた今回の値で、再作成時に同じ値になるとは限らない。

### Podを2個に増やしたとき

Deploymentが維持する商品APIのPod数を2個に変更する。

```bash
kubectl scale deployment/product-api --replicas=2
```

Podが2個起動し、それぞれにIPが割り当てられたか確認する。

```bash
kubectl get pods -l app=product-api -o wide
```

Serviceの接続先に両方のPodが入ったか確認する。

```bash
kubectl describe service product-api
```

2つのPodが `Running` になり、Serviceの `Endpoints` に両方のPod IPが表示された。

実験で増やしたPod数を、[Deploymentの設定](../k8s/local/product-api/deployment.yaml)と同じ1個に戻す。

```bash
kubectl scale deployment/product-api --replicas=1
```

**覚えること：Deployment → ReplicaSet → Podは管理の関係。Service → Podは通信の関係。PodのIPや数が変わっても、呼び出し元は同じService名を使える。**
