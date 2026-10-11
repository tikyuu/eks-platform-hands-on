"""商品APIがDBへ接続するための共通の準備。"""

import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine, URL


def get_database_url() -> URL:
    """環境変数から接続情報を取得する。パスワードはコードに保存しない。"""
    required_names = (
        "PRODUCT_API_DB_HOST",
        "PRODUCT_API_DB_PORT",
        "PRODUCT_API_DB_NAME",
        "PRODUCT_API_DB_USER",
        "PRODUCT_API_DB_PASSWORD",
    )
    settings = {}
    for name in required_names:
        value = os.environ.get(name)
        if not value:
            raise RuntimeError(f"環境変数{name}を設定してください。")
        settings[name] = value

    try:
        port = int(settings["PRODUCT_API_DB_PORT"])
    except ValueError:
        raise RuntimeError("PRODUCT_API_DB_PORTは1〜65535の整数で指定してください。") from None
    if not 1 <= port <= 65535:
        raise RuntimeError("PRODUCT_API_DB_PORTは1〜65535の整数で指定してください。")

    return URL.create(
        "postgresql+psycopg",
        host=settings["PRODUCT_API_DB_HOST"],
        port=port,
        database=settings["PRODUCT_API_DB_NAME"],
        username=settings["PRODUCT_API_DB_USER"],
        password=settings["PRODUCT_API_DB_PASSWORD"],
    )


@lru_cache(maxsize=1)
def get_database_engine() -> Engine:
    """接続を管理するEngineを、プロセス内で1つだけ用意して再利用する。"""
    return create_engine(
        get_database_url(),
        pool_pre_ping=True,
        connect_args={"connect_timeout": 5},
    )
