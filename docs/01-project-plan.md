# 01 — Project Plan

## The idea in one sentence

A web app that lets a care worker record her weekly services, store them in a database and print a professional invoice for each client.

## Why this idea

The invoices were written by hand in a document template every week. The same clients, addresses, services and rates were typed again and again, totals were calculated manually, and mistakes (wrong rate, wrong day, overlapping visits) were easy to make. The app stores everything once, applies the right rate automatically and builds the invoice.

## Pages

| Page                 | Route                   | Dynamic? | Purpose                                              |
|----------------------|-------------------------|----------|------------------------------------------------------|
| Login                | `/login`                | No       | Sign in with email and password                      |
| Dashboard            | `/`                     | No       | Latest invoices, "New invoice" button                |
| Invoices list        | `/invoices`             | No       | Filters by status, client, financial year; totals    |
| New invoice          | `/invoices/new`         | No       | Form to create an invoice and its lines              |
| Invoice detail       | `/invoices/[id]`        | **Yes**  | Lines, totals, status actions                        |
| Edit invoice         | `/invoices/[id]/edit`   | **Yes**  | Same form, pre-filled; number and date stay the same |
| Print preview        | `/invoices/[id]/print`  | **Yes**  | A4 invoice, print or save as PDF                     |
| Clients list         | `/clients`              | No       | All clients, "New client" form                       |
| Client detail        | `/clients/[id]`         | **Yes**  | Contacts, care recipients, custom rates, invoices    |
| Services & Rates     | `/services`             | No       | Service catalogue, weekend versions, custom rates    |
| Settings             | `/settings`             | No       | Business and bank details, GST, invoice numbering    |

## Dynamic routes and data

| Route                   | Parameter | Supabase query                                                         |
|-------------------------|-----------|------------------------------------------------------------------------|
| `/invoices/[id]`        | `id`      | `invoice_totals` where `id` = param, its client and `invoice_items`    |
| `/invoices/[id]/print`  | `id`      | same as above + `settings` for the header and bank details             |
| `/invoices/[id]/edit`   | `id`      | `invoices` and `invoice_items` where `invoice_id` = param              |
| `/clients/[id]`         | `id`      | `clients` where `id` = param + its care recipients, invoices and rates |

## Data flow (the pattern used on every dynamic page)

1. `useParams()` reads `id` from the URL.
2. `useState()` holds the fetched data, the loading flag and any error.
3. `useEffect()` runs the Supabase query when the page loads and again if `id` changes.
4. While loading, the page shows a loading message; if the record does not exist, it shows "Invoice not found" / "Client not found".
5. When the data arrives, it is rendered as cards and tables.

## Requirements checklist

| # | Requirement                       | How the app meets it                                                        |
|---|-----------------------------------|-----------------------------------------------------------------------------|
| 1 | Next.js App Router                | All pages live in `src/app/`                                                |
| 2 | 2+ dynamic routes                 | Four: `/invoices/[id]`, `/invoices/[id]/edit`, `/invoices/[id]/print`, `/clients/[id]` |
| 3 | Supabase fetching with the param  | Each dynamic route fetches the record whose `id` matches the URL            |
| 4 | Display the data                  | Tables, cards and an A4 invoice                                             |
| 5 | Client Components                 | Pages and forms start with `"use client"`                                   |
| 6 | useState / useEffect / useParams  | Used together on every dynamic route; `useState` also drives all forms      |
| 7 | Presentation                      | See `03-presentation-guide.md`                                              |

## Extra features (beyond the requirements)

- Creating, editing and deleting records (insert / update / delete)
- Login and Row Level Security to protect personal data
- Custom rates per client and per care recipient (`get_rate()` database function)
- Automatic weekend version of a service and its rate
- Hours calculated from start and end times
- Overlapping times blocked, in the same invoice and across all invoices
- "Copy last invoice" with dates moved to the new week
- Invoice status: draft → sent → paid / void, with VOID watermark
- GST switch for future registration ("Tax Invoice")
- Invoice numbers per calendar year (`53/2026`) with a configurable starting number
- Filters by Australian financial year (1 July – 30 June)
- Database changes tracked as migration files

## Phases

- [x] **Planning** — idea, pages, routes, database schema
- [x] **Building** — Next.js project, Supabase connection, pages, print layout
- [x] **Testing** — valid and invalid IDs, direct refresh, loading states, every form and button
- [ ] **Presentation** — rehearse the full demo once before class

## Testing log

| Test                                                               | Result |
|--------------------------------------------------------------------|--------|
| `/invoices/1`, `/invoices/2`, `/clients/1..3` show the right data  | ✅ |
| `/invoices/999`, `/invoices/abc` show "not found"                  | ✅ |
| Refresh (F5) directly on a dynamic route                           | ✅ |
| Rates: default, client, care recipient, private Km                 | ✅ |
| New invoice, copy last invoice, dates moved one week               | ✅ |
| Validation messages (no lines, end before start)                   | ✅ |
| Overlapping times in the same invoice and across invoices          | ✅ |
| Status actions, delete draft, VOID watermark                       | ✅ |
| Edit invoice keeps number and date                                 | ✅ |
| Weekend date switches to the weekend service and rate              | ✅ |
| GST on → Tax Invoice; starting number from Settings                | ✅ |
| Print preview on A4 and save as PDF                                | ✅ |
