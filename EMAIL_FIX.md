# Email Configuration Fix

## Problem
The contact form was failing to send emails with the error:
```
5.7.0 Must issue a STARTTLS command first
```

## Root Causes
1. **Environment variable mismatch**: `.env` used `SMTP_USERNAME`/`SMTP_PASSWORD` but the code expected `SMTP_USER`/`SMTP_PASS`
2. **STARTTLS not properly executed**: The code used a ternary expression that didn't guarantee `starttls()` was called before `login()`
3. **Wrong TLS flag format**: `.env` had `SMTP_TLS=True` (string) but code expected `"1"` for truthy check

## Changes Made

### `.env` file
- Renamed `SMTP_USERNAME` → `SMTP_USER`
- Renamed `SMTP_PASSWORD` → `SMTP_PASS`
- Renamed `SMTP_SENDER_EMAIL` → `MAIL_FROM`
- Changed `SMTP_TLS=True` → `SMTP_TLS=1`
- Removed commented-out `SMTP_SSL` line

### `main.py` code
- Fixed `_send_email()` function: changed `s.starttls() if ... else None` to proper `if` block
- Fixed contact form handler: same STARTTLS fix
- Ensured `starttls()` is called **before** `login()` when `SMTP_TLS=1`

## Restart Steps (run on the VM)

```bash
cd /mnt/data/Homepage
docker-compose restart backend
# or to rebuild if needed:
# docker-compose up -d --build backend
```

## Test the Fix

1. Go to your website contact form at https://itsusi.eu
2. Fill out the form and submit
3. Check logs on the VM:
```bash
docker-compose logs -f backend | grep -i email
# or check the app log directly
```

4. You should see email send successfully, and the message should arrive at your configured recipient email

## Gmail SMTP Settings (for reference)
- **Host**: smtp.gmail.com
- **Port**: 587 (STARTTLS) or 465 (SSL/TLS)
- **Username**: Your full Gmail address (your-email@gmail.com)
- **Password**: App-specific password (not your regular Gmail password)
- **From address**: Custom domain email (must be configured as a "Send mail as" alias in Gmail settings)

## Notes
- Ensure your Gmail account has "Less secure app access" disabled and you're using an **App Password** (generated at https://myaccount.google.com/apppasswords)
- If sending from a custom domain email, make sure this is configured as a verified "Send mail as" address in Gmail → Settings → Accounts
- The current setup uses port 587 with STARTTLS, which is the recommended approach for Gmail SMTP

## Verification Checklist
- [ ] Backend container restarted
- [ ] Contact form submission succeeds (no error message)
- [ ] Email arrives at configured recipient
- [ ] Email shows correct "From" address
- [ ] No STARTTLS errors in logs
