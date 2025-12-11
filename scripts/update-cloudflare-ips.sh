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

# Ensure header lines are also present
if ! grep -q "real_ip_header CF-Connecting-IP;" "$OUT_FILE"; then
  echo "real_ip_header CF-Connecting-IP;" >> "$OUT_FILE"
  echo "real_ip_recursive on;" >> "$OUT_FILE"
fi

rm -rf "$TMP_DIR"
echo "Wrote $OUT_FILE"
