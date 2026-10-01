"use client";
// =====================================================================
// Elenco fatture — /invoices
// Carica tutte le fatture una volta sola; i filtri (stato, cliente,
// anno) lavorano poi sui dati già in memoria, senza nuove query.
// I filtri sono semplici useState: ogni cambio ridisegna la tabella.
// =====================================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency, formatDate, STATUS_STYLES } from "@/lib/format";
import { financialYear, financialYearLabel, todayISO } from "@/lib/dateHelpers";

const STATUSES = ["all", "draft", "sent", "paid", "void"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtri scelti dall'utente
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all"); // anno fiscale (1 luglio – 30 giugno)

  useEffect(() => {
    async function loadInvoices() {
      const { data, error } = await supabase
        .from("invoice_totals")
        .select("id, invoice_number, year, sequence_number, client_id, client_code, client_name, issue_date, due_date, period_start, period_end, status, total")
        .order("year", { ascending: false })
        .order("sequence_number", { ascending: false });

      if (error) setError(error.message);
      else setInvoices(data);
      setLoading(false);
    }
    loadInvoices();
  }, []);

  // Opzioni dei filtri, ricavate dalle fatture caricate
  const clientOptions = [
    ...new Map(invoices.map((inv) => [inv.client_id, `${inv.client_code} – ${inv.client_name}`])),
  ].sort((a, b) => a[1].localeCompare(b[1]));
  // Anni fiscali australiani presenti, calcolati dalla data di emissione
  const yearOptions = [...new Set(invoices.map((inv) => financialYear(inv.issue_date)))].sort((a, b) => b - a);

  // Fatture che passano tutti i filtri
  const visible = invoices.filter(
    (inv) =>
      (statusFilter === "all" || inv.status === statusFilter) &&
      (clientFilter === "all" || String(inv.client_id) === clientFilter) &&
      (yearFilter === "all" || String(financialYear(inv.issue_date)) === yearFilter)
  );

  // Totali delle fatture visibili (le annullate non contano)
  const counted = visible.filter((inv) => inv.status !== "void");
  const sumOf = (list) => list.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalInvoiced = sumOf(counted);
  const totalPaid = sumOf(counted.filter((inv) => inv.status === "paid"));
  const totalOutstanding = sumOf(counted.filter((inv) => inv.status === "sent"));

  // Una fattura inviata e scaduta va evidenziata
  // (todayISO usa l'ora locale: toISOString userebbe UTC, un giorno indietro al mattino in Australia)
  const today = todayISO();
  const isOverdue = (inv) => inv.status === "sent" && inv.due_date && inv.due_date < today;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <Link href="/invoices/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
          New invoice
        </Link>
      </div>

      {/* Filtri */}
      <section className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1 text-sm capitalize ${
                statusFilter === status ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
          <option value="all">All clients</option>
          {clientOptions.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
          <option value="all">All financial years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {financialYearLabel(year)}
            </option>
          ))}
        </select>
      </section>

      {/* Riepilogo delle fatture visibili */}
      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalInvoiced)}</p>
          <p className="text-xs text-gray-500">Invoiced</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xl font-semibold text-green-700">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-gray-500">Paid</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className={`text-xl font-semibold ${totalOutstanding > 0 ? "text-amber-600" : "text-gray-900"}`}>
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="text-xs text-gray-500">Awaiting payment</p>
        </div>
      </section>

      {/* Tabella */}
      <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {loading && <p className="px-4 py-6 text-gray-500">Loading invoices...</p>}
        {error && <p className="px-4 py-6 text-red-600">Could not load invoices: {error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="px-4 py-6 text-gray-500">No invoices match these filters.</p>
        )}
        {!loading && !error && visible.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Invoice #</th>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 font-medium">Issued</th>
                <th className="px-4 py-2 font-medium">Due</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((inv) => (
                <tr key={inv.id} className={`border-t border-gray-100 hover:bg-gray-50 ${inv.status === "void" ? "text-gray-400" : ""}`}>
                  <td className="px-4 py-2">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-blue-700 hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/clients/${inv.client_id}`} className="hover:underline">
                      {inv.client_name}
                    </Link>{" "}
                    <span className="text-gray-400">({inv.client_code})</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                    {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">{formatDate(inv.issue_date)}</td>
                  <td className={`whitespace-nowrap px-4 py-2 ${isOverdue(inv) ? "font-medium text-red-600" : ""}`}>
                    {formatDate(inv.due_date)}
                    {isOverdue(inv) && " · overdue"}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status]}`}>{inv.status}</span>
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${inv.status === "void" ? "line-through" : ""}`}>
                    {formatCurrency(inv.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
