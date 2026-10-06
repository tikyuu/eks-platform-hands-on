# minikubeの商品API構成図

```mermaid
flowchart TD
    M["Mac: Ingress確認 / localhost:18080/products"]
    L["Mac: HPA負荷試験 / localhost:18083/products"]
    subgraph K["minikubeクラスター"]
        D["Deployment: 商品APIのPodテンプレート"] -->|管理| R["ReplicaSet: Pod数を維持"]
        C["クラスター内からの通信"] -->|product-api:8000| S["Service: product-api / ClusterIP"]
        I["Ingress: /products → product-api:8000"]
        H["HPA: CPU目標50% / 1〜3 Pod"]
        subgraph N["Node: minikube"]
            KL["kubelet: Readiness / Liveness Probeを実行"]
            MS["Pod: metrics-server"]
            P["Pod: product-api ×1〜3"] -->|各Podで起動| A["コンテナ: 商品API"]
            T["Pod: Traefik / Ingress Controller"]
        end
        R -->|作成・補充| P
        KL -->|GET /readyz:8000| A
        KL -->|成功時にReadyと判定| P
        MS -. kubeletからCPU使用量を取得 .-> KL
        MS -. Metrics APIで指標を提供 .-> H
        S -->|ReadyなPodを接続先にする| P
        I -. ルールを読み取る .-> T
        H -->|希望Pod数を変更| D
        T -. backendを参照 .-> S
        T -->|/productsを転送| P
    end
    M -->|port-forward service/traefik:80| T
    L -->|port-forward deployment/product-api:8000| P
```

- **管理の流れ**：HPAがCPU使用率に応じてDeploymentの希望Pod数を1〜3個の範囲で変更する。DeploymentがReplicaSetを管理し、ReplicaSetが希望数のPodを保つ。
- **CPU指標の流れ**：metrics-serverがkubeletからPodのCPU使用量を収集し、HPAがMetrics API経由で参照する。目標50%は、商品APIコンテナのCPU request `100m` に対する割合。
- **通信の流れ**：Macから一時的にTraefikへport-forwardし、TraefikがIngressの `/products` ルールに従って商品APIのPodへ転送した。`curl` でHTTP 200と商品データを確認した。TraefikはbackendのServiceを参照するが、標準設定ではPod IPへ直接転送する（[Traefik公式](https://doc.traefik.io/traefik/reference/routing-configuration/kubernetes/ingress/)）。
- **Probe**：Node上のkubeletがコンテナの `/readyz` を確認する。Readinessが成功するとPodはServiceの接続先になり、Livenessが失敗し続けるとコンテナが再起動される。Service自身がチェックするわけではない。
- **配置**：商品API、Traefik、metrics-serverのPodとkubeletはminikubeのNode上で動く。kubeletはPodの中ではない。IngressやService、HPAはNodeの中に置いた箱ではなく、Kubernetesの論理的なリソース。
- **IngressとController**：Ingressは経路のルールで、Traefikはそのルールを読み取り、ローカルでは通信も中継する。AWSのALBはこの図にはない。

HPAの負荷試験ではMacから商品APIのDeploymentへ直接port-forwardし、HPAが1 Podから3 Podに増やすことを確認した。Serviceの接続先にも3つのPod IPが登録されたが、この負荷試験でTraefik経由の分散は検証していない。Pod数やIPが変わってもServiceの名前は変わらない。この試験は1 Nodeのminikube上で行ったため、複数Node・AZへの分散も検証していない。

[実行した手順に戻る](./minikubeで商品APIを動かす手順.md)
