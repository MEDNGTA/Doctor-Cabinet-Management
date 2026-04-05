<p align="center">
  <img src="public/logo192.png" alt="Cabinet Logo" width="80" />
</p>

<h1 align="center">Doctor-Cabinet-Management</h1>

<p align="center">
  <strong>Modern Medical Cabinet Management System</strong><br/>
  A full-stack application for managing patients, appointments, prescriptions, stock, invoices, and diagnostics.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5-black?logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-13+-336791?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45-green?logo=drizzle" alt="Drizzle" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-Private-red" alt="License" />
</p>

---

## Overview

Cabinet is a comprehensive medical practice management system designed for clinics and doctor offices. It supports **6 user roles**, **42 granular permissions**, and covers the full clinical workflow — from patient registration and appointment booking to test ordering, prescription writing, invoicing with doctor approval, and inventory management.

### Key Highlights

- **Role-based access** for patients, doctors, nurses, secretariat, and IT staff
- **18 database tables** with full relational integrity
- **JWT authentication** via NextAuth v5 — no server-side sessions
- **Search-on-type** for patients and doctors — no bulk loading
- **Connection pooling** for fast database access
- **Responsive UI** with mobile sidebar and language selector

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Language** | TypeScript 5.3 |
| **Database** | PostgreSQL 13+ |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) 0.45 + drizzle-zod |
| **Auth** | [NextAuth.js v5](https://authjs.dev/) (JWT, Credentials provider) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) 3.4 |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/) |
| **Forms** | React Hook Form + Zod validation |
| **Internationalization** | next-intl (EN, DE, FR, AR with RTL) |
| **Security** | bcryptjs password hashing, HTTP-only JWT cookies |

---

## Features

### 👥 Patient Management
- Full CRUD with medical history, allergies, insurance, and emergency contacts
- **Search-on-type** — patients load only when you type (≥ 2 characters, 400ms debounce)
- Server-side search with paginated results

### 📅 Appointment Scheduling
- Interactive **calendar view** with monthly navigation
- **Time slot picker** showing available and busy slots per doctor
- **Searchable dropdowns** for patient and doctor selection (no bulk preload)
- Filter by status, date range, and search query
- Auto-notification to doctor on new appointment

### 💊 Prescriptions
- Create prescriptions with medication details (dosage, frequency, duration, instructions)
- Status workflow: Draft → Issued → Printed
- Filter by status tabs

### 🧪 Tests & Diagnostics
- Order tests with template library (imaging, lab, etc.)
- Auto-assign to nurse with notification
- Record results and auto-notify doctor on completion
- Link tests to appointments and visit sessions

### 🧾 Invoice & Billing
- Auto-generated invoice numbers (`INV-YYYYMMDD-XXXX`)
- Auto-calculated totals (subtotal + tax − discount)
- **Approval workflow**: Secretary creates → Doctor approves/rejects → Notifications at each step
- Payment tracking (cash, card, check, bank transfer)

### 📦 Stock & Inventory
- Full inventory management with categories and units
- **Low-stock alerts** with color-coded indicators (green/yellow/red)
- Record usage, returns, waste, and adjustments — every change logged
- **Restock orders** with supplier, delivery tracking, and auto-quantity update on receipt
- Paginated transaction history

### 🏢 Supplier Management
- Supplier profiles with contact info, payment terms, and tax ID
- Soft-delete (deactivate without losing history)
- Link suppliers to stock items and restock orders

### 👨‍⚕️ Team Management
- Doctors can manage their team (add/remove nurses, secretariat)
- Create new staff members directly

### 🔔 Notifications
- In-app notification system (patient arrival, test completed, appointment confirmed, invoice ready, stock low)
- Mark as read / mark all read
- Rich JSONB data for actionable notifications

### 📄 Documents
- Binary file upload and download
- Link documents to patients and tests
- Content-type aware serving

### 📋 Audit Logging
- Every create, update, delete action is logged
- Tracks user, entity, description, and full change data (JSON)

---

## Role System

Six roles with **42 granular permissions**:

| Role | Access Level |
|:-----|:-------------|
| **Patient** | View own appointments, prescriptions, documents |
| **Nurse** | Perform tests, manage consumables, upload documents |
| **Secretariat** | Manage appointments, invoices, patients, sessions |
| **Doctor** | Full clinical access + prescriptions, test ordering, invoice approval, staff management |
| **IT Operator** | Account management, office logs, limited role management |
| **IT Master** | Full system access — all features, all roles, audit logs |

> **Role hierarchy**: Patient → Nurse → Secretariat → Doctor → IT Operator → IT Master

---

## Database Schema

**18 tables** across 7 domains:

```
Core            ─── users · patients
Appointments    ─── appointments · visit_sessions
Diagnostics     ─── test_templates · tests
Prescriptions   ─── prescriptions · prescription_details
Billing         ─── invoices · invoice_line_items
Inventory       ─── stock_items · stock_transactions · suppliers · restock_orders
System          ─── notifications · documents · audit_logs · doctor_team_members
```

With **7 enums**, **12 indexes**, and **17 relations** for full referential integrity.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                        # Root layout (Inter font, metadata)
│   ├── page.tsx                          # Landing page (hero + feature cards)
│   ├── globals.css                       # Tailwind globals
│   ├── (app)/                            # ── Protected routes ──
│   │   ├── layout.tsx                    # Auth guard + AppShell
│   │   ├── dashboard/page.tsx            # Role-based dashboard with metrics
│   │   ├── patients/                     # Patient list + create
│   │   ├── appointments/                 # List + new (calendar + time slots)
│   │   ├── prescriptions/               # List + create
│   │   ├── stock/                        # Inventory, usage, restock orders
│   │   ├── suppliers/page.tsx            # Supplier management
│   │   └── team/page.tsx                 # Doctor's team management
│   ├── api/                              # ── REST API Routes ──
│   │   ├── auth/                         # NextAuth, register, change-password
│   │   ├── patients/                     # CRUD + search + pagination
│   │   ├── appointments/                 # CRUD + filters
│   │   ├── prescriptions/               # CRUD + status workflow
│   │   ├── stock/                        # Items, transactions, restock orders
│   │   ├── suppliers/                    # CRUD + soft delete
│   │   ├── invoices/                     # CRUD + approval workflow
│   │   ├── tests/                        # CRUD + templates
│   │   ├── users/                        # User listing + search
│   │   ├── team/                         # Team + staff management
│   │   ├── notifications/                # List, read, delete
│   │   ├── documents/                    # Upload, download, delete
│   │   └── visit-sessions/               # Session management
│   └── auth/                             # Login + Register pages
├── auth/                                 # Auth config, middleware, permissions
├── components/                           # UI components (shell, stock, providers)
├── db/                                   # Drizzle schema, client, migrations
├── lib/                                  # API utilities, error classes, i18n
└── types/                                # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 13+
- **npm** (or pnpm/yarn)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd Cabinet
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://medical_admin:YOUR_PASSWORD@localhost:5432/medical_cabinet"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

> Generate a secret: `openssl rand -base64 32`

### 3. Set Up Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE medical_cabinet;"
psql -U postgres -c "CREATE USER medical_admin WITH PASSWORD 'your_password';"
psql -U postgres -d medical_cabinet -c "GRANT ALL ON SCHEMA public TO medical_admin;"
psql -U postgres -d medical_cabinet -c "GRANT ALL PRIVILEGES ON DATABASE medical_cabinet TO medical_admin;"

# Push schema to database
npx drizzle-kit push --force
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migrations |
| `npm run db:studio` | Open Drizzle Studio (visual DB editor) |

---

## API Overview

All endpoints return a consistent response format:

```json
{
  "success": true,
  "data": { ... },
  "message": "...",
  "statusCode": 200
}
```

### Endpoints

| Module | Endpoint | Methods |
|:-------|:---------|:--------|
| **Auth** | `/api/auth/[...nextauth]` | GET, POST |
| | `/api/auth/register` | POST |
| | `/api/auth/change-password` | POST |
| **Patients** | `/api/patients` | GET (search, paginate), POST |
| | `/api/patients/[id]` | GET, PUT, DELETE |
| **Appointments** | `/api/appointments` | GET (filter by doctor/patient/status/date), POST |
| **Prescriptions** | `/api/prescriptions` | GET (filter by status), POST |
| | `/api/prescriptions/[id]` | GET, PUT, DELETE |
| **Stock** | `/api/stock` | GET (paginate, category, low-stock filter), POST |
| | `/api/stock/[id]` | GET, PUT, DELETE |
| | `/api/stock/transactions` | GET (paginated history) |
| | `/api/stock/restock-orders` | GET, POST |
| | `/api/stock/restock-orders/[id]` | GET, PUT, DELETE |
| **Suppliers** | `/api/suppliers` | GET, POST |
| | `/api/suppliers/[id]` | GET, PUT, DELETE (soft) |
| **Invoices** | `/api/invoices` | GET, POST, PATCH (approve/reject) |
| **Tests** | `/api/tests` | GET, POST, PUT |
| **Users** | `/api/users` | GET (filter by role + search) |
| **Team** | `/api/team` | GET, POST, DELETE |
| | `/api/team/staff` | POST, PUT |
| **Notifications** | `/api/notifications` | GET, PUT, DELETE |
| **Documents** | `/api/documents` | POST (upload), GET (download), DELETE |
| **Visit Sessions** | `/api/visit-sessions` | GET, POST, PUT |

All list endpoints support `?page=1&pageSize=10` pagination.

---

## Navigation by Role

<table>
<tr><th>Role</th><th>Sidebar Items</th></tr>
<tr><td><strong>Doctor</strong></td><td>Dashboard · Patients · Appointments · Prescriptions · My Team · Stock</td></tr>
<tr><td><strong>Secretariat</strong></td><td>Dashboard · Patients · Appointments · Stock · Suppliers</td></tr>
<tr><td><strong>Nurse</strong></td><td>Dashboard · Patients · Appointments · Stock</td></tr>
<tr><td><strong>IT Master</strong></td><td>Dashboard · Patients · Appointments · Prescriptions · Stock · Suppliers</td></tr>
<tr><td><strong>Patient</strong></td><td>Dashboard · Appointments · Prescriptions</td></tr>
</table>

---

## Key Workflows

### Appointment Booking
```
Patient/Secretary → Search patient → Search doctor → Pick date on calendar
→ Select available time slot → Submit → Doctor notified
```

### Invoice Approval
```
Secretary creates invoice → Auto-calculates totals → Status: pending_approval
→ Doctor reviews → Approves or Rejects → Secretary notified
```

### Test Ordering
```
Doctor orders test → Assigns to nurse → Nurse notified → Nurse performs test
→ Records results → Doctor notified → Results linked to invoice
```

### Stock Management
```
Usage recorded → Quantity updated → Transaction logged → Low-stock alert triggered
→ Restock order created → Order received → Stock auto-replenished
```

---

## Troubleshooting

| Problem | Solution |
|:--------|:---------|
| `Cannot find module './vendor-chunks/zod.js'` | Delete `.next` folder: `rm -rf .next` and restart |
| Port 3000 already in use | Use another port: `npm run dev -- -p 3001` |
| Database connection refused | Ensure PostgreSQL is running: `psql -U postgres -l` |
| "Permission denied" on API | Check user role in database matches required permission |
| Hydration mismatch warning | Already handled with `suppressHydrationWarning` — usually caused by browser extensions |

---

## License

Private — All rights reserved.

---

<p align="center">
  Built with Next.js, PostgreSQL, Drizzle ORM, and Tailwind CSS
</p>
