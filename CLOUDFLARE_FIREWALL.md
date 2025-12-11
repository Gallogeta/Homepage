Cloudflare Firewall rules — Block / Challenge traffic from China
===============================================================

This guide describes the minimal steps to block (or challenge) requests originating from China (CN) within Cloudflare. Blocking traffic at Cloudflare is the most effective way to keep the origin from receiving unwanted traffic.

Important: Blocking an entire country will block legitimate users located there. Use a more granular rule (path + country + IP) if you need to permit specific access.

1) Quick full-block (block all China traffic)
------------------------------------------------
- Cloudflare Dashboard → Security → WAF → Firewall Rules → Create a Firewall Rule
- Rule name: Block China (CN)
- Expression (paste): ip.geoip.country eq "CN"
- Action: Block

2) Targeted block (block China for entire site but allow specific path(s)/IP)
------------------------------------------------
- Cloudflare Dashboard → Security → WAF → Firewall Rules → Create a Firewall Rule
- Rule name: Block China except allowed IPs or paths
- Expression (example): (ip.geoip.country eq "CN" and not ip.src in {81.197.254.238} and not http.request.uri.path contains "/analytics-report")
- Action: Block

3) Allow/Exception for your IP
------------------------------------------------
- If you need to make a safe exception for your IP: Create another firewall rule *above* the block rule, e.g.:
  - Rule name: Allow Gallogeta IP
  - Expression: ip.src eq 81.197.254.238
  - Action: Allow

4) Bot management & challenge options (optional)
------------------------------------------------
- If you want to challenge unknown/bot traffic from CN rather than block outright:
  - Use expression: ip.geoip.country eq "CN"
  - Action: Challenge or JS Challenge
  - Or combine with bot scoring: (ip.geoip.country eq "CN" and cf.bot_score < 30)

5) Verify rule triggered
------------------------------------------------
- Cloudflare → Security → WAF → Firewall Events: check logs for blocked requests from the CN IP space or via the path.

6) Notes
------------------------------------------------
- If you have Cloudflare proxy enabled, we already use `CF-Connecting-IP` and `CF-IPCountry` in origin Nginx to map real IP and country.
- Keep the `scripts/update-cloudflare-ips.sh` maintained and scheduled so `set_real_ip_from` contains the latest Cloudflare IP ranges.

If you want, I can generate a complementary script you can run from your terminal to automatically add a firewall rule via the Cloudflare API, or template JSON to paste into the Cloudflare dashboard.
