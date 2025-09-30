import jwt
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, Body, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy import Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import bcrypt
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import logging
from fastapi.responses import JSONResponse, FileResponse
import os
from fastapi.requests import Request
from fastapi.exceptions import RequestValidationError as FastAPIRequestValidationError
from typing import Optional, List
from dotenv import load_dotenv
from sqlalchemy import func
import json
from uuid import uuid4
from fastapi.staticfiles import StaticFiles
import psutil
import socket
import httpx
from fastapi import Request as FastAPIRequest
import smtplib
from email.message import EmailMessage
import asyncio
import time

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db.sqlite3")
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
# --- Added admin and allowlist config ---
ADMIN_USER = os.getenv("ADMIN_USER", "gallo")
ALLOWED_CHECK_HOSTS = set(
    h.strip().lower()
    for h in os.getenv("ALLOWED_CHECK_HOSTS", "127.0.0.1,localhost,::1").split(",")
    if h.strip()
)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    email = Column(String, unique=True, index=True, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    failed_count = Column(Integer, default=0)
    locked_until = Column(Integer, default=0)  # epoch seconds

class Page(Base):
    __tablename__ = "pages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    content = Column(String)

class EmailToken(Base):
    __tablename__ = "email_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token = Column(String, unique=True, index=True)
    purpose = Column(String)  # verify
    expires_at = Column(Integer)  # epoch seconds
    used = Column(Boolean, default=False)

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token = Column(String, unique=True, index=True)
    expires_at = Column(Integer)  # epoch seconds
    used = Column(Boolean, default=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    ts = Column(DateTime, default=datetime.utcnow, index=True)
    event = Column(String)
    username = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    extra = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

# --- Lightweight SQLite migrations for existing DBs ---
def _sqlite_has_column(conn, table: str, column: str) -> bool:
    try:
        cur = conn.execute(f"PRAGMA table_info({table})")
        cols = [r[1] for r in cur.fetchall()]
        return column in cols
    except Exception:
        return False

def _run_sqlite_migrations_if_needed():
    if not DATABASE_URL.startswith("sqlite"):  # simple guard
        return
    raw = engine.raw_connection()
    try:
        cur = raw.cursor()
        # users.email and other new columns
        if not _sqlite_has_column(raw, 'users', 'email'):
            cur.execute("ALTER TABLE users ADD COLUMN email TEXT")
        if not _sqlite_has_column(raw, 'users', 'is_verified'):
            cur.execute("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0")
        if not _sqlite_has_column(raw, 'users', 'is_approved'):
            cur.execute("ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 1")
        if not _sqlite_has_column(raw, 'users', 'failed_count'):
            cur.execute("ALTER TABLE users ADD COLUMN failed_count INTEGER DEFAULT 0")
        if not _sqlite_has_column(raw, 'users', 'locked_until'):
            cur.execute("ALTER TABLE users ADD COLUMN locked_until INTEGER DEFAULT 0")
        # Add indexes (safe idempotent creation)
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users(username)")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users(email)")
        raw.commit()
    finally:
        raw.close()

_run_sqlite_migrations_if_needed()

# Removed duplicate/placeholder app creation above; the real instance is declared below

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

app = FastAPI()

# CORS allowlist via env, defaults to common dev origins
origins_env = os.getenv(
    "ALLOW_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
)
allow_origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads dir exists and mount it for static serving
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
MEDIA_DIR = os.path.join(UPLOADS_DIR, "media")
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Email settings
SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "25"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
MAIL_TO = os.getenv("MAIL_TO", "gallogeta@gmail.com")
MAIL_FROM = os.getenv("MAIL_FROM", SMTP_USER or "noreply@itsusi.eu")
MAIL_DEV = os.getenv("MAIL_DEV", "0") == "1"
MAILBOX_DIR = os.path.join(UPLOADS_DIR, "mailbox")
if MAIL_DEV:
    os.makedirs(MAILBOX_DIR, exist_ok=True)

def _send_email(subject: str, body: str, to: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = MAIL_FROM
    msg["To"] = to
    msg.set_content(body)
    try:
        if MAIL_DEV:
            ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S-%f")
            fname = f"mail-{ts}.eml"
            fpath = os.path.join(MAILBOX_DIR, fname)
            with open(fpath, "wb") as f:
                f.write(msg.as_bytes())
            return
        if SMTP_USER and SMTP_PASS:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
                s.starttls() if os.getenv("SMTP_TLS", "1") == "1" else None
                s.login(SMTP_USER, SMTP_PASS)
                s.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
                s.send_message(msg)
    except Exception as e:
        logging.error(f"Email send failed: {e}")

async def _verify_captcha(token: Optional[str], ip: str) -> bool:
    if not token:
        return not (TURNSTILE_SECRET or HCAPTCHA_SECRET)
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            if TURNSTILE_SECRET:
                r = await client.post(
                    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                    data={"secret": TURNSTILE_SECRET, "response": token, "remoteip": ip},
                )
                return r.json().get("success") is True
            if HCAPTCHA_SECRET:
                r = await client.post(
                    "https://hcaptcha.com/siteverify",
                    data={"secret": HCAPTCHA_SECRET, "response": token, "remoteip": ip},
                )
                return r.json().get("success") is True
    except Exception:
        pass
    return False if (TURNSTILE_SECRET or HCAPTCHA_SECRET) else True

def _epoch_now() -> int:
    return int(time.time())

def _audit(db: Session, event: str, username: Optional[str], ip: Optional[str], extra: Optional[str] = None):
    try:
        db.add(AuditLog(event=event, username=username, ip=ip, extra=extra))
        db.commit()
    except Exception:
        db.rollback()

# LibreTranslate settings
LT_URL = os.getenv("LT_URL", "https://libretranslate.com")
LT_API_KEY = os.getenv("LT_API_KEY")
MT_EMAIL = os.getenv("MT_EMAIL", MAIL_TO)

# --- Registration and security toggles ---
REGISTRATION_OPEN = os.getenv("REGISTRATION_OPEN", "1") == "1"
REGISTRATION_CODE = os.getenv("REGISTRATION_CODE")  # if set, must be provided to register
REQUIRE_EMAIL_VERIFIED_FOR_LOGIN = os.getenv("REQUIRE_EMAIL_VERIFIED_FOR_LOGIN", "1") == "1"
REQUIRE_APPROVAL_FOR_LOGIN = os.getenv("REQUIRE_APPROVAL_FOR_LOGIN", "0") == "1"

# CAPTCHA (Turnstile or hCaptcha)
TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET")
HCAPTCHA_SECRET = os.getenv("HCAPTCHA_SECRET")

# Simple in-memory rate limits (restart resets). Consider Redis for multi-instance.
from collections import deque
from threading import Lock
import time

RL_LOCK = Lock()
RATE_BUCKETS = {
    "register_ip": {},   # key: ip -> deque[timestamps]
    "login_ip": {},      # key: ip -> deque
    "login_user": {},    # key: username -> deque
}

def _now() -> float:
    return time.time()

def _rate_check(bucket: str, key: str, limit: int, window_sec: int) -> tuple[bool, int]:
    # returns (allowed, retry_after_seconds)
    now = _now()
    with RL_LOCK:
        q = RATE_BUCKETS[bucket].setdefault(key, deque())
        # purge old
        while q and (now - q[0]) > window_sec:
            q.popleft()
        if len(q) >= limit:
            retry = max(1, int(window_sec - (now - q[0])))
            return False, retry
        q.append(now)
        return True, 0

logging.basicConfig(
    filename="error.log",
    level=logging.ERROR,
    format="%(asctime)s %(levelname)s %(message)s",
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    # Use bcrypt directly instead of passlib to avoid the 72-byte bug
    import bcrypt
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password):
    # Use bcrypt directly instead of passlib to avoid the 72-byte bug
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: EmailStr
    code: Optional[str] = None
    captcha: Optional[str] = None
    
# removed duplicate imports (Body already imported above, JSONResponse already imported at top)


class PageContentRequest(BaseModel):
    content: str

# Save or update a page

@app.post("/api/pages/{name}")
def save_page(name: str, req: PageContentRequest = Body(...), db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    page = db.query(Page).filter(Page.name == name).first()
    if page:
        page.content = req.content
    else:
        page = Page(name=name, content=req.content)
        db.add(page)
    db.commit()
    return {"msg": "Page saved"}

# Get a page (public, no token required)
@app.get("/api/pages/{name}")
def get_page(name: str, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.name == name).first()
    if not page:
        return JSONResponse(status_code=404, content={"detail": "Page not found"})
    return {"name": page.name, "content": page.content}

# Get all pages (public, no token required)
@app.get("/api/pages")
def get_all_pages(db: Session = Depends(get_db)):
    """Get list of all pages"""
    pages = db.query(Page).all()
    return [{"name": page.name, "content": page.content} for page in pages]

class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str
    plan: Optional[dict] = None

@app.post("/api/contact")
def contact(req: ContactRequest):
    # Compose email
    msg = EmailMessage()
    subject = req.subject or "Website inquiry"
    if req.plan and isinstance(req.plan, dict) and req.plan.get("title"):
        subject = f"{subject} — {req.plan.get('title')}"
    msg["Subject"] = subject
    msg["From"] = MAIL_FROM
    msg["To"] = MAIL_TO
    body_lines = [
        f"From: {req.name} <{req.email}>",
        "",
        "Message:",
        req.message or "(no message)",
    ]
    if req.plan:
        body_lines += [
            "",
            "--- Selected Plan ---",
            f"Title: {req.plan.get('title')}",
            f"Price: €{req.plan.get('price')}",
            f"Timeline: {req.plan.get('timeline')}",
            f"Features: {', '.join(req.plan.get('features') or [])}",
        ]
    msg.set_content("\n".join(body_lines))
    # Send
    try:
        # Dev mailbox mode: write the message to a file and return success
        if MAIL_DEV:
            ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S-%f")
            fname = f"mail-{ts}.eml"
            fpath = os.path.join(MAILBOX_DIR, fname)
            with open(fpath, "wb") as f:
                f.write(msg.as_bytes())
            return {"ok": True, "dev_mailbox": f"/uploads/mailbox/{fname}"}

        if SMTP_USER and SMTP_PASS:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
                s.starttls() if os.getenv("SMTP_TLS", "1") == "1" else None
                s.login(SMTP_USER, SMTP_PASS)
                s.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
                s.send_message(msg)
        return {"ok": True}
    except Exception as e:
        logging.error(f"Email send failed: {e}")
        if MAIL_DEV:
            # As a last resort, still dump to mailbox on failure
            try:
                ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S-%f")
                fname = f"mail-{ts}-FAILED.eml"
                fpath = os.path.join(MAILBOX_DIR, fname)
                with open(fpath, "wb") as f:
                    f.write(msg.as_bytes())
                return {"ok": False, "dev_mailbox": f"/uploads/mailbox/{fname}", "error": str(e)}
            except Exception:
                pass
        raise HTTPException(status_code=500, detail="Failed to send email")

# --- Translation proxy (LibreTranslate) ---
class TranslateRequest(BaseModel):
    texts: List[str]
    source: Optional[str] = "en"
    target: str
    format: Optional[str] = "text"

@app.post("/api/translate")
async def translate(req: TranslateRequest):
    if not isinstance(req.texts, list) or len(req.texts) == 0:
        raise HTTPException(status_code=400, detail="texts must be a non-empty list")
    if not req.target or len(req.target) < 2:
        raise HTTPException(status_code=400, detail="target language is required")
    # Cap batch size to avoid abuse
    texts = req.texts[:500]
    params_base = {"source": req.source or "auto", "target": req.target, "format": req.format or "text"}
    if LT_API_KEY:
        params_base["api_key"] = LT_API_KEY
    providers = [LT_URL, "https://libretranslate.com", "https://libretranslate.de", "https://translate.astian.org", "https://lt.vern.cc"]
    # dedupe while preserving order
    seen = set()
    providers = [p for p in providers if (p and not (p in seen or seen.add(p)))]
    async with httpx.AsyncClient(timeout=15.0) as client:
        async def mymemory_one(t: str):
            try:
                q = t
                # MyMemory often works better with shorter chunks
                if len(q) > 1900:
                    q = q[:1890] + "…"
                params = {
                    "q": q,
                    "langpair": f"{(req.source or 'en')}|{req.target}",
                    "de": MT_EMAIL or "",
                }
                r = await client.get("https://api.mymemory.translated.net/get", params=params)
                r.raise_for_status()
                jd = r.json()
                out = (jd.get("responseData") or {}).get("translatedText")
                if isinstance(out, str) and out:
                    return out
            except Exception:
                pass
            return None
        async def do_one(t: str):
            # Try MyMemory first
            mm = await mymemory_one(t)
            if isinstance(mm, str) and mm:
                return mm
            # Fallback to LibreTranslate providers
            for base in providers:
                data = params_base.copy()
                data["q"] = t
                try:
                    r = await client.post(f"{base.rstrip('/')}/translate", data=data)
                    r.raise_for_status()
                    jd = r.json()
                    return (jd.get("translatedText") or jd.get("translated_text") or t)
                except Exception:
                    continue
            return t
        # Run in small parallel batches to be polite
        out: List[str] = []
        step = 20
        for i in range(0, len(texts), step):
            chunk = texts[i:i+step]
            res = await asyncio.gather(*[do_one(t) for t in chunk])
            out.extend(res)
    try:
        changed = any((out[i] or "") != (texts[i] or "") for i in range(len(out)))
    except Exception:
        changed = None
    return {"translations": out, "changed": changed}

# List available ROM files under backend/SNES
@app.get("/snes")
def list_snes_roms():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    rom_dir = os.path.join(base_dir, "SNES")
    if not os.path.isdir(rom_dir):
        return []
    files = []
    for name in os.listdir(rom_dir):
        path = os.path.join(rom_dir, name)
        if os.path.isfile(path) and name.lower().endswith(".nes"):
            try:
                size = os.path.getsize(path)
            except OSError:
                size = None
            files.append({"name": os.path.splitext(name)[0], "file": name, "size": size})
    # sort by name for stable ordering
    files.sort(key=lambda x: x["name"].lower())
    return files

# Serve SNES ROMs from backend/SNES/
@app.get("/snes/{filename}")
def get_snes_rom(filename: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    rom_path = os.path.join(base_dir, "SNES", filename)
    if not os.path.exists(rom_path):
        return JSONResponse(status_code=404, content={"detail": "ROM not found"})
    return FileResponse(rom_path, media_type="application/octet-stream", filename=filename)

# Media upload endpoint (video/audio); requires auth
@app.post("/api/upload/media")
def upload_media(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    # Basic validation
    content_type = (file.content_type or "").lower()
    if not (content_type.startswith("video/") or content_type.startswith("audio/")):
        raise HTTPException(status_code=400, detail="Only video/audio uploads are allowed")

    # Generate a safe unique filename preserving extension
    _, ext = os.path.splitext(file.filename or "")
    ext = (ext or "").lower()
    if len(ext) > 10:
        ext = ext[:10]
    safe_name = f"{uuid4().hex}{ext}"
    dest_path = os.path.join(MEDIA_DIR, safe_name)
    try:
        with open(dest_path, "wb") as f:
            f.write(file.file.read())
    finally:
        try:
            file.file.close()
        except Exception:
            pass

    url = f"/uploads/media/{safe_name}"
    return {"url": url, "filename": safe_name, "content_type": content_type}

# Simple health endpoint
@app.get("/health")
def health():
    return {"status": "ok"}

# --- Added helpers and admin-gated endpoints ---

def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return username
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def admin_required(username: str = Depends(get_current_user)) -> str:
    if username != ADMIN_USER:
        raise HTTPException(status_code=403, detail="Admin access required")
    return username

# System metrics and checks for sysadmin dashboard
@app.get("/metrics/system")

def system_metrics(_: str = Depends(admin_required)):
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        vmem = psutil.virtual_memory()
        disks = []
        for part in psutil.disk_partitions(all=False):
            try:
                usage = psutil.disk_usage(part.mountpoint)
                disks.append({
                    "device": part.device,
                    "mountpoint": part.mountpoint,
                    "fstype": part.fstype,
                    "total": usage.total,
                    "used": usage.used,
                    "free": usage.free,
                    "percent": usage.percent,
                })
            except Exception:
                continue
        boot_time = psutil.boot_time()
        load_avg = None
        try:
            load_avg = os.getloadavg()
        except Exception:
            pass
        return {
            "cpu_percent": cpu_percent,
            "memory": {
                "total": vmem.total,
                "available": vmem.available,
                "percent": vmem.percent,
                "used": vmem.used,
                "free": vmem.free,
            },
            "disks": disks,
            "boot_time": boot_time,
            "load_avg": load_avg,
            "pid_count": len(psutil.pids()),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics/processes")

def processes(limit: int = 15, _: str = Depends(admin_required)):
    procs = []
    for p in psutil.process_iter(attrs=["pid", "name", "username", "cpu_percent", "memory_percent"]):
        info = p.info
        procs.append(info)
    procs.sort(key=lambda x: (x.get("cpu_percent") or 0), reverse=True)
    return procs[: max(limit, 1)]

@app.get("/checks/port")

def check_port(host: str = "127.0.0.1", port: int = 22, timeout: float = 0.5, _: str = Depends(admin_required)):
    host_l = (host or "").strip().lower()
    if host_l not in ALLOWED_CHECK_HOSTS:
        raise HTTPException(status_code=400, detail="Host not allowed")
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(timeout)
        try:
            s.connect((host, port))
            return {"host": host, "port": port, "open": True}
        except Exception:
            return {"host": host, "port": port, "open": False}

@app.get("/checks/http")

async def check_http(url: str, timeout: float = 2.5, _: str = Depends(admin_required)):
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return {"url": url, "ok": False, "error": "unsupported scheme"}
        host_l = (parsed.hostname or "").strip().lower()
        if host_l not in ALLOWED_CHECK_HOSTS:
            return {"url": url, "ok": False, "error": "host not allowed"}
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            r = await client.get(url)
            return {"url": url, "status_code": r.status_code, "ok": r.is_success}
    except Exception as e:
        return {"url": url, "ok": False, "error": str(e)}

# Simple mesh topology (admin-only) for Live Infra Map
@app.get("/mesh/topology")
def mesh_topology(_: str = Depends(admin_required)):
    try:
        node_name = None
        try:
            node_name = os.uname().nodename
        except Exception:
            node_name = "localhost"
        nodes = [
            {
                "id": "self",
                "name": node_name,
                "host": "127.0.0.1",
                "http_url": "http://192.168.0.90/health",
                "ssh_port": 22,
            }
        ]
        edges = []
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _validate_username(u: str) -> str:
    u = (u or "").strip()
    if not (3 <= len(u) <= 32):
        raise HTTPException(status_code=400, detail="Username must be 3-32 characters")
    import re
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", u):
        raise HTTPException(status_code=400, detail="Username may contain letters, numbers, . _ - only")
    return u.lower()

def _validate_password(pw: str) -> None:
    pw = pw or ""
    if not (10 <= len(pw) <= 128):
        raise HTTPException(status_code=400, detail="Password must be 10-128 characters")
    classes = sum([
        any(c.islower() for c in pw),
        any(c.isupper() for c in pw),
        any(c.isdigit() for c in pw),
        any(not c.isalnum() for c in pw),
    ])
    if classes < 3:
        raise HTTPException(status_code=400, detail="Password must include 3 of: lower, upper, digit, symbol")

def _client_ip_simple(request: FastAPIRequest) -> str:
    try:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip()
    except Exception:
        pass
    try:
        return request.client.host or "0.0.0.0"
    except Exception:
        return "0.0.0.0"

@app.post("/register")
async def register(req: RegisterRequest, request: FastAPIRequest, db: Session = Depends(get_db)):
    # Gate registration
    if not REGISTRATION_OPEN and (not REGISTRATION_CODE or req.code != REGISTRATION_CODE):
        raise HTTPException(status_code=403, detail="Registration disabled")
    if REGISTRATION_CODE and req.code != REGISTRATION_CODE:
        raise HTTPException(status_code=403, detail="Invalid registration code")

    # Rate limit by IP
    ip = _client_ip_simple(request)
    ok, retry = _rate_check("register_ip", ip, limit=5, window_sec=900)  # 5 per 15 min
    if not ok:
        headers = {"Retry-After": str(retry)}
        raise HTTPException(status_code=429, detail="Too many registration attempts, please try later", headers=headers)

    uname = _validate_username(req.username)
    _validate_password(req.password)
    # CAPTCHA verify (if configured)
    if not await _verify_captcha(req.captcha, ip):
        raise HTTPException(status_code=400, detail="Captcha verification failed")
    # Case-insensitive uniqueness
    exists = db.query(User).filter(func.lower(User.username) == uname).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username already registered")
    exists_e = db.query(User).filter(func.lower(User.email) == req.email.lower()).first()
    if exists_e:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(req.password)
    new_user = User(username=uname, hashed_password=hashed_password, email=req.email, is_verified=False)
    db.add(new_user)
    db.commit()
    # Send verification email
    token = uuid4().hex + uuid4().hex
    db.add(EmailToken(user_id=new_user.id, token=token, purpose="verify", expires_at=_epoch_now() + 60 * 60 * 24))
    db.commit()
    base = str(request.base_url).rstrip("/")
    verify_link = f"{base}/verify-email?token={token}"
    body = f"Welcome {uname}!\n\nPlease verify your email by visiting:\n{verify_link}\n\nThis link expires in 24 hours."
    _send_email("Verify your email", body, req.email)
    _audit(db, "register", uname, ip, extra="pending-verify")
    return {"msg": "User registered successfully. Check your email to verify."}

# Admin endpoints
@app.get("/admin/users")
def list_users(_: str = Depends(admin_required), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"username": u.username, "email": u.email, "is_verified": u.is_verified, "is_approved": u.is_approved, "role": u.role} for u in users]

@app.post("/admin/users")
def create_user(req: dict, _: str = Depends(admin_required), db: Session = Depends(get_db)):
    uname = req.get("username")
    password = req.get("password")
    email = req.get("email", "")
    if not uname or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    if db.query(User).filter(User.username == uname).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    new_user = User(username=uname, hashed_password=hashed.decode(), email=email, is_verified=True, is_approved=True, role="user")
    db.add(new_user)
    db.commit()
    return {"msg": "User created"}

FAILED_LOGIN_WINDOW = 900  # 15 minutes
FAILED_LOGIN_LIMIT_PER_IP = 20
FAILED_LOGIN_LIMIT_PER_USER = 8

@app.post("/token")
def login(request: FastAPIRequest, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    ip = _client_ip_simple(request)
    # Rate limits for login attempts
    ok_ip, retry_ip = _rate_check("login_ip", ip, limit=FAILED_LOGIN_LIMIT_PER_IP, window_sec=FAILED_LOGIN_WINDOW)
    if not ok_ip:
        headers = {"Retry-After": str(retry_ip)}
        raise HTTPException(status_code=429, detail="Too many login attempts, slow down", headers=headers)

    uname = (form_data.username or "").strip()
    uname_l = uname.lower()
    # Case-insensitive lookup
    user = db.query(User).filter(func.lower(User.username) == uname_l).first()
    now = _epoch_now()
    if user and user.locked_until and now < int(user.locked_until or 0):
        _audit(db, "login_locked", user.username, ip)
        raise HTTPException(status_code=423, detail="Account locked. Try again later.")
    if not user or not verify_password(form_data.password, user.hashed_password):
        # per-user throttle on failures
        _rate_check("login_user", uname_l, limit=FAILED_LOGIN_LIMIT_PER_USER, window_sec=FAILED_LOGIN_WINDOW)
        if user:
            try:
                user.failed_count = int(user.failed_count or 0) + 1
                # lock after 5 failures for 10 minutes
                if user.failed_count >= 5:
                    user.locked_until = now + 10 * 60
                    user.failed_count = 0
                db.commit()
            except Exception:
                db.rollback()
        _audit(db, "login_fail", uname_l, ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    # Success: clear user failure bucket
    with RL_LOCK:
        RATE_BUCKETS["login_user"].pop(uname_l, None)
    try:
        user.failed_count = 0
        db.commit()
    except Exception:
        db.rollback()
    if REQUIRE_EMAIL_VERIFIED_FOR_LOGIN and not bool(user.is_verified):
        raise HTTPException(status_code=403, detail="Email not verified")
    if REQUIRE_APPROVAL_FOR_LOGIN and not bool(user.is_approved):
        raise HTTPException(status_code=403, detail="Account not approved")
    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    _audit(db, "login_success", user.username, ip)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token-cookie")
def login_cookie(request: FastAPIRequest, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Reuse validation from login by calling it and capturing the username again
    result = login(request, form_data, db)
    uname_l = (form_data.username or "").strip().lower()
    user = db.query(User).filter(func.lower(User.username) == uname_l).first()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    jwt_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    resp = JSONResponse(content=result)
    secure = os.getenv("COOKIE_SECURE", "1") == "1"
    same_site = os.getenv("COOKIE_SAMESITE", "Lax")
    resp.set_cookie(
        "access_token",
        jwt_token,
        httponly=True,
        secure=secure,
        samesite=same_site,
        path="/",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return resp

@app.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    t = db.query(EmailToken).filter(EmailToken.token == token, EmailToken.purpose == "verify", EmailToken.used == False).first()
    if not t or (t.expires_at and _epoch_now() > int(t.expires_at)):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == t.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    user.is_verified = True
    t.used = True
    db.commit()
    return {"ok": True, "msg": "Email verified"}

class ResetRequest(BaseModel):
    email: EmailStr
    captcha: Optional[str] = None

class ResetConfirm(BaseModel):
    token: str
    new_password: str

@app.post("/password/reset/request")
async def reset_request(req: ResetRequest, request: FastAPIRequest, db: Session = Depends(get_db)):
    ip = _client_ip_simple(request)
    if not await _verify_captcha(req.captcha, ip):
        raise HTTPException(status_code=400, detail="Captcha verification failed")
    user = db.query(User).filter(func.lower(User.email) == req.email.lower()).first()
    if not user:
        # don't reveal existence
        return {"ok": True}
    token = uuid4().hex + uuid4().hex
    db.add(PasswordResetToken(user_id=user.id, token=token, expires_at=_epoch_now() + 60 * 60))
    db.commit()
    body = f"Password reset requested for {user.username}.\nToken: {token}\n\nUse this token within 1 hour."
    _send_email("Password reset", body, user.email)
    _audit(db, "reset_request", user.username, ip)
    return {"ok": True}

@app.post("/password/reset/confirm")
def reset_confirm(req: ResetConfirm, db: Session = Depends(get_db)):
    _validate_password(req.new_password)
    t = db.query(PasswordResetToken).filter(PasswordResetToken.token == req.token, PasswordResetToken.used == False).first()
    if not t or (t.expires_at and _epoch_now() > int(t.expires_at)):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == t.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    user.hashed_password = get_password_hash(req.new_password)
    t.used = True
    db.commit()
    return {"ok": True}

@app.post("/api/admin/users/{username}/approve")
def admin_approve_user(username: str, _: str = Depends(admin_required), db: Session = Depends(get_db)):
    u = db.query(User).filter(func.lower(User.username) == username.lower()).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.is_approved = True
    db.commit()
    return {"ok": True}

@app.post("/api/admin/users/{username}/unlock")
def admin_unlock_user(username: str, _: str = Depends(admin_required), db: Session = Depends(get_db)):
    u = db.query(User).filter(func.lower(User.username) == username.lower()).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.failed_count = 0
    u.locked_until = 0
    db.commit()
    return {"ok": True}

@app.post("/api/admin/users/{username}/ban")
def admin_ban_user(username: str, _: str = Depends(admin_required), db: Session = Depends(get_db)):
    u = db.query(User).filter(func.lower(User.username) == username.lower()).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.is_approved = False
    db.commit()
    return {"ok": True}

@app.post("/api/admin/users/{username}/delete")
def admin_delete_user(username: str, _: str = Depends(admin_required), db: Session = Depends(get_db)):
    u = db.query(User).filter(func.lower(User.username) == username.lower()).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(u)
    db.commit()
    return {"ok": True}

@app.get("/me")

def read_users_me(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return {"username": username}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.exception_handler(Exception)

def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": str(exc)})

@app.exception_handler(FastAPIRequestValidationError)

def validation_exception_handler(request: Request, exc: FastAPIRequestValidationError):
    logging.error(f"Validation error: {exc.errors()}", exc_info=True)
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

# Seed default content for Media page at startup (idempotent)
@app.on_event("startup")

def seed_default_pages():
    db = SessionLocal()
    try:
        media = db.query(Page).filter(Page.name == "media").first()
        if not media:
            default_media = [
                {"type": "text", "content": "<h2>Media</h2><p>Add your videos, music, and photos here. Use the Gallery block for multiple images.</p>"}
            ]
            db.add(Page(name="media", content=json.dumps(default_media)))
            db.commit()
    finally:
        db.close()

# -------------------- Visitor tracking (public) --------------------
# Lightweight, in-memory tracking of visitors by IP with OS detection via User-Agent.
# A visitor becomes "real" after 10s connected (between first_seen and now).

from threading import Lock

VISITORS = {}
VISITOR_LOCK = Lock()

def _os_letter(user_agent: str) -> str:
    ua = (user_agent or "").lower()
    # Order matters: detect Chromebook first (CrOS)
    if "cros" in ua or "chromebook" in ua:
        return "C"
    if "windows" in ua or "win64" in ua or "win32" in ua:
        return "W"
    if "mac os x" in ua or "macintosh" in ua or "macos" in ua:
        return "M"
    if "linux" in ua and "android" not in ua:
        return "L"
    if "android" in ua:
        return "A"  # Android (optional)
    if "iphone" in ua or "ipad" in ua or "ios" in ua:
        return "I"  # iOS (optional)
    return "?"

def _client_ip(req: FastAPIRequest) -> str:
    # Prefer X-Forwarded-For when present, else fallback to client host
    try:
        xff = req.headers.get("x-forwarded-for")
        if xff:
            ip = xff.split(",")[0].strip()
            if ip:
                return ip
    except Exception:
        pass
    try:
        return req.client.host or "0.0.0.0"
    except Exception:
        return "0.0.0.0"

def _mask_ip(ip: str) -> str:
    if not ip:
        return "?"
    if ":" in ip:  # IPv6, mask last half
        parts = ip.split(":")
        return ":".join(parts[:4] + ["*"] * max(0, len(parts) - 4))
    # IPv4
    parts = ip.split(".")
    if len(parts) == 4:
        return ".".join(parts[:3] + ["*"])
    return ip

@app.post("/api/visitors/ping")
async def visitors_ping(req: FastAPIRequest):
    ip = _client_ip(req)
    ua = req.headers.get("user-agent", "")
    now = datetime.utcnow()
    with VISITOR_LOCK:
        v = VISITORS.get(ip)
        if not v:
            v = {
                "ip": ip,
                "first_seen": now,
                "last_seen": now,
                "ua": ua,
                "os": _os_letter(ua),
                "pings": 1,
            }
            VISITORS[ip] = v
        else:
            v["last_seen"] = now
            v["ua"] = ua or v.get("ua")
            v["os"] = _os_letter(ua or v.get("ua", ""))
            v["pings"] = int(v.get("pings", 0)) + 1
    dur = (now - v["first_seen"]).total_seconds()
    return {"ok": True, "ip": ip, "os": v["os"], "dur_sec": int(dur)}

@app.get("/visitors/active")
async def visitors_active(req: FastAPIRequest):
    ip_self = _client_ip(req)
    now = datetime.utcnow()
    results = []
    with VISITOR_LOCK:
        # Cleanup stale (no ping for 30s)
        stale = []
        for ip, v in VISITORS.items():
            if (now - v.get("last_seen", now)).total_seconds() > 30:
                stale.append(ip)
        for ip in stale:
            VISITORS.pop(ip, None)

        for ip, v in VISITORS.items():
            dur = (now - v.get("first_seen", now)).total_seconds()
            if dur >= 10:  # only count real visitors >10s
                results.append({
                    "ip": _mask_ip(ip),
                    "os": v.get("os") or _os_letter(v.get("ua", "")),
                    "dur_sec": int(dur),
                    "self": (ip == ip_self),
                })
    # Stable order (oldest first)
    results.sort(key=lambda x: x["dur_sec"], reverse=False)
    return {"count": len(results), "visitors": results}


@app.get("/snes")
async def list_roms():
    roms_dir = os.path.join(BASE_DIR, "SNES")
    if not os.path.exists(roms_dir):
        return {"roms": []}
    
    roms = []
    for file in os.listdir(roms_dir):
        if file.endswith('.nes'):
            file_path = os.path.join(roms_dir, file)
            size = os.path.getsize(file_path)
            # Decode file name for display
            decoded_name = file
            display_name = decoded_name.replace('.nes', '').replace('_', ' ').replace('-', ' ').title()
            roms.append({
                "name": file,
                "display_name": display_name,
                "size": size
            })
    return {"roms": roms}

@app.get("/snes/{rom_name}")
async def get_rom(rom_name: str):
    roms_dir = os.path.join(BASE_DIR, "SNES")
    file_path = os.path.join(roms_dir, rom_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="ROM not found")
    return FileResponse(file_path, media_type='application/octet-stream', filename=rom_name)

print(f"Using DATABASE_URL: {DATABASE_URL}")

@app.get("/pages/{page_key}")
async def get_page(page_key: str, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.name == page_key).first()
    if page:
        return {"content": page.content}
    default_pages = {
        "home": [
            {"type": "text", "content": "Welcome to itsusi.eu - Portfolio and Projects\n\nThis is a homepage system with backend, arcade, terminal, and more."},
        ],
        "prices": [
            {"type": "text", "content": "Pricing Information\n\nContact for custom quotes."},
        ],
        "creations": [
            {"type": "text", "content": "My Creations\n\nVarious projects and works."},
        ],
        "education": [
            {"type": "text", "content": "Education\n\nBackground and qualifications."},
        ],
        "work": [
            {"type": "text", "content": "Work History\n\nProfessional experience."},
        ],
        "gallery": [
            {"type": "text", "content": "Gallery\n\nImages and media."},
        ],
        "contact": [
            {"type": "text", "content": "Contact Information\n\nGet in touch."},
        ],
    }
    content = default_pages.get(page_key, [])
    return {"content": json.dumps(content)}

@app.get("/status")
async def get_status():
    return {"status": "online", "version": "1.0"}

@app.get("/users/me")
async def get_current_user():
    # Mock user for now
    return {"username": "guest", "email": None}
