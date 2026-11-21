"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { AdminOnly, Button, Card, Field, Input, PageHeader, Select, Textarea, useToast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/utils";

export default function AdminSettings() {
  const { me, db, updateSettings, resetDemo } = useStore();
  const toast = useToast();
  const [s, setS] = useState(db.settings);

  if (me!.role !== "admin") return <AdminOnly />;

  const preview = `${s.prefix}/${todayISO().slice(0, 7).replace("-", "/")}/${String(s.nextNumber).padStart(4, "0")}`;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Pengaturan Organisasi" subtitle="Berlaku untuk semua invoice." />
      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama organisasi">
            <Input value={s.orgName} onChange={(e) => setS({ ...s, orgName: e.target.value })} />
          </Field>
          <Field label="Email keuangan">
            <Input value={s.orgEmail} onChange={(e) => setS({ ...s, orgEmail: e.target.value })} />
          </Field>
          <Field label="Tagline (footer invoice)" className="sm:col-span-2">
            <Input value={s.orgTagline} onChange={(e) => setS({ ...s, orgTagline: e.target.value })} />
          </Field>
          <Field label="Alamat" className="sm:col-span-2">
            <Textarea rows={2} value={s.orgAddress} onChange={(e) => setS({ ...s, orgAddress: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="mb-3 font-display font-bold">Penomoran & alur</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Prefix nomor">
            <Input value={s.prefix} onChange={(e) => setS({ ...s, prefix: e.target.value })} />
          </Field>
          <Field label="Nomor berikutnya">
            <Input type="number" value={s.nextNumber} onChange={(e) => setS({ ...s, nextNumber: Number(e.target.value) })} />
          </Field>
          <Field label="Mata uang">
            <Select value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })}>
              <option value="IDR">IDR (Rupiah)</option>
              <option value="USD">USD</option>
              <option value="SGD">SGD</option>
            </Select>
          </Field>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Contoh nomor berikutnya: <span className="font-mono font-semibold text-ink">{preview}</span>
        </p>
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-black/10 p-3">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-ink" checked={s.requireApproval} onChange={(e) => setS({ ...s, requireApproval: e.target.checked })} />
          <span>
            <span className="block text-sm font-semibold">Wajib approval bendahara</span>
            <span className="block text-xs text-neutral-500">Invoice dari user harus disetujui admin sebelum mendapat nomor resmi dan bisa dikirim.</span>
          </span>
        </label>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            updateSettings(s);
            toast("Pengaturan disimpan");
          }}
        >
          Simpan pengaturan
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (!confirm("Reset semua data ke data demo awal? Semua perubahan akan hilang.")) return;
            resetDemo();
            toast("Data demo dipulihkan");
          }}
        >
          <RotateCcw size={16} /> Reset data demo
        </Button>
      </div>
    </div>
  );
}
