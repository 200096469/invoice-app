"use client";
// =====================================================================
// NavBar — il menu in alto, visibile solo agli utenti loggati.
// usePathname evidenzia la voce della pagina corrente.
// "print:hidden" (Tailwind) nasconde il menu quando si stampa.
// =====================================================================
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/clients", label: "Clients" },
  { href: "/services", label: "Services & Rates" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  // la Dashboard è attiva solo su "/", le altre anche nelle sottopagine
  // (es. /invoices/3 evidenzia "Invoices")
  function isActive(href) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white print:hidden">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-3">
        <span className="mr-4 font-semibold text-gray-900">Invoice App</span>

        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-1.5 text-sm ${
              isActive(link.href)
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {link.label}
          </Link>
        ))}

        <button
          onClick={handleSignOut}
          className="ml-auto rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}
