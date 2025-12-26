#!/usr/bin/env bash
# Unban the given IP from all fail2ban jails and add to ignoreip
# Usage: ./unban-ip.sh <IP>

if [[ -z "$1" ]]; then
  echo "Usage: $0 <ip>" >&2
  exit 1
fi
IP=$1

# Add to fail2ban ignore list if not already present
JAIL_CONF="/etc/fail2ban/jail.d/homepage.conf"
if [[ -f "$JAIL_CONF" ]]; then
  if ! sudo grep -q "\b$IP\b" "$JAIL_CONF"; then
    echo "Adding $IP to ignoreip in $JAIL_CONF"
    sudo sed -i "s/^ignoreip = \(.*\)/ignoreip = \1 $IP/" "$JAIL_CONF" || sudo bash -c "echo -e \"\n# Added by scripts/unban-ip.sh\nignoreip = 127.0.0.1/8 ::1 $IP\" >> $JAIL_CONF"
    echo "Restarting fail2ban to apply ignoreip"
    sudo systemctl restart fail2ban
  fi
fi

# Unban from all jails
JAILS=$(sudo fail2ban-client status | sed -n '1,/Jail list:/p' | grep -oP '(?<=Jail list: ).*' | tr -d '\r' | tr ', ' '\n' | tr -d '\n')
if [[ -z "$JAILS" || "$JAILS" == "" ]]; then
  # Fallback: get list of jails by reading /etc/fail2ban/jail.d
  JAILS=$(sudo fail2ban-client status | sed -n '1p' | grep -oP '(?<=Jail list:).*' || true)
fi

# If we can't parse, just list and attempt to unban
for j in $(sudo fail2ban-client status | sed -n '1,/Jail list:/p' | sed -n '1p'); do
  :
  # noop
done

# Actually iterate jails
for j in $(sudo fail2ban-client status | awk -F': ' '/Jail list/ {print $2}' | sed 's/,/\n/g' | tr -d ' '); do
  if [[ -z "$j" ]]; then
    continue
  fi
  echo "Unbanning $IP from jail $j"
  sudo fail2ban-client set $j unbanip $IP || true
done

# Extra: query banned list to confirm
echo "Banned IPs now (homepage-sensitive):"
sudo fail2ban-client status homepage-sensitive || true

exit 0
