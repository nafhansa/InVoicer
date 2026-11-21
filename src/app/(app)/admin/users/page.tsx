"use client";

import { KeyRound, Pencil, Plus, ShieldCheck, UserX } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/AppShell";
import { AdminOnly, Button, Card, Field, Input, Modal, PageHeader, Select, useToast } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { calcTotals, cx, fmtMoney, uid } from "@/lib/utils";

export default function AdminUsers() {
  const { me, db, upsert } = useStore();
  const toast = useToast();
  const [edit, setEdit] = useState<User | null>(null);

  if (me!.role !== "admin") return <AdminOnly />;

  const blank = (): User => ({
    id: uid("u-"),
    name: "",
    email: "",
    password: "user123",
    role: "user",
    division: "",
    phone: "",
    active: true,
    createdAt: new Date().toISOString(),
  });

  const save = () => {
    if (!edit?.name || !edit.email) return toast("Nama dan email wajib diisi");
    if (db.users.some((u) => u.email.toLowerCase() === edit.email.toLowerCase() && u.id !== edit.id)) return toast("Email sudah dipakai");
    upsert("users", edit);
    setEdit(null);
    toast("Pengguna disimpan");
  };

  return (
    <div>
      <PageHeader
        title="Kelola Pengguna"
        subtitle="Tambah pengurus, atur peran, dan nonaktifkan akun."
        actions={
          <Button onClick={() => setEdit(blank())}>
            <Plus size={16} /> Pengguna baru
          </Button>
        }
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {db.users.map((u) => {
          const invs = db.invoices.filter((i) => i.ownerId === u.id && ["sent", "partial", "paid"].includes(i.status));
          const total = invs.reduce((s, i) => s + calcTotals(i).total, 0);
          return (
            <Card key={u.id} className={cx("p-4", !u.active && "opacity-60")}>
              <div className="flex items-start gap-3">
                <Avatar name={u.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{u.name}</span>
                    {u.role === "admin" && <ShieldCheck size={14} className="shrink-0 text-hmif-600" />}
                  </div>
                  <div className="truncate text-xs text-neutral-500">{u.email}</div>
                  <div className="truncate text-xs text-neutral-500">{u.division}</div>
                </div>
                <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", u.role === "admin" ? "bg-ink text-hmif" : "bg-hmif-100")}>{u.role}</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-hmif-50 px-3 py-2 text-xs">
                <span>{invs.length} invoice terbit</span>
                <b>{fmtMoney(total)}</b>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setEdit(u)}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    upsert("users", { ...u, password: "user123" });
                    toast(`Password ${u.name} direset ke user123`);
                  }}
                  title="Reset password"
                >
                  <KeyRound size={13} />
                </Button>
                {u.id !== me!.id && (
                  <Button variant="outline" size="sm" onClick={() => upsert("users", { ...u, active: !u.active })} title={u.active ? "Nonaktifkan" : "Aktifkan"}>
                    <UserX size={13} /> {u.active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Pengguna">
        {edit && (
          <div className="space-y-3">
            <Field label="Nama">
              <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Divisi">
                <Input value={edit.division} onChange={(e) => setEdit({ ...edit, division: e.target.value })} />
              </Field>
              <Field label="No. HP">
                <Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peran">
                <Select value={edit.role} disabled={edit.id === me!.id} onChange={(e) => setEdit({ ...edit, role: e.target.value as User["role"] })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Select>
              </Field>
              <Field label="Password">
                <Input value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} />
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
