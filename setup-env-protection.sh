#!/bin/bash
# Permanent ban for .env file access attempts

echo "🔒 Setting up PERMANENT ban for .env file scanners..."

# Create custom fail2ban filter for .env access attempts
sudo tee /etc/fail2ban/filter.d/nginx-env-scanner.conf > /dev/null <<'EOF'
[Definition]
# Detect any attempt to access .env files (regardless of HTTP status)
failregex = ^<HOST>.*"(GET|POST|HEAD).*\.env.*HTTP.*"
ignoreregex =
EOF

# Create jail with PERMANENT ban (bantime = -1 means permanent)
sudo tee /etc/fail2ban/jail.d/nginx-env-scanner.conf > /dev/null <<'EOF'
[nginx-env-scanner]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
filter = nginx-env-scanner
# Ban after just 1 attempt
maxretry = 1
# Check window: 1 hour
findtime = 3600
# PERMANENT BAN (-1 = never unban automatically)
bantime = -1
# Action: ban the IP
action = iptables-multiport[name=nginx-env-scanner, port="http,https", protocol=tcp]
EOF

echo ""
echo "✅ Permanent .env scanner ban configured!"
echo ""
echo "Settings:"
echo "  - Ban after: 1 attempt (immediate)"
echo "  - Ban duration: PERMANENT (never expires)"
echo "  - Applies to: Any .env file access attempt"
echo ""

# Restart fail2ban to apply changes
sudo systemctl restart fail2ban

echo "🔍 Checking fail2ban status..."
sudo fail2ban-client status nginx-env-scanner

echo ""
echo "📋 Useful commands:"
echo "  Check banned IPs:     sudo fail2ban-client status nginx-env-scanner"
echo "  Unban an IP (if needed): sudo fail2ban-client set nginx-env-scanner unbanip <IP>"
echo "  View all bans:        sudo iptables -L -n | grep DROP"
echo ""
echo "⚠️  WARNING: Banned IPs are PERMANENT and survive reboots!"
echo "    Only unban if you're absolutely sure it's not an attacker."
echo ""
