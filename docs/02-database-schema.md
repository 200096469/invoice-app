# 02 — Database Schema

The full SQL is in [`../supabase/schema.sql`](../supabase/schema.sql). This page explains what each part does.

## Tables at a glance

```
settings            (1 row: business details, bank details, GST switch)

clients ──< care_recipients
   │              │
   │              └──< invoice_items >── services
   │                        │                │
   └──< invoices ───────────┘                │
                                             │
rates  (custom price for a service, ─────────┘
        per client OR per care recipient)
```

`──<` means "one to many": one client has many care recipients, one invoice has many items.

| Table             | What it stores                                                        |
|-------------------|-----------------------------------------------------------------------|
| `settings`        | Business name, ABN, address, bank details, GST switch, payment terms |
| `clients`         | Who pays the invoice ("BILL TO"). Type `company` or `private`        |
| `care_recipients` | The people who receive the service, each linked to a client          |
| `services`        | Catalogue of services with a default rate (mileage is a service too) |
| `rates`           | Custom rates that override the default                               |
| `invoices`        | One invoice per client per period (usually one week)                 |
| `invoice_items`   | The lines of an invoice: service, mileage or other                   |
| `invoice_totals`  | A **view** that calculates subtotal, GST and total                   |

## Key design decisions

### 1. Companies and private clients

A **company** pays for several care recipients. A **private** client pays for their own service, so the app also creates a care recipient with the same name and address. This way every invoice line works the same way.

### 2. Custom rates — the most specific rate wins

Some care recipients are paid at a higher rate than the company's usual rate, and private clients pay a different mileage rate. The `get_rate()` function picks the price in this order:

1. Rate set for the **care recipient**
2. Rate set for the **client / company**
3. **Default rate** of the service

The app calls it with one line:

```js
const { data: rate } = await supabase.rpc('get_rate', {
  p_care_recipient_id: recipientId,
  p_service_id: serviceId,
});
```

The rate is **copied** into the invoice line, so changing a rate later never changes old invoices.

### 3. Totals are calculated, never stored

The `invoice_totals` view adds up the lines every time it is read. The totals can never be out of sync with the lines.

### 4. Ready for GST

`settings.gst_registered` is `false` today. When it becomes `true`:

- new invoices copy `gst_included = true` and the GST rate (10%);
- old invoices keep `gst_included = false` and do not change;
- the print preview shows **"Tax Invoice"** and the GST line only when `gst_included` is true.

### 5. Invoice numbers

The number is built from `sequence_number` and `year`, e.g. `53/2026`. It is unique across all clients and restarts at 1 every calendar year (1 January).

### 6. Security

Row Level Security is enabled on every table: only a logged-in user can read or write. Without login the database looks empty, which protects the personal data of care recipients.

## Item types

| `item_type` | Used for                    | Fields used                                         |
|-------------|-----------------------------|-----------------------------------------------------|
| `service`   | A visit                     | date, care recipient, service, start/end time, hours |
| `mileage`   | Mileage reimbursement       | date, route, Km                                     |
| `other`     | Anything else               | description, quantity, price                        |

## Invoice status

`draft` → `sent` → `paid` (or `void` if cancelled)
