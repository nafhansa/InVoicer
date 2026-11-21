"use client";

import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, Card, EmptyState, Field, Input, Modal, PageHeader, useToast } from "@/components/ui";
import { useScoped, useStore } from "@/lib/store";
import type { CatalogItem } from "@/lib/types";
import { fmtMoney, uid } from "@/lib/utils";

export default function CatalogPage() {
  const { me, upsert, remove, db } = useStore();
  const { catalog } = useScoped();
  const toast = useToast();
  const [edit, setEdit] = useState<CatalogItem | null>(null);
  const blank = (): CatalogItem => ({ id: uid("k-"), ownerId: me!.id, name: "", description: "", unit: "pcs", unitPrice: 0 });

  const save = () => {
    if (!edit?.name) return toast("Nama item wajib diisi");
    upsert("catalog", edit);
    setEdit(null);
    toast("Item disimpan");
  };

  return (
    <div>
      <PageHeader
        title="Katalog Item"
        subtitle="Produk dan jasa yang sering ditagihkan. Tambahkan ke invoice dengan sekali klik."
        actions={
          <Button onClick={() => setEdit(blank())}>
            <Plus size={16} /> Item baru
          </Button>
        }
      />
      {catalog.length === 0 ? (
        <Card>
          <EmptyState icon={<Package />} title="Katalog kosong" desc="Simpan item yang sering dipakai, misalnya paket sponsor atau merchandise." action={<Button onClick={() => setEdit(blank())}>Tambah item</Button>} />
        </Card>
      ) : (
        <Card className="divide-y divide-black/5">
          {catalog.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-hmif-100">
                <Package size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{c.name}</div>
                <div className="truncate text-xs text-neutral-500">
                  {c.description}
                  {me!.role === "admin" && ` · ${db.users.find((u) => u.id === c.ownerId)?.name}`}
                </div>
              </div>
              <div className="text-right text-sm font-bold whitespace-nowrap">
                {fmtMoney(c.unitPrice)}
                <div className="text-xs font-normal text-neutral-500">per {c.unit}</div>
              </div>
              <button onClick={() => setEdit(c)} className="rounded-md p-1.5 text-neutral-500 hover:bg-black/5" aria-label="Edit">
                <Pencil size={15} />
              </button>
              <button
                onClick={() => {
                  remove("catalog", c.id);
                  toast("Item dihapus");
                }}
                className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                aria-label="Hapus"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </Card>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Item katalog">
        {edit && (
          <div className="space-y-3">
            <Field label="Nama">
              <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="Deskripsi">
              <Input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Harga satuan">
                <Input type="number" value={edit.unitPrice || ""} onChange={(e) => setEdit({ ...edit, unitPrice: Number(e.target.value) })} />
              </Field>
              <Field label="Satuan">
                <Input value={edit.unit} onChange={(e) => setEdit({ ...edit, unit: e.target.value })} />
              </Field>
            </div>
            <Button className="w-full" onClick={save}>
              Simpan
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
