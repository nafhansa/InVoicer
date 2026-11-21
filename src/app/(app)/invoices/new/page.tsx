"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { InvoiceEditor } from "@/components/InvoiceEditor";
import { PageHeader } from "@/components/ui";

function NewInvoice() {
  const params = useSearchParams();
  return <InvoiceEditor presetClientId={params.get("client") ?? undefined} />;
}

export default function NewInvoicePage() {
  return (
    <div>
      <PageHeader title="Buat Invoice" subtitle="Data pengirim, rekening, dan ketentuan sudah terisi dari profil tagihanmu." />
      <Suspense>
        <NewInvoice />
      </Suspense>
    </div>
  );
}
