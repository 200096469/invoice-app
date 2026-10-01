"use client";
// =====================================================================
// Anteprima di stampa — ROUTE DINAMICA /invoices/[id]/print
//
// Seconda route dinamica, annidata dentro [id]: la cartella "print"
// sta dentro "[id]", quindi l'id arriva sempre da useParams.
//
// Impaginazione copiata dalle fatture reali (formato A4).
// Il pulsante "Print / Save as PDF" apre la finestra di stampa del
// browser: scegliendo "Salva come PDF" si ottiene il file da inviare.
// Le classi "print:hidden" nascondono menu e pulsanti nella stampa.
// =====================================================================
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  formatCurrency,
  formatDate,
  formatDayMonth,
  formatQuantity,
  formatTime,
} from "@/lib/format";

export default function InvoicePrintPage() {
  const { id } = useParams();

  const [settings, setSettings] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  // Carica i dati quando la pagina si apre o cambia l'id
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setNotFound(false);
      setError(null);

      if (!/^\d+$/.test(id)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Dati dell'attività (intestazione e coordinate bancarie) + fattura
      const [settingsResult, invoiceResult] = await Promise.all([
        supabase.from("settings").select("*").maybeSingle(),
        supabase.from("invoice_totals").select("*").eq("id", id).maybeSingle(),
      ]);

      if (settingsResult.error || invoiceResult.error) {
        setError((settingsResult.error || invoiceResult.error).message);
        setLoading(false);
        return;
      }
      if (!invoiceResult.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const [clientResult, itemsResult] = await Promise.all([
        supabase.from("clients").select("*").eq("id", invoiceResult.data.client_id).single(),
        supabase
          .from("invoice_items")
          .select("*, care_recipients(full_name, address)")
          .eq("invoice_id", id)
          .order("position"),
      ]);

      if (clientResult.error || itemsResult.error) {
        setError((clientResult.error || itemsResult.error).message);
        setLoading(false);
        return;
      }

      setSettings(settingsResult.data);
      setInvoice(invoiceResult.data);
      setClient(clientResult.data);
      setItems(itemsResult.data);
      setLoading(false);
    }

    loadData();
  }, [id]);

  // Secondo useEffect: il titolo della scheda diventa il nome proposto
  // per il PDF, es. "Invoice_1-26_CLI001"
  useEffect(() => {
    if (invoice && client) {
      document.title = `Invoice_${invoice.invoice_number.replace("/", "-")}_${client.client_code}`;
    }
    return () => {
      document.title = "Invoice App";
    };
  }, [invoice, client]);

  if (loading) return <p className="text-gray-500">Loading invoice...</p>;

  if (notFound) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Invoice not found</h1>
        <p className="text-gray-600">There is no invoice with ID “{id}”.</p>
        <Link href="/" className="text-blue-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (error) return <p className="text-red-600">Could not load the invoice: {error}</p>;

  // Con GST attiva la fattura diventa "Tax Invoice"
  const title = invoice.gst_included ? "TAX INVOICE" : "INVOICE";
  const business = settings ?? {};

  return (
    <div className="space-y-4">
      {/* Barra degli strumenti: visibile solo a schermo */}
      <div className="flex items-center gap-2 print:hidden">
        <Link
          href={`/invoices/${invoice.id}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Back to invoice
        </Link>
        <button
          onClick={() => window.print()}
          className="ml-auto rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Il "foglio" A4 */}
      <article className="invoice-sheet mx-auto bg-white p-10 text-[13px] leading-snug text-gray-900 shadow-sm ring-1 ring-gray-200 print:p-0 print:shadow-none print:ring-0">
        {/* Intestazione: attività a sinistra, titolo e numeri a destra */}
        <header className="flex justify-between gap-8">
          <div>
            <p className="text-2xl font-bold">{business.owner_name}</p>
            {business.business_description && (
              <p className="font-semibold uppercase tracking-wide text-gray-600">
                {business.business_description}
              </p>
            )}
            {business.abn && <p>A.B.N. {business.abn}</p>}
            {business.address && <p className="mt-2">{business.address}</p>}
            {business.phone && <p>Mobile: {business.phone}</p>}
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold tracking-wide text-gray-700">{title}</p>
            <table className="ml-auto mt-3 text-left">
              <tbody>
                <tr>
                  <td className="pr-3 font-semibold">DATE:</td>
                  <td>{formatDate(invoice.issue_date)}</td>
                </tr>
                <tr>
                  <td className="pr-3 font-semibold">INVOICE #</td>
                  <td>{invoice.invoice_number}</td>
                </tr>
                <tr>
                  <td className="pr-3 font-semibold">Customer ID</td>
                  <td>{client.client_code}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        {/* BILL TO */}
        <section className="mt-8">
          <p className="mb-1 inline-block bg-gray-800 px-2 py-0.5 text-xs font-bold text-white">BILL TO:</p>
          <p className="font-semibold">{client.contact_name}</p>
          {client.company && <p>{client.company}</p>}
          {client.address && <p>{client.address}</p>}
          {client.phone && <p>Phone: {client.phone}</p>}
          {client.email && <p>email: {client.email}</p>}
          {client.abn && <p>ABN: {client.abn}</p>}
        </section>

        {invoice.period_title && (
          <p className="mt-6 font-semibold">{invoice.period_title}</p>
        )}

        {/* Righe: DESCRIPTION | AMOUNT */}
        <table className="mt-3 w-full border-collapse">
          <thead>
            <tr className="bg-gray-800 text-xs text-white">
              <th className="px-2 py-1 text-left font-bold">DESCRIPTION</th>
              <th className="w-28 px-2 py-1 text-right font-bold">RATE</th>
              <th className="w-24 px-2 py-1 text-right font-bold">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="break-inside-avoid border-b border-gray-200 align-top">
                <td className="px-2 py-2">
                  {/* "22.09 – Nome - Indirizzo" come nelle fatture reali */}
                  {item.care_recipients && item.item_type === "service" && (
                    <p className="font-semibold">
                      {formatDayMonth(item.service_date)} – {item.care_recipients.full_name} -{" "}
                      {item.care_recipients.address}
                    </p>
                  )}
                  {item.item_type === "mileage" && item.route && (
                    <p>
                      {formatDayMonth(item.service_date)} {item.route}
                    </p>
                  )}
                  <p>{item.description}.</p>
                  {item.start_time && (
                    <p>
                      Time: {formatTime(item.start_time)} to {formatTime(item.end_time)}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right">
                  {formatQuantity(item.quantity)} {item.unit} @ {formatCurrency(item.unit_price)}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right">
                  {formatCurrency(item.quantity * item.unit_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* In basso: commenti/pagamento a sinistra, totali a destra */}
        <section className="mt-6 flex break-inside-avoid justify-between gap-8">
          <div className="max-w-sm flex-1 border border-gray-300">
            <p className="bg-gray-800 px-2 py-0.5 text-xs font-bold text-white">OTHER COMMENTS</p>
            <div className="space-y-1 p-2">
              {invoice.comments && <p className="whitespace-pre-line">{invoice.comments}</p>}
              <p>Please EFT funds into:</p>
              <p>
                {business.bank_name} BSB: {business.bank_bsb} Acct: {business.bank_account_number}
              </p>
              <p>{business.bank_account_name}</p>
              <p className="pt-1 font-semibold">
                Terms: {business.payment_terms_days ?? 14} Days Payment
              </p>
            </div>
          </div>

          <table className="w-56 self-start">
            <tbody>
              <tr>
                <td className="py-0.5">SUBTOTAL</td>
                <td className="py-0.5 text-right">{formatCurrency(invoice.subtotal)}</td>
              </tr>
              <tr>
                <td className="py-0.5">TAX RATE</td>
                <td className="py-0.5 text-right">{Number(invoice.tax_rate).toFixed(1)}%</td>
              </tr>
              <tr>
                <td className="py-0.5">TAX</td>
                <td className="py-0.5 text-right">{formatCurrency(invoice.tax_amount)}</td>
              </tr>
              <tr>
                <td className="py-0.5">OTHER</td>
                <td className="py-0.5 text-right">{formatCurrency(invoice.other_amount)}</td>
              </tr>
              <tr className="border-t-2 border-gray-800 text-base font-bold">
                <td className="pt-1">TOTAL</td>
                <td className="pt-1 text-right">{formatCurrency(invoice.total)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Piè di pagina */}
        <footer className="mt-10 text-center">
          <p>If you have any questions about this invoice, please contact</p>
          <p>{business.email}</p>
          <p className="mt-2 font-bold italic">{business.footer_message}</p>
        </footer>
      </article>
    </div>
  );
}
