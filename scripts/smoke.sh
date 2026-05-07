#!/usr/bin/env bash
set -euo pipefail

npm run build

port="${SMOKE_PORT:-4177}"
host="127.0.0.1"
base_url="http://${host}:${port}/schlieren-imaging-simulator/"

npx vite preview --host "${host}" --port "${port}" --strictPort >/tmp/schlieren-smoke.log 2>&1 &
server_pid=$!

cleanup() {
  kill "${server_pid}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "${base_url}" >/dev/null; then
    break
  fi
  sleep 0.25
done

curl -fsS "${base_url}" >/dev/null
npx playwright test --config playwright.config.ts
