FROM python:3.10-slim

RUN pip install --no-cache-dir poetry

WORKDIR /app

COPY poetry.lock pyproject.toml ./
RUN poetry config virtualenvs.create false \
    && poetry install --no-root --no-interaction --no-cache

CMD ["poetry", "run", "mesa", "runserver"]
