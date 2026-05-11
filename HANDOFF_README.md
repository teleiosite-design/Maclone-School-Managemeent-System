# Backend/API Handoff Guide

This document summarizes backend/platform work completed so far and gives a step-by-step guide for frontend API integration.

## Have you finished your backend part?

**Short answer:** You have completed the backend foundation and handoff artifacts; remaining work is mainly live environment execution + FE data wiring.

### Completed backend/platform scope
1. **Supabase project scaffolding in repo**
   - `.env.example` with required frontend env variables.
   - `supabase/README_SETUP.md` setup instructions.
2. **Canonical migration path**
   - `supabase/migrations/20260511_slices_1_3.sql` added as canonical schema migration for slices 1–3.
   - `supabase/schema.sql` now points to migration-based source.
3. **Backend planning + reference docs**
   - `BACKEND_API_PLAN.md` for endpoint/domain roadmap.
   - `BACKEND_SLICES.md` summarizing slices and integration assumptions.
4. **UI endpoints-ready pages (still mock data)**
   - Teacher clockin route/page present.
   - Admin attendance matrix tabs present.

---

## What your teammate should do now (Frontend integration track)

## 1) Environment setup
1. Create `.env` from `.env.example`.
2. Set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Ensure project is running with those values loaded.

## 2) Confirm backend schema is applied
1. In Supabase SQL editor, apply `supabase/migrations/20260511_slices_1_3.sql`.
2. Verify key tables exist:
   - `profiles`, `user_roles`
   - `teachers`, `classes`, `students`, `subjects`, `class_subjects`, `enrollments`, `timetable_entries`, `parent_student_links`
   - `attendance_policy`, `attendance_logs`, `attendance_anomalies`, `student_attendance`

## 3) Frontend integration order (recommended)
1. **Auth/profile bootstrap**
   - Replace mock login assumptions with real session + role reads.
2. **Teacher Clockin-Clockout page**
   - Replace local state writes with insert/update on `attendance_logs`.
   - Load history rows from `attendance_logs`.
3. **Admin Attendance page**
   - Surveillance tab: query `attendance_logs` (+ teacher/profile joins if needed).
   - Anomaly tab: query `attendance_anomalies`.
   - Policy tab: read/update `attendance_policy` row `id=1`.
4. **Admissions page**
   - Submit to `admissions` table/API.

## 4) File-level mapping for teammate
- `src/pages/dashboard/teacher/ClockinClockout.tsx`
  - Replace `checkIn/checkOut/mockHistory` local placeholders with backend calls.
- `src/pages/dashboard/admin/Attendance.tsx`
  - Replace `generateStudents`, `anomalyRows`, local filters with backend queries + server pagination.
- `src/pages/auth/Login.tsx`
  - Replace role-only redirect assumptions with real auth state + role-based route navigation.

## 5) API integration checklist for teammate
- [ ] Add shared client (`supabase client` or API wrapper)
- [ ] Add query hooks for attendance logs/anomalies/policy
- [ ] Add mutations for clock-in/clock-out/policy update
- [ ] Add loading/empty/error states per tab
- [ ] Add optimistic UI only where safe
- [ ] Add pagination (`limit <= 50`) for heavy lists

## 6) Collaboration contract between BE and FE
- Backend owner (you):
  - Keep migrations additive and announce breaking changes early.
  - Share final table/column changes before teammate wires each page.
- Frontend owner (teammate):
  - Use centralized API client/hooks.
  - Avoid hardcoding table shape in many places.

## 7) Definition of done for this phase
- Teacher can clock in/out and see persisted history.
- Admin sees live surveillance and anomalies data.
- Admin can update attendance policy and see changes persisted.
- No mock attendance data remains in integrated pages.
- Role-based access works for admin/teacher/student/parent accounts.

---

## Suggested next checkpoint
After teammate integrates the three priority pages, run a joint QA pass:
1. Admin account validation
2. Teacher account validation
3. Student/parent read-restriction validation
4. Performance sanity checks (query limits + pagination)


## 8) Remaining backend items now implemented in repo artifacts
- Seed scripts aligned: `supabase/seeds/001_core_seed.sql`
- RLS verification matrix script: `supabase/tests/rls_verification_matrix.sql`
- FE-facing stable payload contract: `api-contract/openapi.yaml`
- Canonical schema migration remains: `supabase/migrations/20260511_slices_1_3.sql`

These artifacts support live validation and FE integration handoff.
