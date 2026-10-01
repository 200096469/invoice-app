-- =====================================================================
-- Migrazione 002 — numero di partenza delle fatture
--
-- Quando l'app comincia a essere usata a metà anno, nel database non
-- ci sono le fatture già emesse a mano: l'app proporrebbe 1/2026 e
-- duplicherebbe un numero già usato.
-- Con queste due colonne si dice: "nel 2026 parti almeno da 54".
--   first_invoice_number  → numero minimo da usare
--   first_invoice_year    → anno a cui vale (gli anni dopo ripartono da 1)
--
-- Da eseguire UNA volta nel SQL Editor di Supabase.
-- (Un database nuovo creato con lo schema.sql aggiornato non ne ha bisogno.)
-- =====================================================================
alter table settings
  add column if not exists first_invoice_number int not null default 1
    check (first_invoice_number >= 1),
  add column if not exists first_invoice_year int;

-- Verifica
select first_invoice_number, first_invoice_year from settings;
