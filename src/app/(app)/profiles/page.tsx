"use client";

import { BookUser, Landmark, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, Card, EmptyState, Field, Input, Modal, PageHeader, Textarea, useToast } from "@/components/ui";
import { useScoped, useStore } from "@/lib/store";
import type { BillingProfile } from "@/lib/types";
import { uid } from "@/lib/utils";

export default function ProfilesPage() {
  const { me, upsert, remove, db } = useStore();
  const { profiles } = useScoped();
  const toast = useToast();
  const [edit, setEdit] = useState<BillingProfile | null>(null);

  const blank = (): BillingProfile => ({
    id: uid("p-"),
    ownerId: me!.id,
    label: "",
    isDefault: profiles.length === 0,
    senderName: `${db.settings.orgName}, ${me!.division}`,
    senderEmail: me!.email,
    senderPhone: me!.phone,
    address: db.settings.orgAddress,
    npwp: "",
    bankName: "",
    bankAccount: "",
    bankHolder: db.settings.orgName,
    defaultTaxRate: 0,
    defaultDueDays: 14,
    defaultNotes: "Terima kasih atas kerja samanya.",
    defaultTerms: "Pembayaran dilakukan melalui transfer ke rekening di atas. Mohon cantumkan nomor invoice pada berita transfer.",
    signatureName: me!.name,
    signatureTitle: me!.division,
  });

  const save = () => {
    if (!edit) return;
    if (!edit.label || !edit.senderName) return toast("Nama profil dan nama pengirim wajib diisi");
    upsert("profiles", edit);
    setEdit(null);
    toast("Profil disimpan");
  };

  const F = <K extends keyof BillingProfile>(k: K) => ({
    value: edit![k] as string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEdit({ ...edit!, [k]: typeof edit![k] === "number" ? Number(e.target.value) : e.target.value }),
  });

  return (
    <div>
      <PageHeader
        title="Profil Tagihan"
        subtitle="Data pengirim, rekening, pajak, dan ketentuan default. Isi sekali, invoice terisi otomatis."
        actions={
          <Button onClick={() => setEdit(blank())}>
            <Plus size={16} /> Profil baru
          </Button>
        }
      />
      {profiles.length === 0 ? (
        <Card>
          <EmptyState icon={<BookUser />} title="Belum ada profil" desc="Buat profil pertama kamu supaya tidak perlu isi data pengirim berulang kali." action={<Button onClick={() => setEdit(blank())}>Buat profil</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((p) => (
            <Card key={p.id} className={`overflow-hidden ${p.isDefault ? "border-ink" : ""}`}>
              <div className="flex items-center justify-between bg-hmif px-4 py-3">
                <div className="flex items-center gap-2 font-display font-bold">
                  {p.label}
                  {p.isDefault && <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-hmif uppercase">Default</span>}
                </div>
                <div className="flex gap-1">
                  {!p.isDefault && (
                    <button onClick={() => upsert("profiles", { ...p, isDefault: true })} className="rounded-md p-1.5 hover:bg-black/10" title="Jadikan default">
                      <Star size={15} />
                    </button>
                  )}
                  <button onClick={() => setEdit(p)} className="rounded-md p-1.5 hover:bg-black/10" aria-label="Edit">
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Hapus profil ini?")) remove("profiles", p.id);
                    }}
                    className="rounded-md p-1.5 hover:bg-black/10"
                    aria-label="Hapus"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 p-4 text-sm">
                <div className="font-semibold">{p.senderName}</div>
                <div className="text-xs text-neutral-600">
                  {p.senderEmail} · {p.senderPhone}
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs">
                  <Landmark size={14} />
                  {p.bankName || "Bank belum diisi"} {p.bankAccount} a.n. {p.bankHolder}
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span className="rounded-full bg-hmif-100 px-2 py-0.5">Pajak {p.defaultTaxRate}%</span>
                  <span className="rounded-full bg-hmif-100 px-2 py-0.5">Net {p.defaultDueDays} hari</span>
                  <span className="rounded-full bg-hmif-100 px-2 py-0.5">TTD {p.signatureName}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Profil tagihan" wide>
        {edit && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama profil" hint="cth. Sponsorship, Merchandise" className="sm:col-span-2">
              <Input {...F("label")} />
            </Field>
            <Field label="Nama pengirim">
              <Input {...F("senderName")} />
            </Field>
            <Field label="Email">
              <Input {...F("senderEmail")} />
            </Field>
            <Field label="Telepon">
              <Input {...F("senderPhone")} />
            </Field>
            <Field label="NPWP (opsional)">
              <Input {...F("npwp")} />
            </Field>
            <Field label="Alamat" className="sm:col-span-2">
              <Textarea rows={2} {...F("address")} />
            </Field>
            <div className="sm:col-span-2 mt-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Rekening pembayaran</div>
            <Field label="Bank">
              <Input {...F("bankName")} />
            </Field>
            <Field label="No. rekening">
              <Input {...F("bankAccount")} />
            </Field>
            <Field label="Atas nama" className="sm:col-span-2">
              <Input {...F("bankHolder")} />
            </Field>
            <div className="sm:col-span-2 mt-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Default invoice</div>
            <Field label="Pajak default (%)">
              <Input type="number" {...F("defaultTaxRate")} />
            </Field>
            <Field label="Jatuh tempo (hari)">
              <Input type="number" {...F("defaultDueDays")} />
            </Field>
            <Field label="Nama penanda tangan">
              <Input {...F("signatureName")} />
            </Field>
            <Field label="Jabatan">
              <Input {...F("signatureTitle")} />
            </Field>
            <Field label="Catatan default" className="sm:col-span-2">
              <Textarea rows={2} {...F("defaultNotes")} />
            </Field>
            <Field label="Syarat & ketentuan default" className="sm:col-span-2">
              <Textarea rows={2} {...F("defaultTerms")} />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-ink" checked={edit.isDefault} onChange={(e) => setEdit({ ...edit, isDefault: e.target.checked })} />
              Jadikan profil default
            </label>
            <Button className="sm:col-span-2" onClick={save}>
              Simpan profil
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
