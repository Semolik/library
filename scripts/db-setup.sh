#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker compose up -d

echo "Ожидание PostgreSQL (pg_isready)..."
for _ in $(seq 1 90); do
  if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "PostgreSQL готов."
    break
  fi
  sleep 1
done

npm run typeorm:migration:run --workspace @workspace/api
npm run db:seed

echo "Готово: миграции и seed выполнены."
