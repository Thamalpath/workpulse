#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Load server-side env (DOMAIN, APP_URL, DB_*, MYSQL_*, JWT_SECRET)
set -a
# shellcheck disable=SC1091
. ./.env
set +a

echo ">>> Docker compose version"
docker compose version

echo ">>> Logging in to GHCR"
# Server needs a GitHub PAT with read:packages scope. Optional if the images are public.
if [ -n "${GHCR_USER:-}" ] && [ -n "${GHCR_PAT:-}" ]; then
  echo "${GHCR_PAT}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
fi

echo ">>> Pulling images"
docker compose pull

echo ">>> Starting database"
docker compose up -d db

echo ">>> Waiting for database to become healthy"
for attempt in $(seq 1 60); do
  if docker compose exec -T db mysqladmin ping -h 127.0.0.1 -uroot -p"${MYSQL_ROOT_PASSWORD}" --silent >/dev/null 2>&1; then
    echo ">>> Database is ready"
    break
  fi
  if [ "$attempt" -eq 60 ]; then
    echo "!!! Database did not become ready" >&2
    exit 1
  fi
  sleep 2
done

if [ "${RUN_DB_MIGRATE:-false}" = "true" ]; then
  echo ">>> Running DB migrations"
  docker compose run --rm backend npm run db:migrate
  echo ">>> Seeding database"
  docker compose run --rm backend node dist/src/seed.js
fi

echo ">>> Starting services"
docker compose up -d

echo ">>> Pruning unused images"
docker image prune -f >/dev/null 2>&1 || true

echo ">>> Deploy complete"
docker compose ps