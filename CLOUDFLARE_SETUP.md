# Cloudflare Setup Guide for Homepage Security

This guide will help you set up Cloudflare as a protective layer for your website, providing DDoS protection, WAF (Web Application Firewall), and CDN benefits.

## Step 1: Add Your Domain to Cloudflare

1. Go to https://dash.cloudflare.com and sign up/login
2. Click "Add a site" 
3. Enter your domain: `itsusi.eu`
4. Choose the **Free** plan (sufficient for our needs)
5. Click "Continue"

## Step 2: Update Nameservers at Hostinger

Cloudflare will show you two nameservers (something like):
- `adam.ns.cloudflare.com`
- `eva.ns.cloudflare.com`

**Update at Hostinger:**
1. Login to Hostinger control panel
2. Go to your domain management for `itsusi.eu`
3. Find "Nameservers" or "DNS Settings"
4. Change from Hostinger's nameservers to Cloudflare's nameservers
5. Save changes

⏰ **Wait 5-30 minutes** for DNS propagation. Cloudflare will email you when it's active.

## Step 3: Configure DNS Records in Cloudflare

Once Cloudflare is active, configure these DNS records:

### Record 1: Homepage (itsusi.eu)
- **Type:** A
- **Name:** @ (or itsusi.eu)
- **IPv4 address:** `81.197.254.238`
- **Proxy status:** 🟠 Proxied (Orange Cloud) ✅
- **TTL:** Auto

### Record 2: www subdomain
- **Type:** A
- **Name:** www
- **IPv4 address:** `81.197.254.238`
- **Proxy status:** 🟠 Proxied (Orange Cloud) ✅
- **TTL:** Auto

### Record 3: Jellyfin subdomain
- **Type:** A
- **Name:** jellyfin
- **IPv4 address:** `81.197.254.238`
- **Proxy status:** 🟠 Proxied (Orange Cloud) ✅
- **TTL:** Auto

**CRITICAL:** Make sure the cloud icon is **ORANGE** (Proxied), not grey! This enables Cloudflare protection.

## Step 4: Configure SSL/TLS Settings

1. Go to **SSL/TLS** tab in Cloudflare dashboard
2. Set encryption mode to: **Full (strict)** ✅
   - This ensures end-to-end encryption since you have valid Let's Encrypt certificates

## Step 5: Security Settings

### 5.1 Enable Bot Fight Mode
1. Go to **Security** → **Bots**
2. Enable **Bot Fight Mode** (Free plan feature)
3. This blocks known bad bots automatically

### 5.2 Configure Firewall Rules
1. Go to **Security** → **WAF**
2. Enable **Cloudflare Managed Ruleset**
3. Set security level to **Medium** (or High if you experience attacks)

### 5.3 Rate Limiting (Optional - Paid feature)
The free plan doesn't include advanced rate limiting, but your nginx configuration handles this.

### 5.4 Enable DDoS Protection
1. Go to **Security** → **DDoS**
2. Ensure **HTTP DDoS Attack Protection** is enabled (should be by default)
3. Set sensitivity to **High**

## Step 6: Performance Settings

### 6.1 Caching
1. Go to **Caching** → **Configuration**
2. Caching Level: **Standard**
3. Browser Cache TTL: **4 hours** (or 1 day)

### 6.2 Auto Minify
1. Go to **Speed** → **Optimization**
2. Enable Auto Minify for:
   - ✅ JavaScript
   - ✅ CSS
   - ✅ HTML

### 6.3 Brotli Compression
1. Go to **Speed** → **Optimization**
2. Enable **Brotli** compression

## Step 7: Update nginx Configuration (IMPORTANT!)

Since Cloudflare will proxy your traffic, nginx needs to trust Cloudflare IPs and get the real visitor IP.

Add this to your nginx configuration (already in the setup script below):

```nginx
# Trust Cloudflare IPs
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
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;

real_ip_header CF-Connecting-IP;
```

## Step 8: Test Everything

1. **Check DNS propagation:** https://dnschecker.org (search for itsusi.eu)
2. **Test SSL:** https://www.ssllabs.com/ssltest/ (should get A+ rating)
3. **Verify Cloudflare:** Check response headers should include `cf-ray` and `cf-cache-status`
4. **Test your website:** Visit https://itsusi.eu and https://jellyfin.itsusi.eu

## What You Get:

✅ **DDoS Protection:** Cloudflare blocks attacks before they reach your server
✅ **Bot Protection:** Bad bots and scrapers automatically blocked
✅ **Rate Limiting:** Combined with nginx limits for double protection
✅ **WAF:** Web Application Firewall blocks common attack patterns
✅ **CDN:** Faster loading times for global visitors
✅ **Analytics:** See attack attempts and traffic patterns in dashboard
✅ **Always Online:** Cloudflare serves cached content if your server goes down
✅ **Free SSL:** Additional SSL certificate (though you already have one)

## Security Best Practices:

1. **Never expose your origin IP** - Once Cloudflare is active, your real IP (81.197.254.238) is hidden
2. **Block non-Cloudflare traffic** - Configure firewall to only accept traffic from Cloudflare IPs (optional but recommended)
3. **Monitor Cloudflare Analytics** - Check regularly for attack patterns
4. **Enable Email Notifications** - Get alerts for security events

## Emergency: If Site Goes Down

1. **Check Cloudflare status:** https://www.cloudflarestatus.com
2. **Pause Cloudflare temporarily:** In Cloudflare dashboard, you can pause protection
3. **Check your server:** Ensure nginx and Docker containers are running

## Need Help?

- Cloudflare Docs: https://developers.cloudflare.com
- Community: https://community.cloudflare.com
- Support: https://support.cloudflare.com (even free plan has community support)
