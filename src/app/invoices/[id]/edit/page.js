"use client";
// =====================================================================
// Modifica fattura — ROUTE DINAMICA /invoices/[id]/edit
// useParams legge l'id dall'URL e lo passa al form condiviso,
// che in questo modo carica la fattura e lavora in modalità "modifica".
// =====================================================================
import { useParams } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";

export default function EditInvoicePage() {
  const { id } = useParams();
  // key={id}: se l'id cambia, React ricrea il form da zero
  return <InvoiceForm key={id} invoiceId={id} />;
}
