import os
from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError

from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 商品テーブルのモデルはまだ未実装。自動生成との連携は後で追加する。
target_metadata = None


def get_database_url() -> URL:
    """マイグレーション専用の接続情報を環境変数から取得する。"""
    value = os.environ.get("MIGRATION_DATABASE_URL")
    if not value:
        raise RuntimeError("環境変数MIGRATION_DATABASE_URLを設定してください。")

    try:
        url = make_url(value)
    except ArgumentError:
        raise RuntimeError("MIGRATION_DATABASE_URLの形式を確認してください。") from None

    if url.drivername != "postgresql+psycopg":
        raise RuntimeError("MIGRATION_DATABASE_URLはpostgresql+psycopg://で指定してください。")
    return url


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
    engine = create_engine(get_database_url(), poolclass=pool.NullPool)

    try:
        with engine.connect() as connection:
            context.configure(connection=connection, target_metadata=target_metadata)

            with context.begin_transaction():
                context.run_migrations()
    finally:
        engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
