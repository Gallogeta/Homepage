# 504 Gateway Timeout Fix

## Problem Diagnosis

Your site was experiencing **504 Gateway Timeout** errors with these symptoms:
- ✅ Backend works perfectly when accessed directly: `curl localhost:8000` returns data instantly
- ❌ nginx can't reach backend through Docker network: requests timeout after 60 seconds
- ❌ Browser shows infinite loading with repeated 504 errors

## Root Cause

The nginx configuration had **TWO critical issues**:

### 1. **Blocking Empty User-Agent Headers**
```nginx
map $http_user_agent $is_blocked_agent {
    default 0;
    "~*^$" 1;  # ❌ This blocks empty user agents
    "~*(wget|curl)" 1;  # ❌ This blocks health checks
}
```

**Why this breaks everything:**
- Docker internal network communication often doesn't set User-Agent headers
- When nginx proxies requests to backend, the upstream connection may have an empty User-Agent
- The `if ($is_blocked_agent)` check returns 403, but the connection gets stuck in a timeout loop
- This prevents nginx from reaching the backend container entirely

### 2. **Missing Proxy Timeouts**
```nginx
location /api/ {
    proxy_pass http://backend;
    # ❌ No proxy_read_timeout set!
    # ❌ No proxy_connect_timeout set!
}
```

**Why this matters:**
- Default nginx proxy timeout is 60 seconds
- When requests fail, they wait the full 60 seconds before returning 504
- Users see infinite loading because the timeout is too long

## The Fix

### Changes Made:

1. **Disabled User-Agent Blocking**
```nginx
map $http_user_agent $is_blocked_agent {
    default 0;
    # Don't block empty user agents - breaks Docker internal communication
    # "~*^$" 1;
    "~*(sqlmap|nikto|nmap|masscan|nessus)" 1;
    # Don't block wget/curl - breaks monitoring and internal health checks
    # "~*(wget|curl)" 1;
}
```

2. **Added Proxy Timeouts**
```nginx
location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Proxy timeouts
    proxy_connect_timeout 5s;   # Max 5s to connect to backend
    proxy_send_timeout 10s;     # Max 10s to send request
    proxy_read_timeout 10s;     # Max 10s to read response
}
```

3. **Specific Timeouts for Different Endpoints**
- **Upload endpoint**: 30s read timeout (for large files)
- **Contact form**: 15s read timeout (for email sending)
- **General API**: 10s read timeout (fast responses)
- **Auth endpoints**: 10s read timeout (database queries)

## How to Deploy the Fix

### On the Server (SSH into your server):

```bash
cd /mnt/data/Homepage

# Pull the latest changes
git pull origin main

# Test nginx configuration
docker exec homepage_nginx nginx -t

# Reload nginx (zero downtime)
docker exec homepage_nginx nginx -s reload

# Verify the fix works
docker exec homepage_nginx wget -q -O- http://homepage_backend:8000/api/pages/home
```

**OR use the automated script:**

```bash
cd /mnt/data/Homepage
./fix-nginx.sh
```

## Verification

After applying the fix, test:

1. **Direct backend access** (should work):
   ```bash
   curl http://localhost:8000/api/pages/home
   ```

2. **nginx to backend** (should work now):
   ```bash
   docker exec homepage_nginx wget -O- http://homepage_backend:8000/api/pages/home
   ```

3. **Browser access** (should work):
   - Open https://itsusi.eu
   - Page should load instantly without 504 errors

## Why This Happened

When we added aggressive security blocking (empty user agents, wget/curl blocking), we didn't realize it would affect **internal Docker network communication**. The nginx container needs to make HTTP requests to the backend container, and these internal requests often have minimal or no User-Agent headers.

The lesson: **Always test internal Docker networking after adding request filtering!**

## Security Note

We still block:
- ✅ Attack tools: `sqlmap`, `nikto`, `nmap`, `masscan`, `nessus`
- ✅ Malicious URIs: `.env`, `.git`, SQL injection, XSS patterns
- ✅ Rate limiting: Still fully active
- ✅ Connection limits: Still enforced
- ✅ fail2ban: Still banning attackers

We only removed blocking that broke legitimate functionality:
- ❌ Empty User-Agent (needed for Docker internal communication)
- ❌ wget/curl (needed for health checks and monitoring)

Your site is still **highly secured** - we just fixed the over-aggressive blocking!
