// =====================================================================
// Funzioni di formattazione usate in tutte le pagine.
// Tenerle in un solo posto garantisce che importi e date appaiano
// sempre nello stesso modo (come nelle fatture reali).
// =====================================================================

// 482.72 → "$482.72"
export function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value ?? 0));
}

// "2026-09-26" → "26-Sep-26" (stesso formato delle fatture attuali)
export function formatDate(isoDate) {
  if (!isoDate) return "";
  // T00:00 evita che il fuso orario sposti la data al giorno prima
  const date = new Date(`${isoDate}T00:00:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-AU", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

// Colori dei badge per lo stato della fattura
export const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  void: "bg-red-100 text-red-700",
};
