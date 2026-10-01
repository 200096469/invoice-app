# 04 — Going Live (free, for real business use)

How to publish the app for daily use on iPhone, iPad and computer, **at no cost**:

| Part | Service | Plan |
|------|---------|------|
| Database and login | Supabase | Free |
| Website hosting | Netlify (commercial use allowed on the free plan) | Free |
| App on the phone | "Add to Home Screen" (installable web app) | Free |

Keep the **school/demo** Supabase project for class. The real business uses a **separate** project.

## Branches: school vs business

| Branch       | Contains                                         | Used for                          |
|--------------|--------------------------------------------------|-----------------------------------|
| `main`       | The school project, exactly as presented         | Class presentation                |
| `production` | `main` + iPhone/iPad support + this guide        | The real app, published on Netlify |

- Working on the **school** project → switch to `main` (bottom-left corner of VS Code).
- Working on the **business** app → switch to `production`.
- Netlify publishes **only** the `production` branch, so changes on `main` never reach the real app.

---

## Step 1 — Create the real database (Supabase)

1. Sign in to [supabase.com](https://supabase.com) with a **personal** account (not the school one).
2. **New project**
   - Name: `invoice-app` (any name)
   - Database password: create a strong one and save it in a password manager
   - Region: **Sydney** (closest to Melbourne)
3. **SQL Editor → New query** → paste the whole of `supabase/schema-production.sql` → **Run**.
   This creates every table, the view, the rate function and the security rules — **without sample data**.

## Step 2 — Lock the login (important)

The app has only one user. Supabase allows anyone to **sign up** by default, and with the publishable key a stranger could create an account and then pass the "authenticated users only" rule. Turn sign-ups off:

1. **Authentication → Sign In / Providers** (or **Authentication → Settings**, depending on the dashboard version).
2. Turn **off** "Allow new users to sign up". Save.
3. **Authentication → Users → Add user → Create new user**: Michele's email and a strong password, tick **Auto Confirm User**.

> Do the same in the school/demo project too.

## Step 3 — Publish the website (Netlify)

1. Sign up at [netlify.com](https://www.netlify.com) **with GitHub** (free plan).
2. **Add new project → Import an existing project → GitHub** → choose the `invoice-app` repository.
3. Netlify detects Next.js by itself. In the build settings:
   - **Branch to deploy: `production`** (not `main`)
   - Build command: leave as suggested (`npm run build`)
4. **Before the first deploy**, add the environment variables (the build fails without them):

   | Key | Value (from the **real** Supabase project) |
   |-----|-----------------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-id>.supabase.co` — **no** `/rest/v1` at the end |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the **publishable** key (`sb_publishable_…`) — **never** the secret key |

5. **Deploy**. After a few minutes the app is online at an address like `https://random-name.netlify.app`.
6. Optional: **Project configuration → Change project name** to get a nicer address, e.g. `michele-invoices.netlify.app`.

From now on, every commit pushed to the **`production`** branch (`Sync Changes` in VS Code while on `production`) updates the online app automatically. Commits on `main` do not change it.

If the branch was not set during the import: **Project configuration → Build & deploy → Branches and deploy contexts → Production branch** → `production`.

> Your computer keeps using `.env.local`, which points to the **demo** project. Only Netlify uses the real one, so development and real data never mix.

## Step 4 — First setup in the app

Open the online address, sign in with Michele's account, then:

1. **Settings**: business name, description, ABN, address, mobile, email, bank details, payment terms.
   - **Invoice numbering**: *Start from* the next number after the last invoice written by hand (e.g. **54** in **2026**).
   - Leave **GST** off until the registration is active.
2. **Services & Rates**: add the services with their default rates, the weekend versions, and the mileage service (unit `Km`).
3. **Clients**: add each client; for companies, add their care recipients; then any custom rates.

## Step 5 — Install it on iPhone / iPad

1. Open the address in **Safari** (it must be Safari on iOS).
2. Tap **Share** (square with arrow) → **Add to Home Screen** → **Add**.
3. The **Invoices** icon appears on the Home Screen. It opens full screen, like an app, and stays signed in.

**Saving and sending the PDF from the phone:** open the invoice → **Print preview** → **Print / Save as PDF** → in the print screen tap **Share** → *Save to Files* or send it by Mail / Messages. If the print button does nothing when the app is opened from the Home Screen, open the same page in Safari and print from there.

---

## Good habits

- **Backups**: the free Supabase plan is not a backup service. Once a month, export the main tables (Table Editor → table → *Export to CSV*) or keep the PDFs of every invoice sent — business records are generally kept for 5 years.
- **Inactivity**: free Supabase projects can be **paused** after a period without activity. Weekly use normally prevents it; if it happens, open the Supabase dashboard and click **Restore**.
- **Real data never goes into GitHub**: the repository holds code and sample data only.
- **Updates**: on the `production` branch, test changes locally on the demo project first, then commit — Netlify publishes them automatically.
- **Bringing school improvements into the business app**: switch to `production`, then in Source Control choose **⋯ → Branch → Merge…** and pick `main`.
