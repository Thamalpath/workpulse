# WorkPulse

WorkPulse is a weekly team reporting and analytics platform. It has:
<<<<<<< HEAD

=======

> > > > > > > 0bbfb68b086e9df9f62222a2a1860ae2ed7d64cf

- **Frontend** — Next.js (App Router) + React 19 + Tailwind CSS 4, `frontend/`
- **Backend** — Express + TypeScript REST API, `backend/`
- **Database** — MySQL (schema applied via SQL migrations)

The AI Chat Assistant is built into the frontend and served by the backend using the Groq API.

---

## Prerequisites

- **Node.js** 20+ (includes npm)
- **MySQL** 8+ running locally (e.g. Laragon, XAMPP, MySQL Workbench, or Docker)
- **Git** (to clone the repository)

---

## 1. Installing Dependencies

Install dependencies in the **root**, **backend**, and **frontend** folders:

```bash
# Root workspace (optional helpers, if any)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

> The backend and frontend are separate packages. Both must have their own `node_modules` installed.

---

## 2. Setting Up the Database

The app expects a MySQL database. Schema is created via versioned migration files in `backend/sql/`.

### Step 1 — Create the database

Connect to MySQL with your client and create an empty database:

```sql
CREATE DATABASE IF NOT EXISTS workpulse_db;
```

### Step 2 — Configure backend `.env`

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your MySQL credentials:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=workpulse_db
DB_USERNAME=root
DB_PASSWORD=yourpassword
```

Also set:

- `JWT_SECRET` — any long random string (used to sign auth tokens)
- `FRONTEND_URL` / `CORS_ORIGIN` — `http://localhost:3000` for local dev
- `GROQ_API_KEY` — (optional, for the AI chat) your [Groq](https://console.groq.com) API key

### Step 3 — Run migrations

```bash
cd backend
npm run db:migrate
```

This applies every `.sql` file in `backend/sql/` (dropping and recreating tables, so it resets the schema).

### Step 4 — Seed demo data

```bash
npm run db:seed
```

Creates/updates roles, permissions, users, and projects. To run migrations **and** seeds in one go:

```bash
npm run db:refresh
```

---

## 3. Running the Backend

```bash
cd backend
npm run dev
```

Starts the API with hot reload at **http://localhost:5000**.

- API base URL: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health` (or the root endpoint)

### Backend scripts

| Script               | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Run dev server with hot reload (tsx watch)   |
| `npm run build`      | Compile TypeScript to `dist/`                |
| `npm start`          | Run the compiled build                       |
| `npm run db:migrate` | Apply SQL migrations                         |
| `npm run db:seed`    | Seed roles, permissions, users, and projects |
| `npm run db:refresh` | Migrate + seed                               |

---

## 4. Running the Frontend

```bash
cd frontend
cp .env.example .env
npm run dev
```

Starts the Next.js dev server at **http://localhost:3000**.

### Frontend scripts

| Script          | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start dev server (port 3000) |
| `npm run build` | Production build             |
| `npm start`     | Serve the production build   |
| `npm run lint`  | Run ESLint                   |

---

## 5. Running Everything (quick checklist)

1. MySQL is running and `workpulse_db` exists.
2. Backend `.env` and frontend `.env` are configured.
3. Terminal 1 — backend:

   ```bash
   cd backend
   npm run db:migrate && npm run db:seed
   npm run dev
   ```

4. Terminal 2 — frontend:

   ```bash
   cd frontend
   npm run dev
   ```

5. Open **http://localhost:3000**.

---

## Default Logins

| Name                   | Username   | Email                  | Role        | Password |
| ---------------------- | ---------- | ---------------------- | ----------- | -------- |
| Sampath Gunawardena    | `admin`    | admin@workpulse.com    | admin       | `1234`   |
| Nirosha Wickramasinghe | `nirosha`  | nirosha@workpulse.dev  | manager     | `123456` |
| Kasun Perera           | `kaasun`   | kasun@workpulse.dev    | team member | `123456` |
| Dilani Rathnayake      | `dilani`   | dilani@workpulse.dev   | team member | `123456` |
| Chathura Jayasuriya    | `chathura` | chathura@workpulse.dev | team member | `123456` |
| Nadeeka Silva          | `nadeeka`  | nadeeka@workpulse.dev  | team member | `123456` |

---

## AI Chat Assistant

The chatbot in the top navigation uses the backend's `POST /api/ai/chat` endpoint, which calls Groq with live team context (reports, tasks, blockers, projects).

To enable it, set `GROQ_API_KEY` in `backend/.env`. Without a key, the chat returns an error message in the UI.

---

## Project Structure

```
workpulse/
├── backend/
│   ├── src/          # Express app, routes, controllers, services, seed
│   ├── sql/          # Versioned SQL migrations (001–004)
│   ├── .env / .env.example
│   └── package.json
└── frontend/
    ├── src/app/      # Next.js App Router pages
    ├── src/components/  # UI components (dashboard, AI chat, …)
    ├── src/lib/      # Utilities and API client
    ├── .env / .env.example
    └── package.json
```
