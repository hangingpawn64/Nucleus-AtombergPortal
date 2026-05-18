# Nucleus Goals - Performance Portal

An enterprise-grade, high-fidelity **Goal Setting & Tracking Portal** engineered with Next.js App Router, Supabase Backend, and a state-of-the-art responsive design. 

Nucleus Goals serves as the performance tracking hub for configuring goal cycles, drafting goal sheets with strict validation rules, approving submissions in manager-led review flows, and logging regular check-ins.

---

## Primary Workflows & Features

### Employee Goal Setting
* **Goal Sheets Drafting**: Build, organize, and edit individual performance metrics.
* **Weightage Validations**: Strictly enforces that the combined weightage of all goals in a cycle sheet sums to **exactly 100%** before permitting submission.
* **Submission Loop**: Seamless draft preservation and submission triggers, complete with manager rework callbacks.

### Manager Reviews & Approvals
* **Review Dashboard**: Unified inspection board of all direct reports' goal sheets.
* **State Operations**: Approve, lock sheets to prevent edits, or return sheets for rework with inline comments.

### Cycle Configuration (HR / Admin)
* **Cycle Controls**: Create, open, and close performance review cycles (e.g. Q1, H1, FY).
* **Workspace Management**: Active user directories, auditing, and role mapping.

### Activity & Notifications
* **Audit Trail**: Detailed activity logs capturing sheet state changes, comments, and approvals.
* **Realtime Alerts**: Interactive notifications notifying users of cycle changes or manager reviews.

### Premium UI/UX Polish
* **Dynamic Theme Switcher**: Animated day/night switcher driving a **directional sweep** transition across the screen (left-to-right to dark mode; right-to-left to light mode) accompanied by a synchronized neon glow separator.
* **Unified Branding**: Favicon branding integrated consistently across all public, auth, and private routes.
* **Ultra-Responsive Grid**: Isolated route groups giving a fully unconstrained, responsive hero landing canvas.

---

## 🛠️ Stack & Dependencies

### Core Engine & Database
* **Next.js 16.2.6 & React 19.2.4**: Built using App Router (RSC), Suspense boundaries, and Edge middlewares.
* **Supabase Client (`v2.105.4`) & SSR (`v0.10.3`)**: Server-side cookie refresh and Edge session checking.
* **Tailwind CSS v4.0.0**: Semantic variables styling supporting HSL/OKLCH dark-mode gradients.

### Logical Interfaces
* **Zustand (`v5.0.13`)**: Global browser state store for toasts and transitions.
* **Zod (`v4.4.3`) & React Hook Form (`v7.75.0`)**: Schema-level inputs validation.
* **Recharts (`v3.8.1`)**: Beautiful interactive dashboard metrics charts.
* **Radix UI Primitives**: Accessible primitives driving dialogs, select panels, and tabs.

---

## 📂 Project Structure & Routes Map

The folder directory isolates routes based on accessibility and purpose using **Next.js App Router Route Groups**:

```text
src/
├── app/                        # Next.js Routing
│   ├── (public)/               # Public-facing views
│   │   ├── page.js             # Hero Landing Page (Unconstrained viewport)
│   │   └── (auth)/             # Auth Views (Restricted width Layout)
│   │       ├── login/          # Sign In Panel
│   │       ├── signup/         # Sign Up Panel
│   │       ├── forgot-password/# Recovery Initiator
│   │       └── reset-password/ # Password Reset Panel
│   ├── (protected)/app/        # Protected dashboard views (Edge Protected)
│   │   ├── dashboard/          # Performance overview & analytics charts
│   │   ├── goals/              # Employee goal drafts & logs
│   │   ├── approvals/          # Manager-side review sheets
│   │   ├── checkins/           # Weekly progress updates
│   │   ├── cycles/             # HR cycle configuration
│   │   ├── profile/            # Avatar upload & profile details
│   │   └── unauthorized/       # Access denied fallback
│   ├── api/                    # Serverless endpoints
│   └── globals.css             # OKLCH design variables & transitions
```

---

## ⚙️ Initial Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your Supabase configurations:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Database Migration
Deploy table schemas and RLS security policies:
1. Run the SQL migrations under `supabase/migrations/` to initialize schemas, foreign relations, and buckets.
2. Enable database triggers for real-time notifications by running `supabase/realtime.sql`.

### 4. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## ⚡ Quality Verifications

Run the automated compilation and validation checks before deploying:
```bash
npm run check
```
*Executes `eslint` checks followed by a full production compilation test (`next build`).*

---

## 📄 Architectural Guide
For an in-depth visual map, domain sequence charts, and detailed structural breakdown of the Edge Cookie Caching middleware and database services, consult [ARCHITECTURE.md](file:///home/akshit/Desktop/Portal/ARCHITECTURE.md).
