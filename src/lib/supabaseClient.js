// =====================================================================
// Client Supabase condiviso da tutta l'app.
// Si crea UNA sola volta qui e si importa ovunque serva:
//   import { supabase } from "@/lib/supabaseClient";
//
// URL e chiave arrivano da .env.local (mai scritti nel codice, mai su GitHub).
// Il prefisso NEXT_PUBLIC_ rende le variabili leggibili nel browser:
// va bene, perché la chiave "publishable" è pensata per essere pubblica.
// La protezione vera dei dati la fa la Row Level Security nel database.
// =====================================================================
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Messaggio chiaro se .env.local manca o è incompleto
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase settings. Add NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart npm run dev."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
