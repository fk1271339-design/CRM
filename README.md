# Faiz CRM — Sales CRM + Daily Sales Simulation

A full-featured internal sales CRM built with **Next.js 16 (App Router)**, **React 19**, **Prisma + SQLite**, **Zod**, and **Tailwind CSS v4**. Faiz Digital Solutions uses it to run its sales pipeline — with a fully automatic daily lead engine that keeps the CRM alive with five fresh, realistic Indian leads every day.

## Getting Started

```bash
npm install
npx prisma db push        # sync schema + generate Prisma client
npm run seed              # demo users/companies/deals
npm run dev               # http://localhost:3000
```

**Seed accounts** (password for all: `Password123!`)

| Role           | Email                    |
| -------------- | ------------------------ |
| Admin          | admin@faizdigital.com    |
| Sales Manager  | manager@faizdigital.com  |
| Salesperson    | sales@faizdigital.com    |

> `npm run seed` wipes the database. For a **production simulation**, run `prisma db push` (no seed) so the daily generator can fill leads organically.

## Daily Lead Generator (the heart of the simulation)

Every calendar day the CRM generates exactly **5 new realistic Indian leads** — real-sounding names, companies, ₹ deal values, sources, priorities and enquiry text pulled from `src/lib/lead-pool.ts`.

- **Deterministic**: the same date always picks the same 5 prospects (`getDailyLeadTemplates`), so rerunning never duplicates.
- **Idempotent**: one batch per calendar day enforced by the `DailyLeadGeneration` table (`date` is uniquely indexed). Hitting the endpoint twice → second call is a no-op.
- **Round-robin assignment**: leads are balanced across all `SALESPERSON`/`SALES_MANAGER` users by current workload.
- **Zero-config CRM**: every generated lead gets an activity entry, a notification for the assigned rep, and an auto-created PENDING "Initial follow-up" task due today.
- **Duplicate safety**: same email or same person+company in the slot is skipped so the pool never creates doubles.

### How to trigger it

1. **Manual (admin)** — Settings → *Daily Lead Generator* → "Generate Today's Leads".
2. **Cron/auto** — call `GET /api/cron/daily-leads` with header `Authorization: Bearer <CRON_SECRET>`. Add `CRON_SECRET` to `.env` and schedule a daily job (e.g. 9:00 AM IST):

   ```bash
   # GitHub Actions / Windows Task Scheduler / Vercel Cron example
   curl -X GET https://your-host/api/cron/daily-leads -H "Authorization: Bearer $CRON_SECRET"
   ```

   If `CRON_SECRET` is empty, the endpoint runs unguarded (local dev only — set it in production).

## The "no manual work" deal automation

Closing a deal **automatically syncs its linked lead** — the sales team never touches the lead status again:

- Deal → **WON** ⇒ lead flips to **CONVERTED**, an onboarding task is created for the deal owner, and the win is broadcast to admins/managers.
- Deal → **LOST** ⇒ lead flips to **LOST** (unless already converted), with the lost reason recorded.

This runs server-side inside the deal actions (`src/actions/deals.ts` → `applyDealOutcomeToLead`) for **anything** that changes a deal's stage — kanban drag, stage dropdown, or the edit modal.

## Features

- **Leads** — list (search/filter by status), detail page with an **activity timeline**, notes, follow-up tasks, assignment, and **one-click conversion**.
- **True conversion** — a lead becomes a real **Contact**, **Company** and **Deal** in a single transaction (`convertLead`).
- **Deals** — kanban pipeline, INR everywhere, edit modal with stage + lost-reason select, per-deal value-change audit, and the auto-sync above.
- **Contacts & Companies** — full CRUD with dedupe, plus Contacts on a card grid.
- **Dashboard** — Today's Leads, **Work Queue** (unworked NEW leads, oldest first), follow-ups due/overdue in 24 h, and a revenue strip separating **Won Revenue**, **Open Pipeline** and **Probability-weighted Expected Value**.
- **Analytics** — conversion funnel, lead-source quality (% converted per source), win/loss rate, pipeline value by stage. All scoped by RBAC.
- **Notifications** — bell + 60-second poll; deal outcomes, conversions, assignments and daily entries all notify.
- **RBAC** — every server action guards with the matrix in `src/lib/permissions.ts` (own / team / all).

## Project Layout

```
src/
  actions/            Server actions (permission-guarded)
    deals.ts          Deal CRUD + WON/LOST → lead auto-sync
    leads.ts          Lead CRUD/status
    lead-detail.ts    Lead timeline, conversion, notes, activities, assignment
    lead-generation.ts  Auto-lead engine + manual trigger
    dashboard.ts      Aggregated dashboard stats
  app/
    (dashboard)/      Dashboard pages (dashboard, leads, leads/[id], deals, …)
    api/cron/daily-leads/route.ts   Scheduled daily generator endpoint
  components/
    leads/            Lead list + detail (timeline, convert, activity modals)
    deals/            Kanban with create/edit modal and lost-reason select
    settings/         Daily Lead Generator panel
    shared/           Topbar, AutoRefresh
  lib/
    lead-pool.ts      60 realistic Indian lead templates (source of daily batch)
    permissions.ts    Role × action permission matrix
    format.ts         ₹ / DD Mon YYYY helpers
prisma/
  schema.prisma       Data model (Lead, Deal, Contact, Company, Task, Activity, …)
  seed.ts             Demo data
```

## Tech Notes

- Next.js 16 conventions apply: `params`/`searchParams` are `Promise`s, auth lives in `src/proxy.ts`.
- Client components avoid polling and `router.refresh()` on hot paths — key-based remounts (`key="query|status"`) isolate search/filter state.
- `npx prisma generate` can fail with an `EPERM … query_engine-windows.dll.node` lock while `next dev` is running — stop `next dev`, regenerate, restart.