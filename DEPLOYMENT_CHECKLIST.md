# Deployment Checklist

Before deploying to VM, make sure to update these files:

## 1. Frontend Vite Config
**File:** `frontend/vite.config.mjs`
- Change proxy from `http://localhost:8000` to `http://192.168.0.90` (or your VM IP)
- Or update the installation script to automatically configure this

## 2. Backend .env
**File:** `backend/.env`
- Verify `DATABASE_URL=sqlite:////home/gallo/Code/Homepage/backend/data/db.sqlite3` for local dev
- For Docker: should be `sqlite:////app/data/db.sqlite3`

## 3. Changes Made (Arcade Authentication)
- ✅ Backend: ROM endpoints require authentication (`/api/snes`, `/api/snes/{filename}`)
- ✅ Frontend: Arcade button hidden for guests in `App.jsx` and `MobileApp.jsx`
- ✅ Frontend: Arcade pages show login prompt when not authenticated
- ✅ Backend: Fixed logging path to work in both local and Docker environments

## 4. Testing Checklist
Before pushing to GitHub:
- [ ] Test locally: Arcade button hidden when logged out
- [ ] Test locally: Arcade button visible when logged in
- [ ] Test locally: Arcade navigation works (same tab)
- [ ] Test locally: Arcade requires authentication
- [ ] Update vite.config.mjs proxy to VM IP
- [ ] Commit and push changes
- [ ] Deploy to VM and retest

## 5. Current Local Setup
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: `/home/gallo/Code/Homepage/backend/data/db.sqlite3`
- Admin: gallo / 1234
