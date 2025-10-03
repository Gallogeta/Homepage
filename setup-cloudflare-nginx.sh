#!/bin/bash
# Update nginx configuration to work with Cloudflare

echo "📝 Updating nginx configuration for Cloudflare integration..."

# Backup current nginx.conf
NGINX_CONF="/mnt/data/Homepage/nginx/nginx.conf"
cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

# Create Cloudflare IP trust configuration
CLOUDFLARE_CONF="/mnt/data/Homepage/nginx/cloudflare-ips.conf"

cat > "$CLOUDFLARE_CONF" <<'EOF'
# Cloudflare IP ranges - Trust these IPs and get real visitor IP
# Last updated: 2024-01-15 (Update periodically from https://www.cloudflare.com/ips/)

# IPv4 ranges
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;

# IPv6 ranges
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;

# Get real IP from Cloudflare header
real_ip_header CF-Connecting-IP;
real_ip_recursive on;
EOF

echo "✅ Cloudflare IP configuration created: $CLOUDFLARE_CONF"
echo ""
echo "📋 Next steps:"
echo "1. Add this line to the http {} block in nginx.conf:"
echo "   include /etc/nginx/conf.d/cloudflare-ips.conf;"
echo ""
echo "2. Update docker-compose.yml to mount this file:"
echo "   - ./nginx/cloudflare-ips.conf:/etc/nginx/conf.d/cloudflare-ips.conf:ro"
echo ""
echo "3. Restart nginx:"
echo "   cd /mnt/data/Homepage && docker-compose restart nginx"
echo ""
echo "⚠️  IMPORTANT: Only enable this AFTER setting up Cloudflare!"
echo "   Otherwise rate limiting and blocking won't work properly."
echo ""
