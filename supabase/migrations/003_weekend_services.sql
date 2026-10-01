-- =====================================================================
-- Migrazione 003 — versione weekend dei servizi
--
-- Nel weekend la tariffa è più alta, e sulla fattura la descrizione
-- dice "Weekend" invece di "Weekday". Ogni servizio feriale può quindi
-- indicare il servizio da usare al sabato e alla domenica:
--   services.weekend_service_id → id del servizio "Weekend"
-- Il form delle fatture lo usa per cambiare servizio (e tariffa)
-- automaticamente quando la data della riga cade nel weekend.
--
-- Da eseguire UNA volta nel SQL Editor di Supabase.
-- =====================================================================
alter table services
  add column if not exists weekend_service_id bigint
    references services(id) on delete set null;

-- un servizio non può essere la versione weekend di sé stesso
alter table services
  drop constraint if exists services_weekend_not_self,
  add constraint services_weekend_not_self check (weekend_service_id <> id);

-- ---------------------------------------------------------------------
-- SOLO PER IL DATABASE DI PROVA: crea la versione Weekend del social
-- support (50 $/h) e la collega a quella Weekday.
-- Sul database reale questi collegamenti si fanno dalla pagina
-- Services & Rates.
-- ---------------------------------------------------------------------
insert into services (description, unit, default_rate)
select 'SAH Individual social support Weekend', 'hours', 50.00
where not exists (
  select 1 from services where description = 'SAH Individual social support Weekend'
);

update services
set weekend_service_id = (
  select id from services where description = 'SAH Individual social support Weekend'
)
where description = 'SAH Individual social support Weekday';

-- Verifica
select s.id, s.description, s.default_rate, w.description as weekend_version
from services s
left join services w on w.id = s.weekend_service_id
order by s.id;
