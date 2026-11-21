"use client";

import { CheckCircle2, Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { Logo } from "@/components/Logo";
import { Button, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { calcTotals, fmtMoney } from "@/lib/utils";

export default function PublicInvoicePage() {
  return (
    <Suspense>
      <PublicInvoice />
    </Suspense>
  );
}

function PublicInvoice() {
  const { id } = useParams<{ id: string }>();
  const { ready, db, log } = useStore();
  const [confirmed, setConfirmed] = useState(false);
  const inv = db.invoices.find((i) => i.id === id);

  if (!ready) return null;
  const visible = inv && ["sent", "partial", "paid", "void"].includes(inv.status);

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="no-print flex items-center justify-between bg-hmif px-4 py-3 sm:px-8">
        <Logo />
        {visible && (
          <Button variant="dark" size="sm" onClick={() => window.print()}>
            <Printer size={14} /> Unduh PDF
          </Button>
        )}
      </header>
      <main className="mx-auto max-w-[860px] px-0 py-6 sm:px-4">
        {!visible ? (
          <Card className="mx-4 p-10 text-center">
            <p className="font-display text-xl font-bold">Invoice tidak tersedia</p>
            <p className="mt-1 text-sm text-neutral-500">Link mungkin salah atau invoice belum diterbitkan.</p>
          </Card>
        ) : (
          <>
            <InvoiceDocument inv={inv} settings={db.settings} />
            {(inv.status === "sent" || inv.status === "partial") && (
              <Card className="no-print mx-4 mt-4 flex flex-col items-center gap-3 p-5 text-center sm:mx-0 sm:flex-row sm:text-left">
                <div className="flex-1">
                  <div className="font-semibold">Sudah transfer {fmtMoney(calcTotals(inv).balance, db.settings.currency)}?</div>
                  <div className="text-sm text-neutral-500">Beri tahu {inv.profile.senderName} agar pembayaran segera diverifikasi.</div>
                </div>
                {confirmed ? (
                  <span className="flex items-center gap-2 font-semibold text-emerald-700">
                    <CheckCircle2 size={18} /> Terkirim, terima kasih!
                  </span>
                ) : (
                  <Button
                    onClick={() => {
                      log(inv.id, "Klien mengonfirmasi sudah transfer", `${inv.client.name} (klien)`);
                      setConfirmed(true);
                    }}
                  >
                    Konfirmasi pembayaran
                  </Button>
                )}
              </Card>
            )}
          </>
        )}
        <p className="no-print mt-6 text-center text-xs text-neutral-400">Dibuat dengan InVoicer · HMIF ITB</p>
      </main>
    </div>
  );
}
