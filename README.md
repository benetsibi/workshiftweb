# 🏥 CareShift — Hospital Nurse & Doctor Shift Management

> **Master Your Schedule • Swap Shifts with Ease • Clinical Skill Continuity**

CareShift is a clinical workforce web application built for hospital inpatient units to manage daily nurse and doctor shift rosters, 12-hour Day/Night rotations, and peer-to-peer shift swaps.

---

## 🎯 System Overview

CareShift is configured for **Acute Inpatient Care Unit 3B** at **St. Jude Community Hospital**:

- **Shift Formats**: Strictly **Day Shift** (07:00 – 19:00) and **Night Shift** (19:00 – 07:00).
- **Active Staff**: Exactly **3 Registered Nurses** and **2 Inpatient Doctors** (all are employees) + **1 Clinical Operations Director / Admin**.
- **Clinical Policy Rule**: **Nurses can only request shift swaps from other nurses**, and **Doctors can only swap with doctors** to maintain ward staffing compliance.

---

## 🔑 Demonstration Accounts (1-Click Login)

Navigate to **[http://localhost:3000/login](http://localhost:3000/login)**. Use the **1-Click Login buttons** on the sign-in card:

| Role | Staff Name | Clinical Title | Email | Password | Portal |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **🏥 Admin** | Elena Vance | Clinical Operations Director & Head Nurse | `admin@hospital.com` | `admin123` | `/admin/dashboard` |
| **🩺 Nurse** | Sarah Jenkins | Staff Registered Nurse (RN) | `sarah@hospital.com` | `employee123` | `/employee/dashboard` |
| **🩺 Nurse** | Alex Rivera | Charge Nurse (BSN) | `alex@hospital.com` | `employee123` | `/employee/dashboard` |
| **🩺 Nurse** | Marcus Chen | ICU Staff Nurse (RN) | `marcus@hospital.com` | `employee123` | `/employee/dashboard` |
| **👨‍⚕️ Doctor** | Dr. Priya Patel | Attending Physician (MD) | `priya@hospital.com` | `employee123` | `/employee/dashboard` |
| **👨‍⚕️ Doctor** | Dr. David Miller | Staff Hospitalist Physician (MD) | `david@hospital.com` | `employee123` | `/employee/dashboard` |

---

## 📱 Navigation & Core Modules

### 👩‍⚕️ 1. Employee Portal (Nurses & Doctors)
- **Clock: My Shifts** (`/employee/dashboard`):
  - Displays your personal Day and Night shifts for the current week (Sep 7 – Sep 13, 2026).
  - Next upcoming shift spotlight with time, meal break (60 min), and ward location.
  - One-click shortcut to initiate a shift trade.
- **Calendar: Schedule** (`/employee/calendar`):
  - Weekly team roster showing on-duty coverage for all 3 Nurses and 2 Doctors.
  - Option to request a shift swap directly from fellow staff.
- **Repeat: My Requests** (`/employee/trades`):
  - Inbound and outbound shift trade requests.
  - Accept or decline offers from colleagues.
- **User: Profile** (`/employee/profile`):
  - Personal staff record: Name, Title, Department, Hospital ID badge, hourly rate, and clinical policy guidelines.

### 🏥 2. Admin Operations Hub (Clinical Director)
- **LayoutDashboard: Admin Dashboard** (`/admin/dashboard`):
  - **Active Shifts Today**: Live on-duty view showing who is working the **Day Shift** (07:00–19:00) and **Night Shift** (19:00–07:00) with their roles.
  - **Clinical Roster Breakdown**: 3 Nurses and 2 Doctors on active ward rotation.
  - **Swap Approvals Queue**: Sign off on colleague trade proposals.
- **Calendar: Shift Management** (`/admin/shifts`):
  - Allot staff members to **Day Shift** or **Night Shift** for any date.
  - Interactive weekly calendar view and searchable roster table.
- **Users: User Directory** (`/admin/employees`):
  - List of all clinical staff with option to add new nurses or doctors.
- **Settings: Settings** (`/admin/settings`):
  - Facility name, unit name, 12-hour shift start/end hours, and trade policy toggles.

---

## 🔄 Live Presentation Walkthrough

1. **Sign in as Sarah (Nurse)**:
   - Go to [http://localhost:3000/login](http://localhost:3000/login) and click **Sarah (RN)**.
   - On **My Shifts**, notice Sarah's assigned Day Shifts for the week.
   - Click **Team Schedule** (`/employee/calendar`) or **Shift Swap Requests** (`/employee/trades`).
   - Click **Request Shift Swap**: Observe that only fellow nurses (**Alex Rivera** and **Marcus Chen**) are eligible in the colleague dropdown. Doctor accounts are excluded per clinical policy!
   - Propose a swap with **Alex Rivera**.

2. **Sign in as Alex (Nurse)**:
   - Go to [http://localhost:3000/login](http://localhost:3000/login) and click **Alex (BSN)**.
   - Notice the green notification banner on the dashboard alerting of an incoming swap request from Sarah.
   - Click **Review Swap Offers** and click **Accept**.

3. **Sign in as Elena (Admin / Clinical Director)**:
   - Click **Elena Vance (Admin)** on the login page.
   - The **Admin Dashboard** displays the pending swap in the alert queue.
   - Review and click **Approve & Swap Shifts**.
   - The live roster automatically updates to reflect the new staff assignments!

---

## 🛠️ Technology Highlights

- **Framework**: Next.js (App Router, Server Actions, React 19).
- **Language**: TypeScript (Strict typing for shifts, users, trades, and clinical settings).
- **Design System**: Responsive clinical CSS theme with light and dark contrast, status badges, and accessibility.
- **Data Persistence**: Instant JSON database (`.data/shifttracker.json`) with PostgreSQL / pgAdmin 4 support.
