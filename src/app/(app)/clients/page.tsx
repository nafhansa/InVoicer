"use client";

import { FilePlus2, Mail, Pencil, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, Card, EmptyState, Field, Input, Modal, PageHeader, Textarea, useToast } from "@/components/ui";
import { useScoped, useStore } from "@/lib/store";
import type { Client } from "@/lib/types";
import { calcTotals, fmtMoney, uid } from "@/lib/utils";

const blank = (ownerId: string): Client => ({ id: uid("c-"), ownerId, name: "", company: "", email: "", phone: "", address: "", notes: "" });

export default function ClientsPage() {
  const { me, upsert, remove, db } = useStore();
  const { clients, invoices } = useScoped();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Client | null>(null);

  const rows = clients.filter((c) => [c.name, c.company, c.email].join(" ").toLowerCase().includes(q.toLowerCase()));
  const statsFor = (id: string) => {
    const list = invoices.filter((i) => i.clientId === id && ["sent", "partial", "paid"].includes(i.status));
    return { count: list.length, total: list.reduce((s, i) => s + calcTotals(i).total, 0), due: list.reduce((s, i) => s + calcTotals(i).balance, 0) };
  };

  const save = () => {
    if (!edit) return;
    if (!edit.name && !edit.company) return toast("Isi nama atau perusahaan");
    upsert("clients", edit);
    setEdit(null);
    toast("Klien disimpan");
  };

  return (
    <div>
      <PageHeader
        title="Klien"
        subtitle="Simpan data klien sekali, pilih kapan saja saat membuat invoice."
        actions={
          <Button onClick={() => setEdit(blank(me!.id))}>
            <Plus size={16} /> Klien baru
          </Button>
        }
      />
      <div className="relative mb-4">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari klien..." className="pl-9" />
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={<Users />} title="Belum ada klien" desc="Tambahkan klien agar tidak perlu mengetik ulang alamat dan kontak." action={<Button onClick={() => setEdit(blank(me!.id))}>Tambah klien</Button>} />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const s = statsFor(c.id);
            return (
              <Card key={c.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-display text-base font-bold">{c.company || c.name}</div>
                    {c.company && <div className="truncate text-sm text-neutral-600">{c.name}</div>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => setEdit(c)} className="rounded-md p-1.5 text-neutral-500 hover:bg-black/5" aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus klien ${c.company || c.name}? Invoice lama tetap tersimpan.`)) {
                          remove("clients", c.id);
                          toast("Klien dihapus");
                        }
                      }}
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                      aria-label="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs text-neutral-600">
                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} /> {c.email}
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} /> {c.phone}
                    </div>
                  )}
                </div>
                {me!.role === "admin" && <div className="mt-1 text-[11px] text-neutral-400">Milik {db.users.find((u) => u.id === c.ownerId)?.name}</div>}
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-hmif-50 p-2 text-center">
                  <MiniStat k="Invoice" v={String(s.count)} />
                  <MiniStat k="Ditagih" v={fmtMoney(s.total).replace("Rp", "")} />
                  <MiniStat k="Sisa" v={fmtMoney(s.due).replace("Rp", "")} />
                </div>
                <Link href={`/invoices/new?client=${c.id}`} className="mt-3">
                  <Button variant="outline" size="sm" className="w-full">
                    <FilePlus2 size={14} /> Buat invoice
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={clients.some((c) => c.id === edit?.id) ? "Edit klien" : "Klien baru"}>
        {edit && (
          <div className="space-y-3">
            <Field label="Nama kontak">
              <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="Perusahaan / instansi">
              <Input value={edit.company} onChange={(e) => setEdit({ ...edit, company: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
              </Field>
              <Field label="No. HP">
                <Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
              </Field>
            </div>
            <Field label="Alamat">
              <Textarea rows={2} value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} />
            </Field>
            <Field label="Catatan internal">
              <Textarea rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
            </Field>
            <Button className="w-full" onClick={save}>
              Simpan
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MiniStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase text-neutral-500">{k}</div>
      <div className="truncate text-xs font-bold">{v}</div>
    </div>
  );
}
