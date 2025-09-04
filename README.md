## Project: React + Go (Fiber) Todo App

Modern Todo application with authentication, filtering, priorities, due dates, and a clean UI powered by React + Vite + Tailwind/DaisyUI and a Go/Fiber + MongoDB backend.

### Features
- JWT Authentication (register, login, me)
- Create/Update/Delete todos with:
  - priority (low/medium/high)
  - optional due date
  - timestamps (created/updated/completed)
- Search, status filter (All/Active/Completed), priority filter
- Client-side sorting (Newest/Oldest/Due soon/Due last)
- Inline edit, quick toggle complete, clear completed
- Theme-aware UI (light/dark)

### Prerequisites
- Node.js 18+
- Go 1.21+
- MongoDB instance (Atlas or local)

### Environment
Backend `.env` (root directory):
```
PORT=4000
MONGO_URI=your_mongodb_uri
JWT_SECRET=change-me
ENV=development
# Comma-separated origins; defaults to * when unset
ALLOW_ORIGINS=http://localhost:5173,https://your-frontend-domain
```

Frontend `.env` (client directory, optional):
```
VITE_API_URL=http://localhost:4000/api
```

### Run locally
Backend (from repo root):
```
go mod tidy
go run .
```

Frontend (from `client`):
```
npm install
npm run dev
```

Open http://localhost:5173

### Build
Frontend production build (from `client`):
```
npm run build
```
Backend binary (from repo root):
```
go build -o tmp/main.exe .
```

### API (summary)
- POST `/api/auth/register` { name, email, password }
- POST `/api/auth/login` { email, password }
- GET  `/api/auth/me` (Bearer token)
- GET  `/api/todos?search=&status=&priority=`
- POST `/api/todos` (Bearer token)
- PATCH `/api/todos/:id`
- DELETE `/api/todos/:id`

### Troubleshooting
- CORS: backend allows http://localhost:5173 by default
- Set `VITE_API_URL` if hosting backend elsewhere
- If styles look off, ensure Tailwind + DaisyUI versions match package.json
