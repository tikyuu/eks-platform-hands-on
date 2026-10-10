"""商品テーブルを作成する。

Revision ID: 781d7a667880
Revises: None（最初の変更）
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "781d7a667880"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """商品テーブルと、保存する値の制約を作成する。"""
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), sa.Identity(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_products"),
        sa.CheckConstraint("name ~ '[^[:space:]]'", name="ck_products_name_not_blank"),
        sa.CheckConstraint("price >= 0", name="ck_products_price_non_negative"),
    )


def downgrade() -> None:
    """商品テーブルを削除する。保存された商品データも削除される。"""
    op.drop_table("products")
