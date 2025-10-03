# 🔒 Security Implementation Guide

Complete security hardening has been implemented for your Homepage. This guide will help you deploy all the security measures.

## 📋 What Has Been Implemented

### 1. ✅ Enhanced nginx Rate Limiting & DDoS Protection

**Changes made to `nginx/nginx.conf`:**

- **Connection Limiting:** Max 20 concurrent connections per IP
- **Rate Limiting Zones:**
  - General requests: 30 requests/second (burst: 50)
  - API endpoints: 10 requests/second (burst: 20)
  - Contact form: 2 requests/minute (burst: 2) - **Very strict**
  - File uploads: 5 requests/minute (burst: 3)
  - Login/Register: 5 requests/minute (burst: 5)

- **Request Size Limits:**
  - General: 10MB max
  - File uploads: 5MB max (stricter)

- **Malicious Request Blocking:**
  - Blocks `.env`, `.git`, `.svn`, `.htaccess` file access
  - Blocks SQL injection patterns (`base64_encode`, `eval()`, `gzinflate`)
  - Blocks XSS attempts (`<script>`, `<iframe>`)
  - Blocks scanning tools (sqlmap, nikto, nmap, masscan, nessus)
  - Blocks empty user agents

- **Enhanced Security Headers:**
  - `Strict-Transport-Security` with preload
  - `Permissions-Policy` (blocks geolocation, microphone, camera)
  - Enhanced CSP (Content Security Policy)
  - `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`

- **Timeout Protection:**
  - Client body timeout: 10 seconds
  - Client header timeout: 10 seconds

### 2. ✅ Fail2ban Automatic IP Blocking

**File:** `fail2ban-setup.sh`

Automatically bans IPs that show malicious behavior:

- **Rate Limit Violations:** 10 violations in 60s → Ban for 1 hour
- **API Abuse:** 10 failed requests (429/403/401) in 5 minutes → Ban for 1 hour
- **Login Brute Force:** 5 failed login attempts in 10 minutes → Ban for 2 hours
- **Bad Bots & Scanners:** 2 attempts in 10 minutes → Ban for 24 hours
- **Proxy Attempts:** 2 attempts in 10 minutes → Ban for 24 hours

### 3. ✅ Cloudflare DDoS Protection

**File:** `CLOUDFLARE_SETUP.md`

Complete guide for setting up Cloudflare as a protective layer:

- Free DDoS protection (handles attacks before they reach your server)
- Web Application Firewall (WAF)
- Bot protection
- CDN for faster global access
- Analytics and attack monitoring
- Always Online feature (serves cached content if server down)

### 4. ✅ Cloudflare nginx Integration

**File:** `setup-cloudflare-nginx.sh`

Creates `cloudflare-ips.conf` that:
- Trusts Cloudflare IP ranges
- Extracts real visitor IPs from `CF-Connecting-IP` header
- Prevents attackers from bypassing rate limiting via Cloudflare

### 5. ✅ Monitoring & Security Logging

**File:** `setup-monitoring.sh`

Creates automated monitoring tools:

**Scripts created:**
1. `analyze-logs.sh` - Comprehensive log analysis:
   - Top IPs by request count
   - Failed login attempts
   - Rate limit violations
   - Suspicious requests (vulnerability scanning)
   - Contact form activity
   - Blocked requests (403)
   - Server errors
   - API endpoint usage

2. `health-check.sh` - System health monitoring:
   - Disk usage
   - Memory usage
   - Docker container status
   - SSL certificate expiry
   - Active connections
   - System load

3. `security-alerts.sh` - Real-time threat detection:
   - Alerts on excessive failed logins
   - Alerts on attack patterns
   - Identifies top attacking IPs
   - Detects vulnerability scanning

4. `setup-cron.sh` - Automated monitoring:
   - Security alerts: Every 10 minutes
   - Health checks: Every 6 hours
   - Log analysis: Daily at midnight

## 🚀 Deployment Steps

### Step 1: Apply nginx Configuration Changes

The nginx configuration has already been updated. Deploy it:

```bash
# On your local machine
cd /home/gallo/Code/Homepage
git pull origin main

# Copy to server
scp nginx/nginx.conf gallo@192.168.0.90:/mnt/data/Homepage/nginx/nginx.conf

# On server, restart nginx
ssh gallo@192.168.0.90
cd /mnt/data/Homepage
docker-compose restart nginx

# Test that everything works
docker-compose logs nginx
```

### Step 2: Setup Fail2ban

```bash
# On server
ssh gallo@192.168.0.90

# Copy and run fail2ban setup script
cd /mnt/data/Homepage
chmod +x fail2ban-setup.sh
sudo ./fail2ban-setup.sh

# Verify fail2ban is running
sudo fail2ban-client status

# Check specific jails
sudo fail2ban-client status homepage-api-abuse
sudo fail2ban-client status homepage-auth-abuse
```

### Step 3: Setup Monitoring

```bash
# On server
ssh gallo@192.168.0.90

# Run monitoring setup
cd /mnt/data/Homepage
chmod +x setup-monitoring.sh
sudo ./setup-monitoring.sh

# Setup automated monitoring (cron jobs)
cd /mnt/data/Homepage/monitoring
sudo ./setup-cron.sh

# Test the scripts manually
sudo ./analyze-logs.sh
sudo ./health-check.sh
sudo ./security-alerts.sh
```

### Step 4: Setup Cloudflare (RECOMMENDED!)

**This provides the BEST protection against DDoS attacks!**

Follow the complete guide in `CLOUDFLARE_SETUP.md`:

1. Add domain to Cloudflare
2. Update nameservers at Hostinger
3. Configure DNS records (enable orange cloud ☁️)
4. Set SSL/TLS to "Full (strict)"
5. Enable Bot Fight Mode
6. Enable WAF
7. Configure nginx to trust Cloudflare IPs

After Cloudflare is active:

```bash
# On server
ssh gallo@192.168.0.90
cd /mnt/data/Homepage

# Run Cloudflare nginx integration
chmod +x setup-cloudflare-nginx.sh
./setup-cloudflare-nginx.sh

# Add the cloudflare-ips.conf to docker-compose.yml
# Then restart nginx
docker-compose restart nginx
```

## 📊 Monitoring & Maintenance

### Daily Checks

```bash
# View security alerts
sudo tail -f /var/log/security-alerts.log

# View health check logs
sudo tail -f /var/log/health-check.log

# Check fail2ban banned IPs
sudo fail2ban-client banned
```

### Manual Analysis

```bash
# Analyze nginx logs
sudo /mnt/data/Homepage/monitoring/analyze-logs.sh

# Check system health
sudo /mnt/data/Homepage/monitoring/health-check.sh

# Run security check
sudo /mnt/data/Homepage/monitoring/security-alerts.sh
```

### Cloudflare Dashboard

Visit https://dash.cloudflare.com to:
- View traffic analytics
- See blocked attacks
- Monitor cache hit rates
- Check security events

## 🆘 Emergency Response

### If Under Attack

1. **Check fail2ban bans:**
   ```bash
   sudo fail2ban-client status homepage-api-abuse
   ```

2. **Check attack patterns:**
   ```bash
   sudo /mnt/data/Homepage/monitoring/analyze-logs.sh
   ```

3. **Manually ban an IP:**
   ```bash
   sudo fail2ban-client set homepage-api-abuse banip <IP_ADDRESS>
   ```

4. **Enable Cloudflare "Under Attack Mode":**
   - Go to Cloudflare dashboard
   - Click "Under Attack Mode" (shows CAPTCHA to all visitors)

### If Site is Slow/Down

1. **Check Docker containers:**
   ```bash
   cd /mnt/data/Homepage
   docker-compose ps
   docker-compose logs --tail=50
   ```

2. **Check system resources:**
   ```bash
   sudo /mnt/data/Homepage/monitoring/health-check.sh
   ```

3. **Restart if needed:**
   ```bash
   cd /mnt/data/Homepage
   docker-compose restart
   ```

### If Legitimate Users are Blocked

1. **Unban IP from fail2ban:**
   ```bash
   sudo fail2ban-client set homepage-api-abuse unbanip <IP_ADDRESS>
   sudo fail2ban-client set homepage-auth-abuse unbanip <IP_ADDRESS>
   ```

2. **Whitelist IP in Cloudflare:**
   - Go to Cloudflare dashboard → Security → WAF
   - Create rule to allow specific IP

## 🎯 Security Levels Achieved

| Protection Layer | Before | After |
|-----------------|--------|-------|
| Rate Limiting | Basic | ✅ Advanced (per endpoint) |
| DDoS Protection | None | ✅ Multi-layer (nginx + Cloudflare) |
| Bot Protection | None | ✅ Automated blocking |
| Malicious Request Blocking | None | ✅ Pattern-based blocking |
| Auto IP Banning | None | ✅ Fail2ban with custom rules |
| Security Headers | Basic | ✅ Enhanced + CSP |
| Monitoring | None | ✅ Automated with alerts |
| SSL/TLS | Let's Encrypt | ✅ + Cloudflare edge |
| WAF | None | ✅ Cloudflare WAF (when enabled) |

## 📈 Expected Results

After full deployment:

✅ **DDoS attacks** blocked at Cloudflare edge (never reach your server)
✅ **Brute force attacks** automatically banned by fail2ban
✅ **Vulnerability scanners** blocked by nginx rules
✅ **Rate limit abuse** prevented with granular limits
✅ **Bot traffic** filtered out automatically
✅ **Security threats** logged and monitored
✅ **Performance** improved via Cloudflare CDN
✅ **Uptime** increased with "Always Online" feature

## ⚠️ Important Notes

1. **Cloudflare is HIGHLY RECOMMENDED** - It's free and provides the best DDoS protection
2. **Test everything** after deployment to ensure legitimate users aren't blocked
3. **Monitor logs** in the first few days to adjust rate limits if needed
4. **Keep Cloudflare IP list updated** - They occasionally add new ranges
5. **SSL certificates** auto-renew with certbot, but check expiry monthly

## 🔧 Adjusting Security Settings

### If Rate Limits Are Too Strict

Edit `/mnt/data/Homepage/nginx/nginx.conf` and adjust:

```nginx
limit_req_zone $binary_remote_addr zone=contact:10m rate=2r/m;  # Increase to 5r/m
```

Then restart nginx:
```bash
docker-compose restart nginx
```

### If Fail2ban Bans Too Aggressively

Edit `/etc/fail2ban/jail.d/homepage.conf` and increase `maxretry` or decrease `bantime`.

## 📚 Additional Resources

- Cloudflare Documentation: https://developers.cloudflare.com
- Fail2ban Manual: https://www.fail2ban.org/wiki/index.php/MANUAL_0_8
- nginx Rate Limiting: https://www.nginx.com/blog/rate-limiting-nginx/
- Security Headers: https://securityheaders.com

## ✅ Deployment Checklist

- [ ] nginx configuration deployed and tested
- [ ] Fail2ban installed and running
- [ ] Monitoring scripts setup with cron jobs
- [ ] Cloudflare configured (nameservers, DNS, SSL)
- [ ] Cloudflare nginx integration enabled
- [ ] All services tested and working
- [ ] Logs being monitored
- [ ] Emergency procedures documented and understood

---

**Your Homepage is now significantly more secure!** 🎉

The combination of nginx rate limiting, fail2ban auto-banning, and Cloudflare DDoS protection creates a multi-layered defense that will protect against:
- DDoS attacks
- Brute force attempts
- Vulnerability scanning
- Bot abuse
- Rate limit violations
- And many other common attacks

Monitor the logs, adjust as needed, and enjoy peace of mind! 🔒
