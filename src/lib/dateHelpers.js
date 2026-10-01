// =====================================================================
// Funzioni per date e orari usate dal form delle fatture.
// Lavorano su stringhe "YYYY-MM-DD" (il formato del database e dei
// campi <input type="date">) senza passare da UTC, così il fuso orario
// australiano non sposta mai le date di un giorno.
// =====================================================================

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Date JavaScript → "2026-09-21" (ora locale)
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// "2026-09-21" → Date JavaScript a mezzogiorno (evita problemi con l'ora legale)
function fromISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function todayISO() {
  return toISODate(new Date());
}

// "2026-09-21" + 6 → "2026-09-27"
export function addDays(iso, days) {
  const date = fromISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

// Giorni tra due date: daysBetween("2026-09-14", "2026-09-21") → 7
export function daysBetween(fromIso, toIso) {
  return Math.round((fromISODate(toIso) - fromISODate(fromIso)) / 86400000);
}

// Lunedì della settimana che contiene la data indicata
export function mondayOf(iso) {
  const date = fromISODate(iso);
  const day = date.getDay(); // 0 = domenica, 1 = lunedì...
  const shift = day === 0 ? -6 : 1 - day;
  return addDays(iso, shift);
}

// "10:30" → 630 (minuti dalla mezzanotte)
function toMinutes(time) {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

// Due fasce orarie si sovrappongono se una inizia prima che l'altra finisca.
// Orari consecutivi NON si sovrappongono: 07:00–11:00 e 11:00–13:00 → false
export function timesOverlap(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false;
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

// ---------------------------------------------------------------------
// Anno fiscale australiano: dal 1 luglio al 30 giugno dell'anno dopo.
// Lo identifichiamo con l'anno di INIZIO:
//   "2026-09-21" → 2026 (FY 2026–27)
//   "2027-03-10" → 2026 (FY 2026–27)
//   "2027-07-01" → 2027 (FY 2027–28)
// ---------------------------------------------------------------------
export function financialYear(iso) {
  const [year, month] = iso.split("-").map(Number);
  return month >= 7 ? year : year - 1;
}

// 2026 → "FY 2026–27"
export function financialYearLabel(startYear) {
  return `FY ${startYear}–${String(startYear + 1).slice(-2)}`;
}

// "10:00", "12:30" → 2.5 ore (null se gli orari mancano o non sono validi)
export function hoursBetween(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) return null;
  return Math.round((minutes / 60) * 100) / 100;
}

// 1 → "1st", 2 → "2nd", 23 → "23rd", 11 → "11th"
function ordinal(n) {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
  return `${n}${suffix}`;
}

// Titolo del periodo, come nelle fatture reali:
// "SEPTEMBER 2026 (for the week from September 21st to 27th 2026)"
// Più di 7 giorni → "weeks". Mesi diversi → nomina entrambi i mesi.
export function buildPeriodTitle(startIso, endIso) {
  if (!startIso || !endIso) return "";
  const start = fromISODate(startIso);
  const end = fromISODate(endIso);
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  const weekWord = daysBetween(startIso, endIso) > 6 ? "weeks" : "week";

  const endPart =
    start.getMonth() === end.getMonth()
      ? ordinal(end.getDate())
      : `${endMonth} ${ordinal(end.getDate())}`;

  return (
    `${startMonth.toUpperCase()} ${start.getFullYear()} ` +
    `(for the ${weekWord} from ${startMonth} ${ordinal(start.getDate())} ` +
    `to ${endPart} ${end.getFullYear()})`
  );
}
