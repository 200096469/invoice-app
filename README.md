# Invoice App

A web app to create, store and print weekly invoices for a cleaning and aged care services business.

Built with **Next.js (App Router)** and **Supabase (Postgres)** for the *Build Advanced Interfaces* term break project.

## What it does

- Stores clients (companies and private clients), care recipients and services
- Applies custom hourly and mileage rates per client or per care recipient
- Creates weekly invoices with service lines (date, recipient, time, hours) and mileage lines (route, Km)
- Calculates subtotal, GST and total automatically
- Shows a print preview of each invoice that can be saved as PDF
- Ready for GST: a single setting switches new invoices to "Tax Invoice"

## Project structure

```
invoice-app/
├── README.md                    ← this file
├── docs/
│   ├── 01-project-plan.md       ← idea, pages, routes, requirements checklist
│   └── 02-database-schema.md    ← tables, relationships, rate rules
└── supabase/
    └── schema.sql               ← run once in the Supabase SQL Editor
```

The Next.js source code (`app/`, `components/`, `lib/`) will be added in the building phase.

## Database setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**.
3. Paste the full content of `supabase/schema.sql` and click **Run**.
4. Open **Table Editor** to check that the tables and sample data are there.
5. Go to **Authentication → Users → Add user** and create the login account.

The sample data is invented. Never use real client or care recipient data in the class demo.

## Tech stack

| Item      | Choice                         |
|-----------|--------------------------------|
| Framework | Next.js (App Router)           |
| Database  | Supabase (Postgres)            |
| Language  | JavaScript                     |
| PDF       | Browser print → Save as PDF    |
