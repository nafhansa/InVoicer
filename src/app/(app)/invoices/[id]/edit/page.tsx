"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { InvoiceEditor } from "@/components/InvoiceEditor";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { FileX } from "lucide-react";

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { db, me } = useStore();
  const inv = db.invoices.find((i) => i.id === id);
  const canEdit = inv && (me!.role === "admin" || (inv.ownerId === me!.id && ["draft", "rejected", "pending"].includes(inv.status)));

  if (!inv || !canEdit)
    return (
      <Card>
        <EmptyState
          icon={<FileX />}
          title="Tidak bisa diedit"
          desc="Invoice tidak ditemukan atau sudah diterbitkan. Duplikasi untuk membuat versi baru."
          action={
            <Link href="/invoices">
              <Button>Kembali</Button>
            </Link>
          }
        />
      </Card>
    );

  return (
    <div>
      <PageHeader title="Edit Invoice" subtitle={inv.number} />
      <InvoiceEditor initial={inv} />
    </div>
  );
}
