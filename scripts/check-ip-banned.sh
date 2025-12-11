#!/usr/bin/env bash
# Check if the given IP is banned by fail2ban and print jails that contain it
# Usage: ./check-ip-banned.sh <IP>

if [[ -z "$1" ]]; then
  echo "Usage: $0 <ip>" >&2
  exit 1
fi
IP=$1

JAILS=$(sudo fail2ban-client status | sed -n '1,20p' | awk -F': ' '/Jail list/ {print $2}' | sed 's/,/\n/g' | tr -d ' ')
if [[ -z "$JAILS" ]]; then
  echo "No jails found from fail2ban-client status output. Please check manually." && exit 0
fi

found=0
for j in $JAILS; do
  # For each jail, get the banned IPs and search
  BANNED=$(sudo fail2ban-client status $j | awk -F': ' '/Banned IP list/ {print $2}')
  if [[ -n "$BANNED" && "$BANNED" == *"$IP"* ]]; then
    echo "IP $IP is banned in jail: $j"; found=1
  fi
done
if [[ $found -eq 0 ]]; then
  echo "IP $IP not currently banned in known jails"
fi
exit 0
