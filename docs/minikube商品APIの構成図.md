# minikubeの商品API構成図

```mermaid
flowchart TD
    M["Mac: curl localhost:18080/products"]
    subgraph K["minikubeクラスター"]
        D["Deployment: Podを1個動かす設定"] -->|管理| R["ReplicaSet: Pod数を維持"]
        C["クラスター内からの通信"] -->|product-api:8000| S["Service: product-api / ClusterIP"]
        I["Ingress: /products → product-api:8000"]
        H["HPA: Pod数を自動調整 / 未導入"]
        subgraph N["Node: minikube"]
            KL["kubelet: Readiness Probeを実行"]
            P["Pod: product-api"] -->|中で起動| A["コンテナ: 商品API"]
            T["Pod: Traefik / Ingress Controller"]
        end
        R -->|作成・補充| P
        KL -->|GET /readyz:8000| A
        KL -->|成功時にReadyと判定| P
        S -->|ReadyなPodを接続先にする| P
        I -. ルールを読み取る .-> T
        H -. 希望数を変更 .-> D
        T -. backendを参照 .-> S
        T -->|/productsを転送| P
    end
    M -->|port-forward service/traefik:80| T
```

- **管理の流れ**：DeploymentがReplicaSetを管理し、ReplicaSetが希望数のPodを保つ。Podを削除すると、新しいPodが補充される。
- **通信の流れ**：Macから一時的にTraefikへport-forwardし、TraefikがIngressの `/products` ルールに従って商品APIのPodへ転送した。`curl` でHTTP 200と商品データを確認した。TraefikはbackendのServiceを参照するが、標準設定ではPod IPへ直接転送する（[Traefik公式](https://doc.traefik.io/traefik/reference/routing-configuration/kubernetes/ingress/)）。
- **Readiness Probe（準備状態の確認）**：Node上のkubeletがコンテナの `/readyz` を確認する。成功してPodがReadyになると、Serviceの接続先として使われる。Service自身がチェックするわけではない。
- **配置**：商品APIのPodとTraefikのPod、kubeletはminikubeのNode上で動く。kubeletはPodの中ではない。IngressやServiceはNodeの中に置いた箱ではなく、Kubernetesの論理的なリソース。
- **IngressとController**：Ingressは経路のルールで、Traefikはそのルールを読み取り、ローカルでは通信も中継する。AWSのALBはこの図にはない。
- **今後の構想**：HPAは未導入。CPUなどの使用量でPod数を自動調整するには、メトリクスを取得できる構成も必要。

Podを2個に増やすとServiceの接続先も2つになる。PodのIPが変わっても、Serviceの名前は変わらない。図は現在の `replicas: 1` を示している。

[実行した手順に戻る](./minikubeで商品APIを動かす手順.md)
