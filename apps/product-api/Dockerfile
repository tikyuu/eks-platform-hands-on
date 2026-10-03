FROM python:3.13-slim

WORKDIR /code

COPY --from=ghcr.io/astral-sh/uv:0.12.17 /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./

RUN uv sync --locked --no-dev

COPY app/ ./app/

CMD ["/code/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
