#!/usr/bin/env bash
# Fetch Cloudflare IP lists and generate an nginx include file with set_real_ip_from entries
# Usage: ./scripts/update-cloudflare-ips.sh

set -euo pipefail
OUT_FILE="$(pwd)/nginx/cloudflare-ips.conf"
TMP_DIR=$(mktemp -d)

echo "Fetching Cloudflare IP lists..."
curl -fsSL https://www.cloudflare.com/ips-v4 -o "$TMP_DIR/ips-v4" || { echo "Failed to fetch ips-v4"; exit 2; }
curl -fsSL https://www.cloudflare.com/ips-v6 -o "$TMP_DIR/ips-v6" || { echo "Failed to fetch ips-v6"; exit 2; }

cat > "$OUT_FILE" <<'EOF'
# Generated Cloudflare IP list - DO NOT EDIT BY HAND
# Source: https://www.cloudflare.com/ips/
# Run scripts/update-cloudflare-ips.sh to refresh
EOF

while read -r ip; do
  [[ -z "$ip" ]] && continue
  echo "set_real_ip_from $ip;" >> "$OUT_FILE"
done < "$TMP_DIR/ips-v4"

while read -r ip; do
  [[ -z "$ip" ]] && continue
  echo "set_real_ip_from $ip;" >> "$OUT_FILE"
done < "$TMP_DIR/ips-v6"

# Note: `real_ip_header` and `real_ip_recursive` are set in nginx/nginx.conf to avoid duplication

rm -rf "$TMP_DIR"
echo "Wrote $OUT_FILE"
 
# If nginx container exists, copy the include into the running container so nginx can load it immediately
if docker ps --format '{{.Names}}' | grep -q '^homepage_nginx$'; then
  echo "Copying $OUT_FILE into running container homepage_nginx:/etc/nginx/cloudflare-ips.conf"
  docker cp "$OUT_FILE" homepage_nginx:/etc/nginx/cloudflare-ips.conf || echo "docker cp failed; you may need to copy file manually"
  echo "Testing nginx config inside container..."
  docker exec homepage_nginx nginx -t || echo "nginx test failed inside container; check logs"
  echo "Reloading nginx inside container..."
  docker exec homepage_nginx nginx -s reload || echo "nginx reload failed"
fi
