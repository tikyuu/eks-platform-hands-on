"""DB初期設定用タスクから、商品API専用の読み取りユーザーを作成する。

先にAlembicでpublic.productsを作成しておくこと。
管理用の認証情報はDB_INIT_ADMIN_USER / DB_INIT_ADMIN_PASSWORDで受け取る。
接続先と作成するユーザーの情報はPRODUCT_API_DB_*で受け取る。
既存ユーザーは変更せず、未検証であることを示すため終了コード1で停止する。
"""

import os
import sys

import psycopg
from psycopg import sql


def main() -> int:
    required_names = (
        "PRODUCT_API_DB_HOST",
        "PRODUCT_API_DB_PORT",
        "PRODUCT_API_DB_NAME",
        "DB_INIT_ADMIN_USER",
        "DB_INIT_ADMIN_PASSWORD",
        "PRODUCT_API_DB_USER",
        "PRODUCT_API_DB_PASSWORD",
    )
    settings = {name: os.environ.get(name) for name in required_names}
    if not all(settings.values()):
        print("DB初期設定に必要な環境変数をすべて設定してください。", file=sys.stderr)
        return 1

    try:
        port = int(settings["PRODUCT_API_DB_PORT"])
        if not 1 <= port <= 65535:
            raise ValueError
    except ValueError:
        print("PRODUCT_API_DB_PORTは1〜65535の整数にしてください。", file=sys.stderr)
        return 1

    app_user = settings["PRODUCT_API_DB_USER"]
    if (
        app_user == settings["DB_INIT_ADMIN_USER"]
        or settings["PRODUCT_API_DB_PASSWORD"] == settings["DB_INIT_ADMIN_PASSWORD"]
    ):
        print("API用のユーザー名・パスワードは管理用とは別にしてください。", file=sys.stderr)
        return 1

    try:
        # 正常終了時にまとめて確定し、途中で失敗した場合は作成・権限付与を取り消す。
        with psycopg.connect(
            host=settings["PRODUCT_API_DB_HOST"],
            port=port,
            dbname=settings["PRODUCT_API_DB_NAME"],
            user=settings["DB_INIT_ADMIN_USER"],
            password=settings["DB_INIT_ADMIN_PASSWORD"],
            sslmode="require",
            connect_timeout=5,
        ) as connection:
            connection.execute("SET LOCAL statement_timeout = '10s'")
            exists = connection.execute(
                "SELECT 1 FROM pg_roles WHERE rolname = %s", (app_user,)
            ).fetchone()
            if exists:
                print(
                    "API用ユーザーは既に存在します。認証情報・権限は未検証のため、"
                    "変更せず終了します。",
                    file=sys.stderr,
                )
                return 1

            # 識別子・パスワードはSQL用の引用処理で安全に埋め込む。
            role = sql.Identifier(app_user)
            connection.execute(
                sql.SQL(
                    "CREATE ROLE {} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE "
                    "NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD {}"
                ).format(role, sql.Literal(settings["PRODUCT_API_DB_PASSWORD"]))
            )
            connection.execute(
                sql.SQL("GRANT CONNECT ON DATABASE {} TO {}").format(
                    sql.Identifier(settings["PRODUCT_API_DB_NAME"]), role
                )
            )
            connection.execute(sql.SQL("GRANT USAGE ON SCHEMA public TO {}").format(role))
            connection.execute(sql.SQL("GRANT SELECT ON TABLE public.products TO {}").format(role))

        print("API用ユーザーを作成し、商品テーブルの読み取り権限を付与しました。")
        return 0
    except psycopg.Error:
        # SQLや接続情報を含む可能性があるため、例外の全文は表示しない。
        print(
            "DBユーザー作成に失敗しました。接続先・認証情報・管理権限・SSL接続・"
            "productsテーブルの作成状況を確認してください。",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
