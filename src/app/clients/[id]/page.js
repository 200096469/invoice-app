"use client";
// =====================================================================
// Scheda cliente — ROUTE DINAMICA /clients/[id]
//
// Stesso schema di /invoices/[id]:
//   useParams → id dall'URL
//   useEffect → query a Supabase quando cambia l'id
//   useState  → dati, caricamento, errori
//
// Qui le query sono quattro, tutte filtrate con l'id del cliente:
//   1. il cliente
//   2. i suoi assistiti
//   3. le sue fatture (con i totali dalla vista)
//   4. le tariffe personalizzate (del cliente e dei suoi assistiti)
// =====================================================================
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency, formatDate, STATUS_STYLES } from "@/lib/format";

export default function ClientDetailPage() {
  const { id } = useParams();

  const [client, setClient] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadClient() {
      setLoading(true);
      setNotFound(false);
      setError(null);

      if (!/^\d+$/.test(id)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Query 1: il cliente con l'id dell'URL
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (clientError) {
        setError(clientError.message);
        setLoading(false);
        return;
      }
      if (!clientData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Query 2-3 in parallelo: assistiti e fatture del cliente
      const [recipientsResult, invoicesResult] = await Promise.all([
        supabase
          .from("care_recipients")
          .select("*")
          .eq("client_id", id)
          .order("full_name"),
        supabase
          .from("invoice_totals")
          .select("id, invoice_number, issue_date, period_start, period_end, status, total")
          .eq("client_id", id)
          .order("issue_date", { ascending: false }),
      ]);

      if (recipientsResult.error || invoicesResult.error) {
        setError((recipientsResult.error || invoicesResult.error).message);
        setLoading(false);
        return;
      }

      // Query 4: tariffe personalizzate del cliente OPPURE dei suoi assistiti.
      // .or(...) = condizione "A oppure B" in un'unica query.
      // services(...) e care_recipients(...) aggiungono i nomi leggibili.
      const recipientIds = recipientsResult.data.map((r) => r.id);
      let ratesFilter = `client_id.eq.${id}`;
      if (recipientIds.length > 0) {
        ratesFilter += `,care_recipient_id.in.(${recipientIds.join(",")})`;
      }
      const { data: ratesData, error: ratesError } = await supabase
        .from("rates")
        .select("id, rate, notes, client_id, services(description, unit, default_rate), care_recipients(full_name)")
        .or(ratesFilter);

      if (ratesError) {
        setError(ratesError.message);
        setLoading(false);
        return;
      }

      setClient(clientData);
      setRecipients(recipientsResult.data);
      setInvoices(invoicesResult.data);
      setRates(ratesData);
      setLoading(false);
    }

    loadClient();
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading client...</p>;

  if (notFound) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Client not found</h1>
        <p className="text-gray-600">There is no client with ID “{id}”.</p>
        <Link href="/" className="text-blue-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (error) return <p className="text-red-600">Could not load the client: {error}</p>;

  // Riepilogo calcolato dalle fatture già caricate (le annullate non contano)
  const activeInvoices = invoices.filter((inv) => inv.status !== "void");
  const totalInvoiced = activeInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const outstanding = activeInvoices
    .filter((inv) => inv.status === "sent")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">{client.contact_name}</h1>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {client.client_code}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            client.client_type === "private" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {client.client_type}
        </span>
        {!client.active && (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">inactive</span>
        )}
      </div>

      {/* Contatti + riepilogo */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Contact details</h2>
          {client.company && <p className="font-medium text-gray-900">{client.company}</p>}
          {client.address && <p className="text-gray-700">{client.address}</p>}
          {client.phone && <p className="text-gray-700">Phone: {client.phone}</p>}
          {client.email && <p className="text-gray-700">Email: {client.email}</p>}
          {client.abn && <p className="text-gray-700">ABN: {client.abn}</p>}
        </section>

        <section className="grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-gray-900">{activeInvoices.length}</p>
            <p className="text-xs text-gray-500">Invoices</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalInvoiced)}</p>
            <p className="text-xs text-gray-500">Total invoiced</p>
          </div>
          <div>
            <p className={`text-2xl font-semibold ${outstanding > 0 ? "text-amber-600" : "text-gray-900"}`}>
              {formatCurrency(outstanding)}
            </p>
            <p className="text-xs text-gray-500">Awaiting payment</p>
          </div>
        </section>
      </div>

      {/* Assistiti */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 px-4 py-3 font-medium text-gray-900">
          Care recipients ({recipients.length})
        </h2>
        {recipients.length === 0 ? (
          <p className="px-4 py-6 text-gray-500">No care recipients yet.</p>
        ) : (
          <ul>
            {recipients.map((recipient) => (
              <li key={recipient.id} className="flex justify-between gap-4 border-t border-gray-100 px-4 py-2 first:border-t-0">
                <span className="font-medium text-gray-900">{recipient.full_name}</span>
                <span className="text-right text-gray-500">{recipient.address}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tariffe personalizzate */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 px-4 py-3 font-medium text-gray-900">Custom rates</h2>
        {rates.length === 0 ? (
          <p className="px-4 py-6 text-gray-500">This client uses the default rates for every service.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Applies to</th>
                <th className="px-4 py-2 text-right font-medium">Default</th>
                <th className="px-4 py-2 text-right font-medium">Custom rate</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{rate.services.description}</td>
                  <td className="px-4 py-2">
                    {rate.care_recipients ? rate.care_recipients.full_name : "Whole client"}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-400 line-through">
                    {formatCurrency(rate.services.default_rate)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(rate.rate)} / {rate.services.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Fatture del cliente */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 px-4 py-3 font-medium text-gray-900">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="px-4 py-6 text-gray-500">No invoices for this client yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Invoice #</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/invoices/${invoice.id}`} className="font-medium text-blue-700 hover:underline">
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{formatDate(invoice.issue_date)}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(invoice.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
