# minikubeの商品API構成図

```mermaid
flowchart TD
    subgraph K["minikubeクラスター"]
        D["Deployment: Podを1個動かす設定"] -->|管理| R["ReplicaSet: Pod数を維持"]
        C["クラスター内からの通信"] -->|product-api:8000| S["Service: product-api / ClusterIP"]
        I["Ingress: 経路ルール / 未導入"]
        H["HPA: Pod数を自動調整 / 未導入"]
        subgraph N["Node: minikube"]
            P["Pod: product-api"] -->|中で起動| A["コンテナ: 商品API"]
            IC["Ingress Controller Pod / 未導入"]
        end
        R -->|作成・補充| P
        S -->|接続先へ転送| P
        I -. 設定を読み取る .-> IC
        H -. 希望数を変更 .-> D
        IC -. backendを参照 .-> S
    end
```

- **管理の流れ**：DeploymentがReplicaSetを管理し、ReplicaSetが希望数のPodを保つ。Podを削除すると、新しいPodが補充される。
- **通信の流れ**：Serviceが現在のPodへ通信を届ける。ServiceはPodを作らない。今回は商品APIのPod自身からService名を使って通信した。
- **配置**：PodとコンテナはNode上で動く。Deployment・ReplicaSet・Serviceはクラスター内の論理的なリソースであり、Nodeの中に置いた箱ではない。
- **破線は今後の構想**：Ingressを使うにはIngress Controllerが必要。HPAがCPUなどの使用量で増減するにはメトリクスを取得できる構成も必要。どちらもまだ作成していない。Controller自体が通信を中継するとは限らないため、外部からの通信経路は採用する方式を理解・選定してから描く。

Podを2個に増やすとServiceの接続先も2つになる。PodのIPが変わっても、Serviceの名前は変わらない。図は現在の `replicas: 1` を示している。

[実行した手順に戻る](./minikubeで商品APIを動かす手順.md)
