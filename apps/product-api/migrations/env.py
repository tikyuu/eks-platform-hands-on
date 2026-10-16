import os
from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError, SQLAlchemyError

from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 商品テーブルのモデルはまだ未実装。自動生成との連携は後で追加する。
target_metadata = None


def get_database_url() -> URL:
    """既存のURL方式を優先し、未指定なら初期設定用タスクの個別設定を読む。"""
    value = os.environ.get("MIGRATION_DATABASE_URL")
    if value:
        try:
            url = make_url(value)
        except ArgumentError:
            raise RuntimeError("MIGRATION_DATABASE_URLの形式を確認してください。") from None
        if url.drivername != "postgresql+psycopg":
            raise RuntimeError("MIGRATION_DATABASE_URLはpostgresql+psycopg://で指定してください。")
        return url

    required_names = (
        "PRODUCT_API_DB_HOST",
        "PRODUCT_API_DB_PORT",
        "PRODUCT_API_DB_NAME",
        "DB_INIT_ADMIN_USER",
        "DB_INIT_ADMIN_PASSWORD",
    )
    settings = {name: os.environ.get(name) for name in required_names}
    if not all(settings.values()):
        raise RuntimeError("MIGRATION_DATABASE_URL、またはDB接続先と管理用認証情報を設定してください。")

    try:
        port = int(settings["PRODUCT_API_DB_PORT"])
        if not 1 <= port <= 65535:
            raise ValueError
    except ValueError:
        raise RuntimeError("PRODUCT_API_DB_PORTは1〜65535の整数にしてください。") from None

    # 個別設定はAWSでの利用を想定し、既定でTLS必須。ローカルで必要な場合だけdisableを指定する。
    sslmode = os.environ.get("MIGRATION_DB_SSLMODE", "require")
    if sslmode not in ("disable", "allow", "prefer", "require", "verify-ca", "verify-full"):
        raise RuntimeError("MIGRATION_DB_SSLMODEに有効なPostgreSQLのSSLモードを指定してください。")

    return URL.create(
        "postgresql+psycopg",
        host=settings["PRODUCT_API_DB_HOST"],
        port=port,
        database=settings["PRODUCT_API_DB_NAME"],
        username=settings["DB_INIT_ADMIN_USER"],
        password=settings["DB_INIT_ADMIN_PASSWORD"],
        query={"sslmode": sslmode, "connect_timeout": "5"},
    )


def run_migrations_offline() -> None:
    """DBには接続せず、変更用のSQLを出力する。"""
    context.configure(
        url=get_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """DBに接続し、変更ファイルを適用する。"""
    engine = create_engine(get_database_url(), poolclass=pool.NullPool, hide_parameters=True)

    try:
        with engine.connect() as connection:
            context.configure(connection=connection, target_metadata=target_metadata)

            with context.begin_transaction():
                context.run_migrations()
    except SQLAlchemyError:
        raise RuntimeError(
            "マイグレーションに失敗しました。DB接続・管理権限・SSL接続・変更の適用状況を確認してください。"
        ) from None
    finally:
        engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
