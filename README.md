# Meclones Academy — School Management Platform

> A full-featured, role-based school management system for a premium Nigerian combined school (Nursery–SS3). Built with React 18, TypeScript, Vite 5, Tailwind CSS, and **Supabase**.

---

## 🚀 Recent Major Updates (May 2026)

The platform has transitioned from a mock-data prototype to a **live-data application** powered by **Supabase**.

### ✅ Real Authentication & Role-Based Routing
- **Provider**: Supabase Auth (Email/Password).
- **Session Management**: Persistent sessions via `AuthProvider` and `useAuth` hook.
- **Route Guards**: Dashboard routes are protected. Students cannot access Admin portals, and unauthenticated users are redirected to `/login`.
- **Automatic Redirects**: The login page now reads the user's role from their profile and automatically routes them to the correct portal (`/dashboard/admin`, `/dashboard/teacher`, etc.).

### ✅ Live Data Layer (Supabase Integration)
The following modules have been fully wired to the production database:
- **Teacher Clock-In/Out**: Real-time sign-in/out with 14-day history persistence in `attendance_logs`.
- **Admin → Teachers**: Displays live teaching staff with **Wifi status indicators** showing who is currently clocked in.
- **Admin → Students**: Full student roster with real-time enrollment and status management.
- **Announcements**: Multi-audience broadcast system with **Supabase Realtime** — new announcements pop up instantly on all active screens without refreshing.

### ✅ Database Schema
The system currently utilizes 11 core relational tables in Supabase:
- `profiles`, `students`, `teachers`, `parents`, `attendance_logs`, `student_attendance`, `announcements`, `timetable_slots`, `fees`, `subjects`, `classes`.

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript |
| **Backend / Auth** | **Supabase** (PostgreSQL + Realtime) |
| **State / Caching** | **TanStack Query v5** (Server State) + Zustand (UI State) |
| **Styling** | Tailwind CSS v3 + shadcn/ui |
| **Routing** | React Router DOM v6 |
| **Deployment** | **Vercel** (CLI-based) |

---

## ⚙️ Environment Setup

To run the project locally or deploy it, you **must** have a `.env` file in the root with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deployment (Vercel CLI)
Since the GitHub repository is on a separate account, use the **Vercel CLI** to push updates:

1. **Install CLI**: `npm install -g vercel`
2. **Login**: `vercel login`
3. **Link Project**: `vercel link` (choose `maclone-school-management-system`)
4. **Deploy to Prod**: `vercel --prod`

---

## 🔐 Administrative Access & Setup

If you are locked out or seeing "Infinite Recursion" errors, follow these steps:

### 1. Fix Database Security Policies (SQL Editor)
Run this in your Supabase SQL Editor to fix the infinite recursion loop in the `profiles` table:

```sql
-- Fix infinite recursion in profiles policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);
```

### 2. Set Admin Credentials
To set **admin@meclones.com** with password **admin123**:
1. Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file.
2. Run the setup script:
   ```bash
   node scripts/setup_admin.js
   ```

---

## 📂 File Structure (Supabase-Specific)

- `src/lib/supabase.ts`: Centralized Supabase client configuration.
- `src/lib/database.types.ts`: Auto-generated (or manual) TypeScript definitions for the DB schema.
- `src/hooks/useAuth.tsx`: Authentication provider and session logic.
- `src/components/ProtectedRoute.tsx`: Logic for blocking unauthorized access to dashboard routes.

---

## 📋 Road to Production (Remaining Tasks)

### 🟠 Phase 4: Financials & Academics
- [ ] **Fees Management**: Wire the Fees page to the `fees` table and integrate Paystack.
- [ ] **Timetable Editor**: Move the current Zustand timetable logic to the `timetable_slots` table.
- [ ] **Results / Grading**: Enable teachers to input grades that students/parents can view live.

### 🟠 Phase 5: Student & Parent Portals
- [ ] **Student Dashboard**: Connect "My Courses" and "My Results" to the database.
- [ ] **Parent Dashboard**: Enable "My Children" view to see linked student data (attendance, grades).

### 🟢 Polish
- [ ] **File Storage**: Set up Supabase Storage buckets for student photos and report PDFs.
- [ ] **Notifications**: Real-time toast notifications for new assignments or fee alerts.

---

## 👨‍💻 Contributing

1. **Pull latest**: `git pull origin main`
2. **Install deps**: `npm install`
3. **Run Dev**: `npm run dev`
4. **Deploy**: `vercel --prod` (after verifying changes locally)

---

*Meclones Academy School Management Platform — Moving education to the cloud.*
