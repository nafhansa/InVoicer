"use client";

import { useState } from "react";
import { Button, Card, Field, Input, PageHeader, useToast } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function AccountPage() {
  const { me, upsert } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ name: me!.name, phone: me!.phone, division: me!.division });
  const [pw, setPw] = useState({ old: "", next: "" });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Akun Saya" subtitle={me!.email} />
      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama" className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Divisi">
            <Input value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} />
          </Field>
          <Field label="No. HP">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
        </div>
        <Button
          className="mt-4"
          onClick={() => {
            upsert("users", { ...me!, ...form });
            toast("Akun diperbarui");
          }}
        >
          Simpan
        </Button>
      </Card>
      <Card className="mt-4 p-5">
        <h2 className="mb-3 font-display font-bold">Ganti password</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Password lama">
            <Input type="password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} />
          </Field>
          <Field label="Password baru">
            <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </Field>
        </div>
        <Button
          variant="dark"
          className="mt-4"
          onClick={() => {
            if (pw.old !== me!.password) return toast("Password lama salah");
            if (pw.next.length < 6) return toast("Minimal 6 karakter");
            upsert("users", { ...me!, password: pw.next });
            setPw({ old: "", next: "" });
            toast("Password diganti");
          }}
        >
          Ganti password
        </Button>
      </Card>
    </div>
  );
}
