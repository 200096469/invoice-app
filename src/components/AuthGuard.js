"use client";
// =====================================================================
// AuthGuard — il "portinaio" dell'app.
// Avvolge tutte le pagine (vedi layout.js) e decide cosa mostrare:
//   - mentre controlla la sessione   → "Loading..."
//   - utente NON loggato             → rimanda a /login
//   - utente loggato su /login       → rimanda alla dashboard
//   - utente loggato                 → menu + pagina richiesta
//
// È un Client Component perché usa useState e useEffect
// (gli hook funzionano solo nei Client Components).
// =====================================================================
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

// Pagine visibili anche senza login
const PUBLIC_PATHS = ["/login"];

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // useState: memorizza la sessione e se il controllo è ancora in corso
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  // useEffect #1: al primo caricamento legge la sessione salvata
  // e resta in ascolto di login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    );

    // pulizia: smette di ascoltare quando il componente viene smontato
    return () => listener.subscription.unsubscribe();
  }, []);

  // useEffect #2: reindirizza quando cambia la sessione o la pagina
  useEffect(() => {
    if (checking) return;
    if (!session && !isPublicPage) router.replace("/login");
    if (session && isPublicPage) router.replace("/");
  }, [checking, session, isPublicPage, router]);

  if (checking) {
    return <p className="p-8 text-gray-500">Loading...</p>;
  }

  // Pagina pubblica (login): niente menu
  if (isPublicPage) {
    return session ? null : children;
  }

  // Pagina protetta senza sessione: niente da mostrare, il redirect è in corso
  if (!session) return null;

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 print:max-w-none print:p-0">
        {children}
      </main>
    </>
  );
}
