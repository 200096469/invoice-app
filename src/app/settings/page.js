"use client";
// =====================================================================
// Impostazioni — /settings
// Una sola riga nella tabella settings (id = 1) con:
//   - i dati dell'attività stampati in intestazione e a fondo fattura
//   - le coordinate bancarie e i giorni di pagamento
//   - la GST (oggi disattivata; quando si attiva, le NUOVE fatture
//     diventano "Tax Invoice" e quelle già emesse non cambiano)
//   - il numero di partenza delle fatture
//
// Il salvataggio usa upsert: aggiorna la riga se esiste, la crea se manca.
// =====================================================================
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const inputClass = "w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm";

// Campi di testo del form, nell'ordine in cui compaiono
const EMPTY = {
  owner_name: "",
  business_description: "",
  abn: "",
  address: "",
  phone: "",
  email: "",
  bank_name: "",
  bank_account_name: "",
  bank_bsb: "",
  bank_account_number: "",
  payment_terms_days: "14",
  footer_message: "",
  gst_registered: false,
  gst_rate: "10",
  first_invoice_number: "1",
  first_invoice_year: "",
};

export default function SettingsPage() {
  const [form, setForm] = useState(EMPTY);
  const [savedGst, setSavedGst] = useState(false); // GST com'era all'ultimo salvataggio
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }

  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase.from("settings").select("*").maybeSingle();
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (data) {
        // i valori null diventano stringhe vuote, i numeri diventano testo
        const values = { ...EMPTY };
        for (const key of Object.keys(EMPTY)) {
          if (data[key] === null || data[key] === undefined) continue;
          values[key] = typeof EMPTY[key] === "boolean" ? data[key] : String(data[key]);
        }
        setForm(values);
        setSavedGst(data.gst_registered);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  async function handleSave(event) {
    event.preventDefault();

    // controlli minimi
    if (!form.owner_name.trim()) {
      setMessage({ type: "error", text: "Enter the business or owner name." });
      return;
    }
    const terms = Number(form.payment_terms_days);
    const rate = Number(form.gst_rate);
    const firstNumber = Number(form.first_invoice_number);
    if (!Number.isInteger(terms) || terms < 0) {
      setMessage({ type: "error", text: "Payment terms must be a whole number of days." });
      return;
    }
    if (form.gst_registered && !(rate > 0 && rate < 100)) {
      setMessage({ type: "error", text: "Enter a valid GST rate (for example 10)." });
      return;
    }
    if (!Number.isInteger(firstNumber) || firstNumber < 1) {
      setMessage({ type: "error", text: "The first invoice number must be 1 or more." });
      return;
    }

    // conferma esplicita quando si attiva la GST
    if (form.gst_registered && !savedGst) {
      const ok = window.confirm(
        `Turn on GST at ${rate}%? From now on, NEW invoices will be "Tax Invoices" with GST added. ` +
          "Invoices already issued will not change."
      );
      if (!ok) return;
    }

    setSaving(true);
    const clean = (value) => value.trim() || null;
    const { error } = await supabase.from("settings").upsert({
      id: 1,
      owner_name: form.owner_name.trim(),
      business_description: clean(form.business_description),
      abn: clean(form.abn),
      address: clean(form.address),
      phone: clean(form.phone),
      email: clean(form.email),
      bank_name: clean(form.bank_name),
      bank_account_name: clean(form.bank_account_name),
      bank_bsb: clean(form.bank_bsb),
      bank_account_number: clean(form.bank_account_number),
      payment_terms_days: terms,
      footer_message: clean(form.footer_message),
      gst_registered: form.gst_registered,
      gst_rate: rate || 10,
      first_invoice_number: firstNumber,
      first_invoice_year: form.first_invoice_year ? Number(form.first_invoice_year) : null,
    });
    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: `Could not save: ${error.message}` });
    } else {
      setSavedGst(form.gst_registered);
      setMessage({ type: "ok", text: "Settings saved." });
    }
  }

  if (loading) return <p className="text-gray-500">Loading settings...</p>;

  // Un campo di testo con etichetta: evita di ripetere lo stesso markup
  const field = (name, label, props = {}) => (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input value={form[name]} onChange={(e) => setField(name, e.target.value)} className={inputClass} {...props} />
    </label>
  );

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <h2 className="font-medium text-gray-900 sm:col-span-2">Business details (invoice header)</h2>
        {field("owner_name", "Business / owner name")}
        {field("business_description", "Description (e.g. Cleaning & Aged Care Services)")}
        {field("abn", "ABN")}
        {field("phone", "Mobile")}
        <div className="sm:col-span-2">{field("address", "Address")}</div>
        {field("email", "Email (shown in the invoice footer)", { type: "email" })}
      </section>

      <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <h2 className="font-medium text-gray-900 sm:col-span-2">Payment details</h2>
        {field("bank_name", "Bank")}
        {field("bank_account_name", "Account name")}
        {field("bank_bsb", "BSB")}
        {field("bank_account_number", "Account number")}
        {field("payment_terms_days", "Payment terms (days)", { type: "number", min: 0 })}
        {field("footer_message", "Footer message")}
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-medium text-gray-900">GST</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.gst_registered}
            onChange={(e) => setField("gst_registered", e.target.checked)}
          />
          Registered for GST
        </label>
        {form.gst_registered && (
          <div className="max-w-40">{field("gst_rate", "GST rate (%)", { type: "number", step: "0.01", min: 0 })}</div>
        )}
        <p className="text-sm text-gray-500">
          {form.gst_registered
            ? "New invoices will be printed as “TAX INVOICE” and include GST. Invoices already issued keep their original GST setting."
            : "Invoices are printed as “INVOICE” without GST. Turn this on only after the GST registration is active."}
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-medium text-gray-900">Invoice numbering</h2>
        <p className="text-sm text-gray-500">
          Numbers restart at 1 every calendar year (e.g. 1/2027). If invoices were already issued outside the app
          this year, set the number to start from so it is never repeated.
        </p>
        <div className="grid max-w-md grid-cols-2 gap-4">
          {field("first_invoice_number", "Start from number", { type: "number", min: 1 })}
          {field("first_invoice_year", "In the year", { type: "number", min: 2000, placeholder: "e.g. 2026" })}
        </div>
        {form.first_invoice_year && (
          <p className="text-sm text-gray-700">
            The first invoice of {form.first_invoice_year} created in the app will be at least{" "}
            <strong>
              {form.first_invoice_number}/{form.first_invoice_year}
            </strong>
            .
          </p>
        )}
      </section>

      {message && (
        <p
          className={`rounded-md px-4 py-2 text-sm ${
            message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
