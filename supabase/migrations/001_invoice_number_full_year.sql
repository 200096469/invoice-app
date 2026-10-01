-- =====================================================================
-- Migrazione 001 — numero fattura con l'anno completo
--   prima: 53/26      dopo: 53/2026
--
-- Da eseguire UNA volta nel SQL Editor di Supabase, sul database
-- creato con la prima versione di schema.sql.
-- (Un database nuovo creato con lo schema.sql aggiornato non ne ha bisogno.)
--
-- Perché tanti passaggi: invoice_number è una colonna GENERATA e
-- Postgres non permette di cambiarne la formula. Bisogna:
--   1. togliere la vista invoice_totals, che usa la colonna
--   2. eliminare la colonna e ricrearla con la nuova formula
--   3. ricreare la vista identica a prima
-- Tutto dentro una transazione: o riesce tutto, o non cambia nulla.
-- I dati delle fatture (numeri, anni, righe) non vengono toccati.
-- =====================================================================
begin;

drop view if exists invoice_totals;

alter table invoices drop column invoice_number;

alter table invoices
  add column invoice_number text
  generated always as (sequence_number::text || '/' || year::text) stored;

create view invoice_totals
with (security_invoker = true) as
with sums as (
  select
    i.id,
    coalesce(sum(it.quantity * it.unit_price), 0) as subtotal,
    coalesce(sum(it.quantity * it.unit_price)
             filter (where it.gst_applicable), 0) as gst_base
  from invoices i
  left join invoice_items it on it.invoice_id = i.id
  group by i.id
)
select
  i.*,
  c.client_code,
  c.client_type,
  c.contact_name as client_name,
  round(s.subtotal, 2)::numeric(12,2) as subtotal,
  case when i.gst_included then i.gst_rate else 0 end as tax_rate,
  case when i.gst_included then round(s.gst_base * i.gst_rate / 100, 2)
       else 0 end::numeric(12,2) as tax_amount,
  (round(s.subtotal, 2)
   + case when i.gst_included then round(s.gst_base * i.gst_rate / 100, 2) else 0 end
   + i.other_amount)::numeric(12,2) as total
from invoices i
join sums s    on s.id = i.id
join clients c on c.id = i.client_id;

commit;

-- Verifica: i numeri ora hanno l'anno completo (es. 1/2026)
select invoice_number, client_name, total from invoice_totals order by year, sequence_number;
