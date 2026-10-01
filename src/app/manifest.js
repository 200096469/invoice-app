// =====================================================================
// Web App Manifest — /manifest.webmanifest (generato da Next.js)
// Descrive l'app al telefono quando viene "aggiunta alla schermata Home":
// nome sotto l'icona, icone, colori e apertura a schermo intero
// (display: "standalone" = senza la barra degli indirizzi del browser).
// =====================================================================
export default function manifest() {
  return {
    name: "Invoice App",
    short_name: "Invoices",
    description: "Create, store and print weekly invoices",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f9fafb",
    theme_color: "#111827",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
