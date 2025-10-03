#!/bin/bash

# Unlock User Script
# This script unlocks a user account that has been locked due to failed login attempts

set -e

echo "🔓 User Account Unlock Tool"
echo "============================"
echo ""

# Check if username was provided
if [ -z "$1" ]; then
    echo "📋 Available users:"
    docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "SELECT username, failed_count, locked_until, role FROM users;" | while IFS='|' read -r username failed locked role; do
        if [ -n "$locked" ] && [ "$locked" != "NULL" ]; then
            locked_date=$(date -d "@$locked" 2>/dev/null || echo "Invalid date")
            echo "  🔒 $username (role: $role) - LOCKED until $locked_date (failed attempts: $failed)"
        else
            echo "  ✅ $username (role: $role) - unlocked (failed attempts: $failed)"
        fi
    done
    echo ""
    echo "Usage: $0 <username>"
    echo "Example: $0 gallo"
    exit 1
fi

USERNAME=$1

# Check if user exists
USER_EXISTS=$(docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "SELECT COUNT(*) FROM users WHERE username='$USERNAME';")

if [ "$USER_EXISTS" -eq 0 ]; then
    echo "❌ Error: User '$USERNAME' does not exist!"
    exit 1
fi

# Get current lock status
LOCK_STATUS=$(docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "SELECT failed_count, locked_until FROM users WHERE username='$USERNAME';")
FAILED_COUNT=$(echo "$LOCK_STATUS" | cut -d'|' -f1)
LOCKED_UNTIL=$(echo "$LOCK_STATUS" | cut -d'|' -f2)

echo "Current status for user '$USERNAME':"
echo "  Failed login attempts: $FAILED_COUNT"
if [ -n "$LOCKED_UNTIL" ] && [ "$LOCKED_UNTIL" != "NULL" ]; then
    LOCKED_DATE=$(date -d "@$LOCKED_UNTIL" 2>/dev/null || echo "Invalid date")
    echo "  Locked until: $LOCKED_DATE"
    echo "  Status: 🔒 LOCKED"
else
    echo "  Status: ✅ Already unlocked"
fi

echo ""
read -p "Do you want to unlock this user? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 0
fi

# Unlock the user
echo "🔓 Unlocking user '$USERNAME'..."
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "UPDATE users SET failed_count = 0, locked_until = NULL WHERE username='$USERNAME';"

# Verify unlock
NEW_STATUS=$(docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "SELECT failed_count, locked_until FROM users WHERE username='$USERNAME';")
NEW_FAILED=$(echo "$NEW_STATUS" | cut -d'|' -f1)
NEW_LOCKED=$(echo "$NEW_STATUS" | cut -d'|' -f2)

echo ""
echo "✅ User '$USERNAME' has been unlocked!"
echo "  Failed attempts reset to: $NEW_FAILED"
echo "  Lock status: Unlocked"
echo ""
echo "The user can now log in immediately."
