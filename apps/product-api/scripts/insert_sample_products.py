"""ローカルDBの商品テーブルが空の場合だけ、サンプル商品を登録する。

手動実行用。同時に複数実行しないこと。

リポジトリ直下で実行:
uv run --project apps/product-api --locked --env-file .env python \
    apps/product-api/scripts/insert_sample_products.py
"""

import os
import sys

import sqlalchemy as sa
from sqlalchemy.engine import URL
from sqlalchemy.exc import SQLAlchemyError


SAMPLE_PRODUCTS = [
    {"name": "Notebook", "price": 1000},
    {"name": "Pen", "price": 200},
]

# 既存テーブルを操作するための定義。テーブルの作成は行わない。
products = sa.table(
    "products",
    sa.column("name", sa.String(length=100)),
    sa.column("price", sa.Integer()),
    schema="public",
)


def main() -> int:
    password = os.environ.get("POSTGRES_PASSWORD")
    if not password:
        print("POSTGRES_PASSWORDが未設定です。.envを読み込んで実行してください。", file=sys.stderr)
        return 1

    # AWSへ誤投入しないよう、compose.yamlのローカルDBを接続先に固定する。
    url = URL.create(
        "postgresql+psycopg",
        username="db_admin",
        password=password,
        host="127.0.0.1",
        port=5432,
        database="ecs_app",
    )
    engine = sa.create_engine(url, connect_args={"connect_timeout": 5}, poolclass=sa.pool.NullPool)

    try:
        with engine.begin() as connection:
            count = connection.execute(sa.select(sa.func.count()).select_from(products)).scalar_one()

            if count > 0:
                print("既に商品が登録されているため、追加・変更は行いません。")
                return 0

            connection.execute(sa.insert(products), SAMPLE_PRODUCTS)

        print("サンプル商品を2件登録しました（Notebook・Pen）。")
        return 0
    except SQLAlchemyError:
        # 接続情報やパスワードを含む可能性があるため、例外の全文は表示しない。
        print(
            "商品登録に失敗しました。DBの起動・パスワード・テーブルの作成状況を確認してください。",
            file=sys.stderr,
        )
        return 1
    finally:
        engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
