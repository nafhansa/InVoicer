import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["500", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "InVoicer | HMIF ITB",
  description: "Buat, kirim, dan lacak invoice HMIF ITB tanpa isi data berulang.",
};

export const viewport: Viewport = {
  themeColor: "#f6c34a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} ${archivo.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <StoreProvider>
          <ToastProvider>{children}</ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
