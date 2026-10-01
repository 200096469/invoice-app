// =====================================================================
// Nuova fattura — /invoices/new
// Tutta la logica è nel componente condiviso InvoiceForm.
// Senza invoiceId, il form lavora in modalità "nuova fattura".
// (Questa pagina non usa hook, quindi non serve "use client":
//  è InvoiceForm a essere un Client Component.)
// =====================================================================
import InvoiceForm from "@/components/InvoiceForm";

export default function NewInvoicePage() {
  return <InvoiceForm />;
}
