# Project setup

Create a virtual environment and install backend deps:

- cd backend
- python3 -m venv venv
- source venv/bin/activate
- pip install -r requirements.txt
- uvicorn main:app --host 0.0.0.0 --port 8000

Frontend:

- cd frontend
- npm install
- npm run dev

## Environment variables (.env)

Create `backend/.env` if needed:

- SECRET_KEY=change_me
- DATABASE_URL=sqlite:///./db.sqlite3
- ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173
 - TURNSTILE_SECRET=<your_cloudflare_turnstile_secret>  # optional, enables CAPTCHA
 - HCAPTCHA_SECRET=<your_hcaptcha_secret>                # optional, enables CAPTCHA
 - MAIL_DEV=1                                            # write .eml files instead of sending
 - SMTP_HOST=localhost                                   # SMTP settings if MAIL_DEV=0
 - SMTP_PORT=25
 - SMTP_USER=
 - SMTP_PASS=
 - MAIL_FROM=noreply@example.com

Frontend env (optional `frontend/.env`):

- VITE_API_BASE=http://192.168.0.90
- VITE_TURNSTILE_SITEKEY=<your_cloudflare_turnstile_sitekey>
- VITE_HCAPTCHA_SITEKEY=<your_hcaptcha_sitekey>

## Endpoints

- GET /health
- POST /token (OAuth2PasswordRequestForm)
- GET /me (Authorization: Bearer <token>)
- POST /register {username,password}
	- Now requires email and may require CAPTCHA token if TURNSTILE_SECRET or HCAPTCHA_SECRET is set. Send as `captcha`.
- POST /api/pages/{name} {content}
- GET /api/pages/{name}
- GET /api/snes -> list ROMs from backend/SNES
- GET /api/snes/{filename} -> download ROM
