# stgのRDS設計方針

## 目的と範囲

ECSの商品APIで使うDB基盤をCDKで定義する。RDSは1つとし、将来の商品・注文などのデータも保存する想定。今回はstgのみが対象で、AWSへのデプロイはまだ行わない。

RDSを`DatabaseStack`に分離し、既存の`NetworkStack`のVPCとDB用サブネットを利用する。Terraform側への追加は今回の範囲外。

## 決定した設定

| 項目 | 設定 | 意図 |
| --- | --- | --- |
| DBエンジン | RDS for PostgreSQL 18.6 | 実装時点で東京リージョンのdb.t4g.microに対応する最新の正式版 |
| RDSインスタンス名 | `ecs-stg-rds` | 商品API専用という名前にせず、今後の機能拡張にも使う |
| DB名 | `ec_app` | PostgreSQL内部のデータベース名 |
| インスタンスサイズ | `db.t4g.micro`（2 vCPU・1 GiB） | 少量データのstgとして最小サイズから実測する |
| 可用性 | Single-AZ | 費用を抑え、一時停止を許容する。別AZの待機DBは作らない |
| 配置 | 既存のプライベートDBサブネット | インターネット向けのデフォルトルートを持たないサブネット |
| 公開 | パブリックアクセス無効 | インターネットから直接DBに接続させない |
| 通信許可 | 商品APIのECSタスクのSGからTCP 5432のみ | ALBやVPC全体を接続元として許可しない |
| ストレージ | gp3・初期20 GiB・自動拡張上限30 GiB | 小さく開始し、容量不足への余地を持つ |
| 保存データの暗号化 | 有効・AWS管理のRDS用KMSキー | 独自のKMSキーは作らない |
| マイナー更新 | 自動更新有効 | AWSが自動更新対象とする修正版へ更新する。メジャー更新とは別 |
| 自動バックアップ | 7日間 | 稼働中の誤操作に備える |
| 削除保護 | 無効 | stgの削除・再作成を繰り返せるようにする |
| 削除方針 | `RemovalPolicy.DESTROY` | スタック削除時にDBを削除し、最終スナップショットは作らない |
| 削除後の自動バックアップ | 残さない | 削除後の復元を前提にしない |
| 認証情報 | Secrets Manager | 管理用とアプリ用を分け、パスワードをコードに書かない |
| パスワード規則 | 管理用・アプリ用とも英数字32文字 | Secrets Managerでランダム生成する。人が覚える前提にはしない |
| 管理用ユーザー | `db_admin` | RDS作成時に作成する。商品APIには渡さない |
| アプリ用ユーザー | `product_api_app` | 今回は認証情報の保存先のみ用意。DB内のユーザー作成・権限付与は後続工程 |
| 自動ローテーション | 今回は設定しない | DB接続を完成させてから、変更後の再接続も含めて別途検証する |

DBサブネットグループには複数AZの既存DBサブネットを含めるが、Single-AZのDBインスタンスは1つだけ作成する。実際の配置AZはRDSに選択させる。

通信許可ルールはEcsStack側に作成し、EcsStackからDatabaseStackへの一方向の依存にする。DatabaseStackからEcsStackへの逆参照による循環依存を避ける。

## 認証情報と未実装の処理

管理用・アプリ用の2つのシークレットは、デプロイ時にパスワードを生成する。自動生成名を使い、固定名の削除・再作成の衝突を避ける。どちらもスタック削除時に削除する設定とする。

アプリ用シークレットを作るだけではPostgreSQL内のユーザーは作成されない。後続工程で次を実装する。

1. アプリ用ユーザーの作成と、必要な操作に限定した権限付与。
2. 商品テーブルを作成・変更するマイグレーションとサンプルデータ投入。
3. アプリ用シークレットだけをECSへ渡す設定と、Python側のDB接続処理。
4. 保存容量の監視・負荷試験・バックアップからの復元確認。

今回はECSへDB認証情報の読み取り権限を追加せず、DB向けの通信許可まで定義する。

## 運用上の注意

- DB削除時にデータを失う。7日間のバックアップ設定は、削除後にも復元できることを保証しない。
- 自動拡張の上限は後から変更可能だが、確保済みストレージはそのまま縮小できない。
- T4gはバースト型であり、高CPU負荷が続くと追加のCPUクレジット料金が発生する場合がある。2 vCPUの常時フル稼働を前提にしない。
- Secrets Managerには保存・API利用料金がある。自動ローテーションを設定する際は、関連リソースの費用も確認する。
- ECSのブルーグリーン切り替え時も、旧・新アプリは同じDBを利用する。テーブル変更は旧・新両方が使える形で段階的に行う。
- 暗号化は保存データの設定。アプリからの接続でTLSを検証する設定は、DB接続実装時に扱う。
- アプリ用ユーザーの準備にはDBへの接続が必要。隔離サブネットのDBへの初期化経路を後続工程で設計し、インターネットにDBを公開して解決しない。
- DBとシークレットの実際の削除完了は即時ではないため、削除完了を確認してから再作成する。

## 確認した公式情報

- [RDS for PostgreSQLのリリース情報](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-versions.html)
- [RDSのストレージ](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html)
- [ストレージ自動拡張](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIOPS.Autoscaling.html)
- [RDS for PostgreSQLの料金](https://aws.amazon.com/rds/postgresql/pricing/)
- [Secrets Managerの料金](https://aws.amazon.com/secrets-manager/pricing/)

2026年10月10日に、読み取り専用の`describe-orderable-db-instance-options` APIで東京リージョンの`db.t4g.micro`にPostgreSQL 18.6が対応していることを確認した。デプロイ時にも提供状況を再確認する。
