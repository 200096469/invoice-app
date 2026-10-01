# 01 — Project Plan

## The idea in one sentence

A web app that lets a care worker record her weekly services, store them in a database and print a professional invoice for each client.

## Why this idea

The invoices are currently written by hand in a document template every week. The same clients, addresses, services and rates are typed again and again, and totals are calculated manually. The app stores everything once and builds the invoice automatically.

## Pages

| Page                        | Route                     | Dynamic? | Purpose                                    |
|-----------------------------|---------------------------|----------|--------------------------------------------|
| Dashboard                   | `/`                       | No       | Latest invoices, quick "New invoice" button |
| Invoices list               | `/invoices`               | No       | All invoices with status and total         |
| Invoice detail              | `/invoices/[id]`          | **Yes**  | Lines, totals, status of one invoice       |
| Print preview               | `/invoices/[id]/print`    | **Yes**  | Invoice laid out for printing / PDF        |
| New invoice                 | `/invoices/new`           | No       | Form to create an invoice and its lines    |
| Clients list                | `/clients`                | No       | All clients (companies and private)        |
| Client detail               | `/clients/[id]`           | **Yes**  | Client data, care recipients, invoices     |
| Services and rates          | `/services`               | No       | Service catalogue and custom rates         |
| Settings                    | `/settings`               | No       | Business details, bank details, GST switch |
| Login                       | `/login`                  | No       | Sign in with email and password            |

## Dynamic routes and data

| Route                  | Parameter | Supabase query                                             |
|------------------------|-----------|------------------------------------------------------------|
| `/invoices/[id]`       | `id`      | `invoice_totals` where `id` = param + its `invoice_items`  |
| `/invoices/[id]/print` | `id`      | same as above + `settings` for the header and bank details |
| `/clients/[id]`        | `id`      | `clients` where `id` = param + `care_recipients` + `invoices` |

## Data flow (the pattern used on every dynamic page)

1. `useParams()` reads `id` from the URL.
2. `useState()` holds the fetched data, the loading flag and any error.
3. `useEffect()` runs the Supabase query when the page loads and again if `id` changes.
4. While loading, the page shows a loading message; if the record does not exist, it shows a friendly "Invoice not found" message.
5. When the data arrives, it is rendered as cards and tables.

## Requirements checklist

| # | Requirement           | How the app meets it                                              |
|---|-----------------------|-------------------------------------------------------------------|
| 1 | Next.js App Router    | All pages live in the `src/app/` folder                               |
| 2 | 2+ dynamic routes     | `/invoices/[id]`, `/invoices/[id]/print`, `/clients/[id]`         |
| 3 | Supabase fetching     | Each dynamic route fetches the record matching its `id`           |
| 4 | Display the data      | Invoice lines and totals in a table, client data in cards         |
| 5 | Client Components     | Dynamic pages and forms start with `"use client"`                 |
| 6 | useState / useEffect / useParams | Used together in the data flow above; `useState` also in the form |
| 7 | Presentation          | Live demo with invented sample data                               |

## Extra features (beyond the requirements)

- Creating and editing invoices (insert / update)
- Automatic hours from start and end time
- Custom rates per client and per care recipient (`get_rate()` function)
- GST switch for future registration
- Login and Row Level Security to protect personal data

## Phases

- [x] **Planning** — idea, pages, routes, database schema
- [ ] **Building** — Next.js project, Supabase connection, pages, print layout
- [ ] **Testing** — valid and invalid IDs, direct refresh, loading states, every link and button
- [ ] **Presentation** — rehearse the full demo once before class

## Testing plan

- Open `/invoices/1`, `/invoices/2` and `/clients/1`: the right data appears each time.
- Open `/invoices/999`: the page shows "Invoice not found" instead of crashing.
- Refresh the browser directly on a dynamic route: it still loads.
- Slow the network in DevTools: the loading message is visible.
- Print preview: one invoice fits cleanly on an A4 page.
