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
    // pt con env(safe-area-inset-top): sotto il notch dell'iPhone quando
    // l'app è aperta dalla schermata Home a schermo intero
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white pt-[env(safe-area-inset-top)] print:hidden">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 pt-3 sm:pb-3">
        <span className="mr-2 shrink-0 font-semibold text-gray-900">Invoice App</span>

        {/* Su schermi larghi i link stanno qui, accanto al titolo */}
        <nav className="hidden flex-1 items-center gap-1 sm:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="ml-auto shrink-0 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          Sign out
        </button>
      </div>

      {/* Su telefono i link vanno in una riga che scorre di lato */}
      <nav className="nav-scroll flex gap-1 px-4 pt-2 pb-2 sm:hidden">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={`shrink-0 ${linkClass(link.href)}`}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );

  // Stile di un link: scuro se è la pagina corrente.
  // py-2 = area da toccare più comoda col dito.
  function linkClass(href) {
    return `rounded-md px-3 py-2 text-sm ${
      isActive(href) ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;
  }
}
