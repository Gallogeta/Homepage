#!/usr/bin/env bash
set -euo pipefail

LOG=/var/log/homepage-startup.log
exec >>"$LOG" 2>&1

echo "=== $(date -u +"%Y-%m-%d %T %Z") Starting homepage startup script ==="

PORTS=(8000 3000 80)
COMPOSE_DIR="/home/gallo/Homepage"

if command -v "docker" >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "ERROR: neither 'docker compose' nor 'docker-compose' command available. Exiting."
  exit 1
fi

for i in {1..30}; do
  if docker version >/dev/null 2>&1; then
    echo "Docker is available"
    break
  fi
  echo "Waiting for Docker daemon... ($i/30)"
  sleep 2
done

stop_containers_exposing_port() {
  local port=$1
  mapfile -t matches < <(docker ps --format '{{.ID}} {{.Names}} {{.Ports}}' | grep -E ":${port}->|0.0.0.0:${port}->|:${port}/tcp" || true)
  for line in "${matches[@]}"; do
    cid=$(echo "$line" | awk '{print $1}')
    name=$(echo "$line" | awk '{print $2}')
    echo "Stopping container $cid ($name) exposing port $port"
    docker stop "$cid" || true
    docker rm "$cid" || true
  done
}

for p in "${PORTS[@]}"; do
  echo "--- Handling port $p ---"
  stop_containers_exposing_port "$p"
  
  if command -v fuser >/dev/null 2>&1; then
    echo "Sending TERM to processes using ${p}/tcp"
    fuser -k -TERM "${p}/tcp" || true
    sleep 2
    echo "Sending KILL to any remaining processes using ${p}/tcp"
    fuser -k -KILL "${p}/tcp" || true
  else
    pids=$(ss -ltnp 2>/dev/null | awk -v port=":${p}" '$0~port {match($0, /pid=([0-9]+)/, a); if(a[1]) print a[1]}' | sort -u)
    for pid in $pids; do
      echo "Killing pid $pid listening on port $p"
      kill -TERM "$pid" || true
      sleep 1
      kill -KILL "$pid" || true
    done
  fi
  echo "Handled port $p"
done

if [ -d "$COMPOSE_DIR" ]; then
  echo "Changing to compose dir: $COMPOSE_DIR"
  cd "$COMPOSE_DIR"
  echo "Tearing down any previous compose stack (remove-orphans)"
  $COMPOSE_CMD down --remove-orphans || true
  echo "Starting compose stack"
  $COMPOSE_CMD up -d --remove-orphans || true
  echo "Compose start complete"
else
  echo "ERROR: Compose directory $COMPOSE_DIR not found"
  exit 1
fi

echo "=== $(date -u +"%Y-%m-%d %T %Z") Homepage startup script finished ==="
