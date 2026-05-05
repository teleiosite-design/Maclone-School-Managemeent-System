# Meclones Academy

A premium, conversion-focused digital platform for Meclones Academy — a Nursery–SS3 school established in 2003. This repository contains the public marketing website plus static UI shells for the school portal (Admin, Teacher, Student, Parent dashboards).

The design direction is **Bold Confident** — editorial typography, navy + gold palette, generous whitespace, and a calm, trusted feel comparable to top international schools.

---

## ✨ Features

### Public Website
- **Home** — rotating hero carousel (Welcome / Primary / Secondary), stats, school selector, value pillars, graduation feature, parent testimonials, CTA banner
- **Primary School** (Nursery – Primary 6) — programmes, approach, fees
- **Secondary School** (JSS1 – SS3) — programmes, approach, fees
- **About** — story, mission, leadership
- **Admissions** — process, requirements, application CTA
- **Fees** — transparent fee structure
- **News** — articles & announcements
- **Contact** — enquiry form, location, contact details

### Authentication (UI only)
- **Login** with role-based redirect (Admin / Teacher / Student / Parent)
- **Forgot Password** with success state

### Dashboard Shells (UI only)
- **Admin** — attendance, fee collection, activity, admissions queue
- **Teacher** — class performance, assignments, schedule
- **Student** — academic progress, courses, upcoming tests
- **Parent** — multi-child overview, fees, messages

> ⚠️ Backend is **not** wired up yet. All data is static. See _Roadmap_ below.

---

## 🛠 Tech Stack

- **React 18** + **TypeScript 5**
- **Vite 5** (dev server & build)
- **Tailwind CSS v3** with HSL semantic design tokens
- **shadcn/ui** + Radix primitives
- **React Router** for routing
- **Lucide React** for iconography
- **Fraunces** (display) + **Inter** (body) via Google Fonts

---

## 🎨 Design System

Defined in `src/index.css` and `tailwind.config.ts`. Always use semantic tokens — never hard-coded colors.

| Token   | Value                  | Use                       |
| ------- | ---------------------- | ------------------------- |
| `navy`  | `hsl(220 70% 14%)`     | Primary / text / surfaces |
| `gold`  | `hsl(44 80% 53%)`      | Accent / CTAs             |
| `cream` | `hsl(44 33% 96%)`      | Background                |

Utility classes:
- `.container-page` — max-width page container
- `.eyebrow` — small uppercase label
- `.display` — heavy display headings (Fraunces)

---

## 📁 Project Structure

```
src/
├── assets/                  # Hero & section images
├── components/
│   ├── site/                # Navbar, Footer, PageHero, CTABanner, SiteLayout
│   ├── dashboard/           # DashboardLayout, StatCard
│   └── ui/                  # shadcn primitives
├── pages/
│   ├── Home.tsx, Primary.tsx, Secondary.tsx, About.tsx,
│   ├── Admissions.tsx, Fees.tsx, News.tsx, Contact.tsx
│   ├── auth/                # Login, ForgotPassword
│   └── dashboard/           # Admin, Teacher, Student, Parent
├── App.tsx                  # Routes
├── index.css                # Design tokens
└── main.tsx
```

---

## 🚀 Getting Started

```bash
# Install
npm install

# Dev server
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

---

## 🗺 Roadmap

This is a static UI prototype. To take it to production:

1. **Lovable Cloud** — enable database, auth, storage, edge functions
2. **Real auth** — replace mock login; add roles via a `user_roles` table with RLS
3. **Admissions** — persist applications, file uploads, admin review queue
4. **Payments** — Paystack integration for fees
5. **Communications** — email/SMS notifications
6. **Dashboards** — wire to live data per role
7. **Legal** — Privacy, Terms, Refund, Cookie pages
8. **DevOps** — custom domain, email DKIM/SPF, backups

---

## 📄 License

Proprietary — © Meclones Academy.
