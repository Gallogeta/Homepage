#!/bin/bash
# Setup fail2ban for Homepage protection

echo "Setting up fail2ban for Homepage security..."

# Install fail2ban
sudo apt-get update
sudo apt-get install -y fail2ban

# Create custom jail configuration for Homepage
sudo tee /etc/fail2ban/jail.d/homepage.conf > /dev/null <<'EOF'
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
findtime = 600
bantime = 3600

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
failregex = limiting requests, excess:.* by zone.*client: <HOST>
maxretry = 10
findtime = 60
bantime = 3600

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 3
findtime = 300
bantime = 7200

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
findtime = 600
bantime = 86400

[nginx-noproxy]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
findtime = 600
bantime = 86400

# Custom filter for Homepage API abuse
[homepage-api-abuse]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
failregex = ^<HOST>.*"(GET|POST|PUT|DELETE) /api/.* HTTP.*" (429|403|401)
maxretry = 10
findtime = 300
bantime = 3600

# Login/Register brute force protection
[homepage-auth-abuse]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
failregex = ^<HOST>.*"POST /(login|register|token).* HTTP.*" (401|403)
maxretry = 5
findtime = 600
bantime = 7200
EOF

# Create filter for API abuse
sudo tee /etc/fail2ban/filter.d/homepage-api-abuse.conf > /dev/null <<'EOF'
[Definition]
failregex = ^<HOST>.*"(GET|POST|PUT|DELETE) /api/.* HTTP.*" (429|403|401)
ignoreregex =
EOF

# Create filter for auth abuse
sudo tee /etc/fail2ban/filter.d/homepage-auth-abuse.conf > /dev/null <<'EOF'
[Definition]
failregex = ^<HOST>.*"POST /(login|register|token).* HTTP.*" (401|403)
ignoreregex =
EOF

# Enable and start fail2ban
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

echo ""
echo "✅ Fail2ban setup complete!"
echo ""
echo "📋 Useful fail2ban commands:"
echo "  Check status:          sudo fail2ban-client status"
echo "  Check specific jail:   sudo fail2ban-client status homepage-api-abuse"
echo "  Unban an IP:          sudo fail2ban-client set homepage-api-abuse unbanip <IP>"
echo "  List banned IPs:      sudo fail2ban-client banned"
echo ""
echo "🔒 Protection enabled for:"
echo "  - Rate limit violations (ban after 10 violations in 60s)"
echo "  - API abuse (429/403/401 errors)"
echo "  - Login brute force (5 failed attempts)"
echo "  - Bad bots and scanners"
echo "  - Proxy attempts"
echo ""
