# 03 — Presentation Guide

Target: **4–6 minutes** live demo + questions. The app must run live with **sample data only**.

## Before class (checklist)

- [ ] Laptop charged, project folder open in VS Code
- [ ] `npm run dev` running, `http://localhost:3000` open in the browser
- [ ] Logged in with the demo account (`demo@invoiceapp.test`)
- [ ] Supabase dashboard open in a second tab (Table Editor), **demo project only**
- [ ] GST switched **off** in Settings
- [ ] One invoice ready to edit, one draft to delete (optional)
- [ ] Browser zoom at 110–125% so the class can read the screen
- [ ] Full run-through done once, timed

## Talk outline

### 1. The problem and the idea (≈ 45 s)

- My wife runs a small cleaning and aged care business and invoices her clients every week.
- She typed every invoice by hand: same names, addresses, services and rates every week, totals with a calculator.
- I built a web app that stores everything once and produces the invoice automatically.

### 2. Live demo (≈ 2½ min)

1. **Dashboard** → latest invoices loaded from Supabase.
2. Click an invoice → **`/invoices/1`** (first dynamic route). Point at the URL: "the `1` in the URL is the ID used to fetch this invoice".
3. Change the URL to **`/invoices/2`** → different data. Then **`/invoices/999`** → "Invoice not found" (fails gracefully).
4. Click the client name → **`/clients/1`** (second dynamic route): care recipients, custom rates, invoices.
5. **New invoice** → choose a client → **Copy last invoice** (lines moved one week).
   - Change a date to a **Saturday** → service switches to *Weekend*, rate goes up.
   - Make two times overlap → red warning, saving is blocked.
6. **Save** → open **Print preview** → the A4 invoice, ready to save as PDF.

### 3. The Supabase table (≈ 30 s)

- Show `invoices` and `invoice_items` in the Table Editor.
- "Each invoice has many items; the totals are calculated by a database view, never typed."

### 4. How data flows from Supabase to the screen (≈ 45 s)

On every dynamic page:

```js
const { id } = useParams();                    // 1. read the ID from the URL
const [invoice, setInvoice] = useState(null);  // 2. a place to keep the data
useEffect(() => {                              // 3. fetch when the page opens
  supabase.from('invoice_totals').select('*').eq('id', id).maybeSingle()
    .then(({ data }) => setInvoice(data));     // 4. store it → React re-renders
}, [id]);                                      // 5. run again if the ID changes
```

All three hooks only work in a Client Component, so the file starts with `"use client"`.

### 5. One design decision (≈ 30 s) — choose one

- **The rate rule (`get_rate()`)**: care recipient rate → client rate → default rate. One database function used by the whole app, and the rate is copied into the line so old invoices never change.
- **One form for new and edit**: `InvoiceForm` is shared by `/invoices/new` and `/invoices/[id]/edit`.
- **Invoices are voided, not deleted**: no gaps in numbering, records kept as the ATO expects.

### 6. One challenge and how I solved it (≈ 30 s) — choose one

- **Login always failed**: the Supabase URL in `.env.local` ended with `/rest/v1/`. The client adds that path itself, so login requests went to a wrong address. I changed the error message to show Supabase's real error, found the cause, and fixed the URL.
- **Being in two places at once**: the app accepted overlapping visits. I added a check while typing and a database check across all invoices before saving.
- **Dates shifting by one day**: converting dates through UTC moved them a day back in Australia. I wrote date helpers that work on `YYYY-MM-DD` strings in local time.

## Likely questions

| Question | Short answer |
|----------|--------------|
| Why Client Components and not Server Components? | The project requires `useState`, `useEffect` and `useParams`, which only work in Client Components; and the login session lives in the browser. |
| Is the data safe? | Row Level Security: without login every query returns nothing. Real data lives only in a separate Supabase project, never in GitHub. |
| What happens if the ID doesn't exist? | `maybeSingle()` returns `null` instead of an error, and the page shows "not found". |
| How is the PDF made? | A print layout (A4, `@media print`) and the browser's "Save as PDF". |
| Why is the total not stored in the table? | It's calculated by the `invoice_totals` view, so it can never disagree with the lines. |
| What about GST? | One setting. New invoices become Tax Invoices; old ones never change. |
