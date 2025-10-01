# Homepage - Full-Stack Web Application# Project setup



A modern, production-ready web application with FastAPI backend, React frontend, and Nginx reverse proxy.Create a virtual environment and install backend deps:



## 🚀 Features- cd backend

- python3 -m venv venv

- ⚡ **FastAPI Backend** - High-performance Python API- source venv/bin/activate

- ⚛️ **React Frontend** - Modern SPA with Vite- pip install -r requirements.txt

- 🔒 **User Authentication** - JWT-based auth with 3-tier roles (Admin, Moderator, User)- uvicorn main:app --host 0.0.0.0 --port 8000

- 👥 **User Management** - Complete admin panel

- 📄 **Dynamic Pages** - Editable contentFrontend:

- 📊 **System Monitoring** - Real-time metrics and visitor tracking

- 🐳 **Docker Deployment** - Fully containerized- cd frontend

- 🌐 **Production Ready** - Nginx reverse proxy with SSL support- npm install

- npm run dev

## 🏁 Quick Start

## Environment variables (.env)

```bash

# Clone and startCreate `backend/.env` if needed:

git clone https://github.com/Gallogeta/Homepage.git

cd Homepage- SECRET_KEY=change_me

docker-compose up -d- DATABASE_URL=sqlite:///./db.sqlite3

- ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173

# Access at http://localhost - TURNSTILE_SECRET=<your_cloudflare_turnstile_secret>  # optional, enables CAPTCHA

``` - HCAPTCHA_SECRET=<your_hcaptcha_secret>                # optional, enables CAPTCHA

 - MAIL_DEV=1                                            # write .eml files instead of sending

## 📱 LAN Access (Mobile Testing) - SMTP_HOST=localhost                                   # SMTP settings if MAIL_DEV=0

 - SMTP_PORT=25

```bash - SMTP_USER=

# Find your IP - SMTP_PASS=

ip addr show | grep "inet " | grep -v 127.0.0.1 - MAIL_FROM=noreply@example.com



# Access from any device: http://YOUR_IPFrontend env (optional `frontend/.env`):

```

- VITE_API_BASE=http://192.168.0.90

## 🌍 Production Deployment- VITE_TURNSTILE_SITEKEY=<your_cloudflare_turnstile_sitekey>

- VITE_HCAPTCHA_SITEKEY=<your_hcaptcha_sitekey>

```bash

# On your Ubuntu server (192.168.0.90)## Endpoints

git clone https://github.com/Gallogeta/Homepage.git

cd Homepage- GET /health

sudo ./deploy.sh- POST /token (OAuth2PasswordRequestForm)

- GET /me (Authorization: Bearer <token>)

# Configure DNS: itsusi.eu → 192.168.0.90- POST /register {username,password}

# Setup SSL: sudo certbot --nginx -d itsusi.eu -d www.itsusi.eu	- Now requires email and may require CAPTCHA token if TURNSTILE_SECRET or HCAPTCHA_SECRET is set. Send as `captcha`.

```- POST /api/pages/{name} {content}

- GET /api/pages/{name}

## 👤 User Roles- GET /api/snes -> list ROMs from backend/SNES

- GET /api/snes/{filename} -> download ROM

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: manage users, change roles, edit pages, view metrics |
| **Moderator** | Limited: can only delete and ban users |
| **User** | Standard access |

## 📁 Project Structure

```
Homepage/
├── backend/          # FastAPI app
├── frontend/         # React app  
├── nginx/           # Reverse proxy config
├── docker-compose.yml
└── deploy.sh        # Production deployment
```

## 🔧 Development

```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Frontend
cd frontend && npm install && npm run dev

# View logs
docker-compose logs -f
```

## 📝 Environment Variables

Create `backend/.env`:
```bash
DATABASE_URL=sqlite:///./data/db.sqlite3
JWT_SECRET_KEY=your-secret-key
ADMIN_USER=gallo
ALLOWED_ORIGINS=*
```

## 🛠️ Useful Commands

```bash
# Restart services
docker-compose restart

# Rebuild after changes
docker-compose build --no-cache && docker-compose up -d

# Database backup
docker-compose exec backend sqlite3 /app/data/db.sqlite3 .dump > backup.sql

# View database
docker-compose exec backend sqlite3 /app/data/db.sqlite3
```

## 📚 API Documentation

Once running, visit: `http://localhost/api/docs`

## 🔒 Security

- Change `JWT_SECRET_KEY` in production
- Use HTTPS (Let's Encrypt)
- Regular backups
- Update Docker images

## 📄 License

MIT License

## 💬 Support

Issues: GitHub Issues
Contact: admin@itsusi.eu

---

Built with ❤️ for itsusi.eu
