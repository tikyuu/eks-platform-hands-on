import logging
from contextlib import asynccontextmanager

import sqlalchemy as sa
from fastapi import FastAPI, HTTPException, Request
from sqlalchemy.exc import InterfaceError, OperationalError, TimeoutError

from app.database import get_database_engine


logger = logging.getLogger(__name__)

# 既存の商品テーブルを読み取るための定義。ここではテーブルを作成しない。
products = sa.table(
    "products",
    sa.column("id", sa.Integer()),
    sa.column("name", sa.String(length=100)),
    sa.column("price", sa.Integer()),
    schema="public",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時にEngineを用意し、終了時に接続プールを解放する。
    engine = get_database_engine()
    app.state.database_engine = engine
    try:
        yield
    finally:
        engine.dispose()
        get_database_engine.cache_clear()


app = FastAPI(lifespan=lifespan)


@app.get("/readyz")
def readiness():
    return {"status": "ok"}


@app.get("/products")
def list_products(request: Request):
    statement = sa.select(products).order_by(products.c.id)
    try:
        with request.app.state.database_engine.connect() as connection:
            rows = connection.execute(statement).mappings().all()
            return [dict(row) for row in rows]
    except (OperationalError, InterfaceError, TimeoutError):
        # パスワードなどを含む可能性があるため、例外の全文は出力しない。
        logger.error("商品一覧の取得に失敗しました。DB接続または接続プールを確認してください。")
        raise HTTPException(
            status_code=503,
            detail="一時的に商品一覧を取得できません。時間をおいて再度お試しください。",
        ) from None
