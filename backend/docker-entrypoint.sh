#!/bin/sh
set -eu

npx prisma migrate deploy

if [ "${SEED_DATABASE:-false}" = "true" ]; then
  npm run prisma:seed
fi

exec npm start
