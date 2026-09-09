# 🎙️ CareShift — Comprehensive Interview Guide & Technical Architecture Note

Use this guide as your complete technical reference to confidently explain the **Tech Stack**, **Architecture**, **Database Design**, and **File-by-File Details** to interviewers.

---

## ⚡ 1. 30-Second Elevator Pitch
> *"CareShift is an enterprise clinical workforce management application built specifically for hospital inpatient units. It manages 12-hour Day (07:00–19:00) and Night (19:00–07:00) shift allotments across nurses and doctors. It enforces strict clinical skill-parity trading rules (e.g., nurses can only swap with fellow nurses) and features a responsive, non-AI enterprise workspace. Architecturally, it utilizes Next.js App Router, TypeScript, and a decoupled Repository Pattern connecting live to PostgreSQL with 5-minute inactivity session security."*

---

## 🛠️ 2. Technology Stack & Why Each Was Chosen

| Technology | Role | Why It Was Chosen / Interview Defense |
| :--- | :--- | :--- |
| **Next.js 16 (App Router)** | Full-Stack Web Framework | Provides a hybrid architecture: React Server Components (RSC) for fast initial data-fetching without client-side waterfalls, Client Components (`'use client'`) for interactive modals and touch-friendly drag/scroll, and Route Handlers for API endpoints. Eliminates the need for a separate Node/Express backend server. |
| **TypeScript 5** | Language | Enforces strict compile-time type safety across database entities (`Shift`, `User`, `TradeRequest`), API request/response contracts, and UI component props. Prevents runtime null-pointer crashes. |
| **React 19** | UI Library | Leverages stateful hooks (`useState`, `useEffect`), Suspense boundaries, and clean unidirectional data flow. |
| **PostgreSQL 16+** | Relational Database | Production-grade relational database running locally or in the cloud. Enforces referential integrity (foreign keys, check constraints, unique constraints) and executes ACID atomic transactions during shift exchanges. |
| **Node-Postgres (`pg.Pool`)** | Database Driver | High-throughput connection pooling that reuses client connections, prevents exhaustion under concurrent requests, and manages SSL for cloud databases (Neon, Supabase, AWS RDS). |
| **Vanilla CSS Design System** | Styling & UI | Hand-crafted enterprise design system in [`globals.css`](file:///c:/workshiftweb/src/app/globals.css) using CSS custom variables, sleek dark navy tones (`#0b132b`), flexbox, and CSS grid. Avoids bulky utility classes and preserves a clean, non-AI enterprise feel. |
| **Bcrypt.js** | Security & Hashing | Industry-standard password hashing using cryptographic salts, ensuring raw passwords are never stored in plaintext. |
| **HTTP-Only Cookies** | Session Management | Secure, SameSite, HTTP-only cookies that cannot be accessed by client-side scripts, protecting the app from Cross-Site Scripting (XSS) token theft. |
| **Lucide React** | Iconography | Lightweight, tree-shakeable SVG icons for hospital and clinical UI states. |

---

## 📁 3. Complete File & Folder Structure Explanation

```
workshiftweb/
├── .data/                      # Database test scripts & inspection tools
├── prisma/
│   └── schema.prisma           # Prisma relational schema declaration
├── public/                     # Static assets (favicons, public images)
├── src/
│   ├── app/                    # Next.js App Router (Pages, Layouts & APIs)
│   │   ├── admin/              # Administrator / Charge Nurse portal
│   │   ├── employee/           # Clinical staff (Nurse & Doctor) portal
│   │   ├── api/                # Backend REST API Route Handlers
│   │   ├── login/              # Secure standalone authentication page
│   │   ├── globals.css         # Global design system, theme tokens & responsive styles
│   │   ├── layout.tsx          # Root HTML skeleton, font loading & session watcher
│   │   └── page.tsx            # Root gateway route (redirects authenticated vs guest)
│   ├── components/             # Reusable UI components & application shells
│   └── lib/                    # Business logic, DB repository & auth utilities
├── .env / .env.example         # Environment variables & DB connection string
├── next.config.ts              # Next.js framework configuration
├── package.json                # Project dependencies & npm run scripts
├── schema.sql                  # Raw PostgreSQL DDL setup script
├── tsconfig.json               # TypeScript strict configuration
├── README.md                   # Project overview & demo instructions
└── INTERVIEW_QUICK_NOTE.md     # This interview preparation cheat sheet
```

---

### 📂 Detailed Breakdown of Every Folder & File

#### ⚙️ Root Configuration Files
1. **[`package.json`](file:///c:/workshiftweb/package.json)**
   - **Purpose**: Defines project metadata, npm scripts (`npm run dev`, `npm run build`), and dependencies (`next`, `react`, `pg`, `bcryptjs`, `lucide-react`).
2. **[`next.config.ts`](file:///c:/workshiftweb/next.config.ts)**
   - **Purpose**: Next.js compiler settings and build options.
3. **[`tsconfig.json`](file:///c:/workshiftweb/tsconfig.json)**
   - **Purpose**: Configures TypeScript compiler settings, path aliases (`@/*` pointing to `./src/*`), and strict type-checking flags.
4. **[`.env`](file:///c:/workshiftweb/.env) & [`.env.example`](file:///c:/workshiftweb/.env.example)**
   - **Purpose**: Stores the PostgreSQL connection string (`DATABASE_URL="postgresql://postgres:...@localhost:5432/shifttracker"`) and session secrets.
5. **[`schema.sql`](file:///c:/workshiftweb/schema.sql)**
   - **Purpose**: The complete raw PostgreSQL database schema. Contains `CREATE TABLE` queries for `departments`, `users`, `shifts`, `trade_requests`, and `hospital_settings`, along with pre-seeded clinical demo records.
6. **[`prisma/schema.prisma`](file:///c:/workshiftweb/prisma/schema.prisma)**
   - **Purpose**: Declarative Prisma ORM schema mapping models and relational relations for migrations or type generation.

---

#### 🧠 `src/lib/` (Core Logic, Database & Auth)
1. **[`src/lib/db.ts`](file:///c:/workshiftweb/src/lib/db.ts)**
   - **Role**: **The Repository Pattern Engine & Data Access Object (DAO)**.
   - **What it does**: Initializes the PostgreSQL `pg.Pool`. It encapsulates all database queries into clean typed namespaces:
     - `db.users`: `list()`, `findById()`, `findByEmail()`, `create()`, `delete()`.
     - `db.shifts`: `list()`, `findById()`, `create()`, `update()`, `delete()`.
     - `db.trades`: `list()`, `findById()`, `create()`, `updateStatus()`. During `ADMIN_APPROVED`, it initiates an ACID transaction that swaps `userId` values between both shifts atomically.
     - `db.departments` & `db.settings`: Facility settings and clinical department management.
   - **Interview Talking Point**: *"If we ever want to switch from PostgreSQL to MongoDB or Supabase, we only change the methods inside `src/lib/db.ts`. The UI components and API routes never have to change."*
2. **[`src/lib/auth.ts`](file:///c:/workshiftweb/src/lib/auth.ts)**
   - **Role**: Authentication & session security helpers.
   - **What it does**:
     - `createSessionToken()` / `verifySessionToken()`: Encodes and decodes secure session payloads.
     - `setSessionCookie()` / `clearSessionCookie()`: Issues HTTP-only, `SameSite=Lax` cookies with a **300-second (5-minute)** lifespan.
     - `getSession()`: Server-side helper to read the active user session in Server Components and API Route Handlers.
3. **[`src/lib/types.ts`](file:///c:/workshiftweb/src/lib/types.ts)**
   - **Role**: Shared TypeScript definitions.
   - **What it does**: Declares TypeScript interfaces for `User`, `Shift`, `ShiftWithDetails`, `TradeRequest`, `Department`, `HospitalSettings`, and union types like `Role ('ADMIN' | 'EMPLOYEE')`.

---

#### 🧩 `src/components/` (Reusable UI Components)
1. **[`src/components/AppShell.tsx`](file:///c:/workshiftweb/src/components/AppShell.tsx)**
   - **Role**: The responsive application framework wrapper.
   - **What it does**:
     - **Desktop**: Renders the fixed left sidebar with **CareShift** logo, **CORE** links (`Overview`, `Schedule & Shifts`, `Staff Roster`, `Trade Hub` with live pending badges), and **MANAGEMENT** (`Settings`).
     - **Mobile / Tablet**: Implements a responsive slide-out drawer accessible via a hamburger menu with backdrop dismissal on screens $\le 860\text{px}$.
     - **Topbar**: Renders quick-action buttons (`+ Add Shift` for admin, `Propose Swap` for staff), notifications bell, staff avatar badge, and one-click logout.
2. **[`src/components/ChronosPlannerView.tsx`](file:///c:/workshiftweb/src/components/ChronosPlannerView.tsx)**
   - **Role**: The main interactive schedule and shift planner workspace.
   - **What it does**:
     - Displays the `ROSTER ENGINE V4` banner, 7-day timeline matrix strip (`MON`, `TUE Today`, `WED`, etc.) with coverage percentage indicators.
     - Houses the **DAY SHIFT (07:00–19:00)** and **NIGHT SHIFT (19:00–07:00)** swimlanes.
     - Renders headcount badges (`3 Assigned`, `2 Assigned • Full`) and individual horizontal staff cards showing employee initials, clinical titles, and shift times.
     - Offers interactive `+ Assign Staff` slot triggers to allot unassigned staff directly.
3. **[`src/components/CalendarView.tsx`](file:///c:/workshiftweb/src/components/CalendarView.tsx)**
   - **Role**: Month and Week schedule calendar component.
   - **What it does**: Visualizes calendar grids for staff shifts with Day/Night color-coding and provides direct triggers for shift trade proposals.
4. **[`src/components/ShiftModal.tsx`](file:///c:/workshiftweb/src/components/ShiftModal.tsx)**
   - **Role**: Admin shift creation and editing modal dialog.
   - **What it does**: Validates and submits shift allotments to `/api/shifts`, allowing administrators to assign nurses or doctors to Day or Night rotations on any chosen date.
5. **[`src/components/TradeRequestModal.tsx`](file:///c:/workshiftweb/src/components/TradeRequestModal.tsx)**
   - **Role**: Shift trade request modal with clinical role-parity enforcement.
   - **What it does**: Allows a nurse to pick one of their allotted shifts, select a colleague, and pick a target shift to swap. **Enforces policy**: nurses only see nurses in the colleague list; doctors only see doctors.
6. **[`src/components/SessionTimeoutWatcher.tsx`](file:///c:/workshiftweb/src/components/SessionTimeoutWatcher.tsx)**
   - **Role**: Client-side inactivity monitor.
   - **What it does**: Listens for user interactions (`mousemove`, `keydown`, `click`, `scroll`). If the user is idle for **5 minutes (300,000 ms)**, it automatically logs out the session and redirects to `/login?timeout=1`.
7. **[`src/components/Navbar.tsx`](file:///c:/workshiftweb/src/components/Navbar.tsx)**
   - **Role**: Standalone header component for fallback views.

---

#### 📱 `src/app/` (Pages & Layout)
1. **[`src/app/layout.tsx`](file:///c:/workshiftweb/src/app/layout.tsx)**
   - **Purpose**: Root HTML wrapper. Injects Geist fonts, imports `globals.css`, and mounts `SessionTimeoutWatcher` across the entire app.
2. **[`src/app/page.tsx`](file:///c:/workshiftweb/src/app/page.tsx)**
   - **Purpose**: Private gateway redirect. Checks active session: if logged in as ADMIN $\rightarrow$ redirects to `/admin/dashboard`; if EMPLOYEE $\rightarrow$ `/employee/dashboard`; if unauthenticated $\rightarrow$ `/login`.
3. **[`src/app/login/page.tsx`](file:///c:/workshiftweb/src/app/login/page.tsx)**
   - **Purpose**: Standalone, centered CareShift login card with email and password inputs, session timeout notice banner, and 1-click quick-fill demo buttons for the Admin, 3 Nurses, and 2 Doctors.
4. **[`src/app/globals.css`](file:///c:/workshiftweb/src/app/globals.css)**
   - **Purpose**: Complete design system tokens (`--bg-main`, `--text-primary`), layout rules (`.chronos-shell`, `.chronos-sidebar`, `.chronos-workspace`), day cards, shift swimlanes, and responsive media queries (`@media (max-width: 860px)`).

---

#### 🏥 `src/app/admin/` (Administrator Portal)
1. **[`src/app/admin/dashboard/page.tsx`](file:///c:/workshiftweb/src/app/admin/dashboard/page.tsx)**
   - **Purpose**: Server Component that fetches all shifts, users, departments, and pending trade requests from PostgreSQL, then renders `ChronosPlannerView` wrapped inside `AppShell`.
2. **[`src/app/admin/shifts/page.tsx`](file:///c:/workshiftweb/src/app/admin/shifts/page.tsx)**
   - **Purpose**: Shift management view. Offers switching between a calendar grid view and a tabular list view of all Day/Night rotations with edit and delete capabilities.
3. **[`src/app/admin/employees/page.tsx`](file:///c:/workshiftweb/src/app/admin/employees/page.tsx)**
   - **Purpose**: Clinical user directory. Lists all nurses and doctors with their titles, departments, phone numbers, and scheduled shift counts, plus an "Add Team Member" modal.
4. **[`src/app/admin/trades/page.tsx`](file:///c:/workshiftweb/src/app/admin/trades/page.tsx)**
   - **Purpose**: Shift trade approvals queue. Displays peer-accepted swaps awaiting administrative sign-off. Approving triggers an atomic swap of both shifts in PostgreSQL.
5. **[`src/app/admin/settings/page.tsx`](file:///c:/workshiftweb/src/app/admin/settings/page.tsx)**
   - **Purpose**: Hospital facility settings. Lets admins configure hospital name, ward unit name, and standard shift hours (07:00 / 19:00).

---

#### 🩺 `src/app/employee/` (Staff Member Portal)
1. **[`src/app/employee/dashboard/page.tsx`](file:///c:/workshiftweb/src/app/employee/dashboard/page.tsx)**
   - **Purpose**: Personal staff dashboard. Shows "My Next Shift" countdown card, active weekly shift cards, quick swap buttons, and personal trade history.
2. **[`src/app/employee/calendar/page.tsx`](file:///c:/workshiftweb/src/app/employee/calendar/page.tsx)**
   - **Purpose**: Ward team calendar. Allows staff to toggle between "My Shifts" and "All Shifts" to view coworker schedules and click "Request Swap".
3. **[`src/app/employee/trades/page.tsx`](file:///c:/workshiftweb/src/app/employee/trades/page.tsx)**
   - **Purpose**: Shift trade hub. Tabs for **Inbound Requests** (trades proposed to you by colleagues, with Accept/Decline buttons) and **Outbound Requests** (trades you proposed, tracking approval status).
4. **[`src/app/employee/profile/page.tsx`](file:///c:/workshiftweb/src/app/employee/profile/page.tsx)**
   - **Purpose**: Clinical employee credential and record view, showing department, contact info, shift count, and upcoming assigned rotations.

---

#### ⚡ `src/app/api/` (Backend REST API Endpoints)
1. **[`/api/auth/login`](file:///c:/workshiftweb/src/app/api/auth/login/route.ts)**: Validates email and compares password hashes with `bcrypt.compare`. Sets the HTTP-only cookie and returns the role-specific redirect URL.
2. **[`/api/auth/logout`](file:///c:/workshiftweb/src/app/api/auth/logout/route.ts)**: Clears the session cookie.
3. **[`/api/auth/me`](file:///c:/workshiftweb/src/app/api/auth/me/route.ts)**: Returns the current user's session payload for client components.
4. **[`/api/shifts`](file:///c:/workshiftweb/src/app/api/shifts/route.ts)** & **[`/api/shifts/[id]`](file:///c:/workshiftweb/src/app/api/shifts/[id]/route.ts)**: CRUD operations for shifts. Supports filtering by date range, department, and employee ID.
5. **[`/api/trades`](file:///c:/workshiftweb/src/app/api/trades/route.ts)** & **[`/api/trades/[id]`](file:///c:/workshiftweb/src/app/api/trades/[id]/route.ts)**: Handles trade proposals, peer acceptance/rejection, and admin approval with atomic roster swap.
6. **[`/api/employees`](file:///c:/workshiftweb/src/app/api/employees/route.ts)** & **[`/api/employees/[id]`](file:///c:/workshiftweb/src/app/api/employees/[id]/route.ts)**: User directory retrieval and creation.
7. **[`/api/departments`](file:///c:/workshiftweb/src/app/api/departments/route.ts)**: Returns active hospital departments (`Nursing`, `Doctors`).
8. **[`/api/settings`](file:///c:/workshiftweb/src/app/api/settings/route.ts)**: Reads and updates hospital facility settings.

---

## 🗄️ 4. How the Database Is Used Right Now & How to Query in pgAdmin 4

- **Active Database**: PostgreSQL 16+ on `localhost:5432/shifttracker`.
- **Querying in pgAdmin 4**:
  1. Expand: **Servers** ➔ **PostgreSQL** ➔ **Databases** ➔ **`shifttracker`** ➔ **Schemas** ➔ **public** ➔ **Tables**.
  2. Tables to inspect:
     - `users`: Exactly 6 staff (Admin Elena Vance, 3 Nurses, 2 Doctors).
     - `shifts`: All Day (07:00–19:00) and Night (19:00–07:00) shifts across the week.
     - `trade_requests`: Peer shift swap logs and states.
     - `departments`: Clinical wards (`Nursing`, `Doctors`).

---

## 🔄 5. How to Switch Databases or Point to Cloud (e.g. Neon, Supabase, AWS RDS)

> **Interviewer Question**: *"How easy is it to point this project to a Cloud database or switch database engines?"*

### Response:
*"Because all database operations are abstracted behind the **Repository Pattern** in `src/lib/db.ts`, switching databases requires zero changes to the frontend or API layer:"*
1. **Point to Cloud PostgreSQL (Neon / Supabase / AWS RDS)**:
   - Change `DATABASE_URL` in `.env`:
     ```env
     DATABASE_URL="postgresql://user:password@ep-cool-cloud.neon.tech/shifttracker?sslmode=require"
     ```
   - Node-postgres automatically handles SSL connection pooling.
2. **Switch to another engine (MySQL / MongoDB / Prisma)**:
   - Only the database query implementations inside `src/lib/db.ts` need to be changed. All React components, Server Components, and API Route Handlers remain 100% untouched.

---

## 💡 6. Key Engineering Highlights for Technical Interviews

1. **Decoupled Repository Pattern**:
   - Clean separation of concerns between data storage and presentation layer.
2. **Strict Business Rule Enforcement (Full-Stack Parity)**:
   - **Frontend**: The peer trade dropdown automatically filters out non-matching roles.
   - **Backend**: `/api/trades` validates department and skill parity before inserting, preventing API circumvention.
3. **Multi-Stage Shift Swap State Machine**:
   - `PENDING_PEER` $\rightarrow$ `PEER_ACCEPTED` $\rightarrow$ `ADMIN_APPROVED`.
   - On admin approval, an atomic PostgreSQL transaction swaps shift ownership simultaneously.
4. **Clinical Security & 5-Minute Inactivity Protection**:
   - HTTP-only cookies prevent JavaScript token extraction.
   - Dual client-server idle tracking auto-terminates inactive sessions after 5 minutes to safeguard clinical records.
