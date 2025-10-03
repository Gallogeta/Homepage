#!/bin/bash
# Setup monitoring and security logging for Homepage

echo "🔍 Setting up monitoring and security logging..."

# Create directory for monitoring scripts
MONITOR_DIR="/mnt/data/Homepage/monitoring"
mkdir -p "$MONITOR_DIR"

# 1. Create nginx log analyzer script
cat > "$MONITOR_DIR/analyze-logs.sh" <<'EOF'
#!/bin/bash
# Analyze nginx logs for security threats

LOG_FILE="/var/log/nginx/access.log"
ERROR_LOG="/var/log/nginx/error.log"

echo "==================== NGINX LOG ANALYSIS ===================="
echo "Analysis Time: $(date)"
echo ""

# Top 10 IP addresses by request count
echo "📊 Top 10 IPs by Request Count:"
echo "================================"
awk '{print $1}' "$LOG_FILE" | sort | uniq -c | sort -rn | head -10
echo ""

# Failed login attempts (401/403 on auth endpoints)
echo "🔒 Failed Login Attempts:"
echo "========================="
grep -E "POST /(login|register|token)" "$LOG_FILE" | grep -E " (401|403) " | \
    awk '{print $1, $7, $9}' | sort | uniq -c | sort -rn
echo ""

# Rate limit violations
echo "⚠️  Rate Limit Violations:"
echo "========================="
grep "limiting requests" "$ERROR_LOG" | tail -20
echo ""

# Suspicious requests (scanning for vulnerabilities)
echo "🚨 Suspicious Requests:"
echo "======================"
grep -iE "(\.env|\.git|phpMyAdmin|wp-admin|eval\(|base64)" "$LOG_FILE" | tail -20
echo ""

# Contact form submissions
echo "📧 Contact Form Activity:"
echo "========================="
grep "POST /api/contact" "$LOG_FILE" | awk '{print $1, $4, $9}' | tail -10
echo ""

# Blocked requests (403)
echo "🚫 Blocked Requests (403):"
echo "=========================="
grep " 403 " "$LOG_FILE" | awk '{print $1, $7}' | sort | uniq -c | sort -rn | head -10
echo ""

# Server errors (500-599)
echo "❌ Server Errors:"
echo "================="
grep -E " (500|502|503|504) " "$LOG_FILE" | awk '{print $1, $7, $9}' | tail -10
echo ""

# API endpoint usage
echo "📡 API Endpoint Usage:"
echo "====================="
grep "GET /api/" "$LOG_FILE" | awk '{print $7}' | sort | uniq -c | sort -rn | head -10
echo ""

echo "==================== END OF ANALYSIS ===================="
EOF

chmod +x "$MONITOR_DIR/analyze-logs.sh"

# 2. Create system health check script
cat > "$MONITOR_DIR/health-check.sh" <<'EOF'
#!/bin/bash
# Check system health and Docker container status

echo "==================== SYSTEM HEALTH CHECK ===================="
echo "Check Time: $(date)"
echo ""

# Disk usage
echo "💾 Disk Usage:"
echo "=============="
df -h / /mnt/data
echo ""

# Memory usage
echo "🧠 Memory Usage:"
echo "================"
free -h
echo ""

# Docker container status
echo "🐳 Docker Containers:"
echo "===================="
cd /mnt/data/Homepage
docker-compose ps
echo ""

# Check if containers are healthy
echo "🏥 Container Health:"
echo "===================="
docker ps --filter "name=homepage" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Nginx status
echo "🌐 Nginx Status:"
echo "================"
docker exec homepage_nginx nginx -t 2>&1 | tail -2
echo ""

# Check SSL certificate expiry
echo "🔐 SSL Certificate Expiry:"
echo "=========================="
echo -n "itsusi.eu: "
echo | openssl s_client -servername itsusi.eu -connect itsusi.eu:443 2>/dev/null | \
    openssl x509 -noout -dates | grep "notAfter"
echo -n "jellyfin.itsusi.eu: "
echo | openssl s_client -servername jellyfin.itsusi.eu -connect jellyfin.itsusi.eu:443 2>/dev/null | \
    openssl x509 -noout -dates | grep "notAfter"
echo ""

# Network connections
echo "🔌 Active Connections:"
echo "====================="
netstat -an | grep ":443" | grep ESTABLISHED | wc -l
echo "Active HTTPS connections"
echo ""

# Load average
echo "📈 System Load:"
echo "==============="
uptime
echo ""

echo "==================== END OF HEALTH CHECK ===================="
EOF

chmod +x "$MONITOR_DIR/health-check.sh"

# 3. Create security alert script
cat > "$MONITOR_DIR/security-alerts.sh" <<'EOF'
#!/bin/bash
# Check for security issues and send alerts

ALERT_FILE="/var/log/security-alerts.log"
THRESHOLD_FAILED_LOGINS=10
THRESHOLD_403=50

LOG_FILE="/var/log/nginx/access.log"
TEMP_LOG="/tmp/nginx-check-$(date +%s).log"

# Get logs from last 10 minutes
SINCE_TIME=$(date -d '10 minutes ago' '+%d/%b/%Y:%H:%M')
grep "$SINCE_TIME" "$LOG_FILE" > "$TEMP_LOG" 2>/dev/null || touch "$TEMP_LOG"

echo "Security Check: $(date)" >> "$ALERT_FILE"

# Check for excessive failed logins
FAILED_LOGINS=$(grep -E "POST /(login|register)" "$TEMP_LOG" | grep -c " 401 ")
if [ "$FAILED_LOGINS" -gt "$THRESHOLD_FAILED_LOGINS" ]; then
    echo "⚠️  ALERT: $FAILED_LOGINS failed login attempts in last 10 minutes!" | tee -a "$ALERT_FILE"
fi

# Check for excessive 403 errors (potential attack)
BLOCKED_REQUESTS=$(grep -c " 403 " "$TEMP_LOG")
if [ "$BLOCKED_REQUESTS" -gt "$THRESHOLD_403" ]; then
    echo "⚠️  ALERT: $BLOCKED_REQUESTS blocked requests in last 10 minutes!" | tee -a "$ALERT_FILE"
    echo "Top attacking IPs:" | tee -a "$ALERT_FILE"
    grep " 403 " "$TEMP_LOG" | awk '{print $1}' | sort | uniq -c | sort -rn | head -5 | tee -a "$ALERT_FILE"
fi

# Check for vulnerability scanning
VULN_SCANS=$(grep -icE "(\.env|\.git|phpMyAdmin|wp-admin|sql)" "$TEMP_LOG")
if [ "$VULN_SCANS" -gt 5 ]; then
    echo "⚠️  ALERT: Vulnerability scanning detected! ($VULN_SCANS attempts)" | tee -a "$ALERT_FILE"
fi

rm -f "$TEMP_LOG"
echo "---" >> "$ALERT_FILE"
EOF

chmod +x "$MONITOR_DIR/security-alerts.sh"

# 4. Create cron job for automated monitoring
cat > "$MONITOR_DIR/setup-cron.sh" <<'EOF'
#!/bin/bash
# Setup cron jobs for automated monitoring

echo "Setting up automated monitoring..."

# Add cron jobs
(crontab -l 2>/dev/null || echo "") | {
    cat
    echo "# Homepage security monitoring"
    echo "*/10 * * * * /mnt/data/Homepage/monitoring/security-alerts.sh"
    echo "0 */6 * * * /mnt/data/Homepage/monitoring/health-check.sh >> /var/log/health-check.log"
    echo "0 0 * * * /mnt/data/Homepage/monitoring/analyze-logs.sh >> /var/log/log-analysis.log"
} | crontab -

echo "✅ Cron jobs added!"
echo ""
echo "Scheduled tasks:"
echo "  - Security alerts: Every 10 minutes"
echo "  - Health check: Every 6 hours"
echo "  - Log analysis: Daily at midnight"
echo ""
EOF

chmod +x "$MONITOR_DIR/setup-cron.sh"

# 5. Create log rotation configuration
cat > "$MONITOR_DIR/logrotate-config" <<'EOF'
/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi
    endscript
    postrotate
        docker exec homepage_nginx nginx -s reopen
    endscript
}

/var/log/security-alerts.log {
    weekly
    rotate 12
    compress
    delaycompress
    notifempty
    create 0640 root adm
}
EOF

echo ""
echo "✅ Monitoring scripts created in: $MONITOR_DIR"
echo ""
echo "📋 Available monitoring tools:"
echo "  1. analyze-logs.sh       - Analyze nginx logs for security issues"
echo "  2. health-check.sh       - Check system and container health"
echo "  3. security-alerts.sh    - Real-time security threat detection"
echo "  4. setup-cron.sh         - Setup automated monitoring (run once)"
echo ""
echo "🚀 To start monitoring:"
echo "  cd $MONITOR_DIR"
echo "  sudo ./setup-cron.sh"
echo ""
echo "📊 Manual analysis:"
echo "  sudo $MONITOR_DIR/analyze-logs.sh"
echo "  sudo $MONITOR_DIR/health-check.sh"
echo ""
echo "📝 View logs:"
echo "  tail -f /var/log/security-alerts.log"
echo "  tail -f /var/log/health-check.log"
echo ""
