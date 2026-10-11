"""ローカルDBに、商品API専用の読み取りユーザーを作成する。

リポジトリ直下で実行:
uv run --project apps/product-api --locked --env-file .env python \
    apps/product-api/scripts/create_local_app_db_user.py

POSTGRES_PASSWORDとPRODUCT_API_DB_PASSWORDの設定が必要。
既存ユーザーのパスワードや権限は変更しない。
"""

import os
import sys

import psycopg
from psycopg import sql


APP_USER = "product_api_app"


def main() -> int:
    admin_password = os.environ.get("POSTGRES_PASSWORD")
    app_password = os.environ.get("PRODUCT_API_DB_PASSWORD")
    if not admin_password or not app_password:
        print(
            "POSTGRES_PASSWORDとPRODUCT_API_DB_PASSWORDを設定して実行してください。",
            file=sys.stderr,
        )
        return 1
    if app_password == admin_password:
        print("API用パスワードは管理ユーザーとは別の値にしてください。", file=sys.stderr)
        return 1

    try:
        # compose.yamlのローカルDBに固定。AWSには接続しない。
        with psycopg.connect(
            host="127.0.0.1",
            port=5432,
            dbname="ecs_app",
            user="db_admin",
            password=admin_password,
            connect_timeout=5,
        ) as connection:
            exists = connection.execute(
                "SELECT 1 FROM pg_roles WHERE rolname = %s", (APP_USER,)
            ).fetchone()
            if exists:
                print(
                    "product_api_appは既に存在します。既存の設定を保護するため変更しません。",
                    file=sys.stderr,
                )
                return 1

            # CREATE ROLEのパスワードは、SQL用の引用処理を使って安全に埋め込む。
            connection.execute(
                sql.SQL(
                    "CREATE ROLE {} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE "
                    "NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD {}"
                ).format(sql.Identifier(APP_USER), sql.Literal(app_password))
            )
            connection.execute("GRANT CONNECT ON DATABASE ecs_app TO product_api_app")
            connection.execute("GRANT USAGE ON SCHEMA public TO product_api_app")
            connection.execute("GRANT SELECT ON TABLE public.products TO product_api_app")

        print("product_api_appを作成し、商品テーブルの読み取り権限を付けました。")
        return 0
    except psycopg.Error:
        # 接続情報やパスワードを含む例外の全文は表示しない。
        print(
            "DBユーザー作成に失敗しました。DBの起動・管理ユーザーのパスワード・"
            "productsテーブルの作成状況を確認してください。",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
