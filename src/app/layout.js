// =====================================================================
// Layout principale: avvolge TUTTE le pagine dell'app.
// Resta un Server Component (niente "use client"): il controllo del
// login lo fa AuthGuard, che invece è un Client Component.
// =====================================================================
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Invoice App",
  description: "Create, store and print weekly invoices",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
