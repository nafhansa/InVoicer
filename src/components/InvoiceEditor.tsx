"use client";

import { BookmarkPlus, Eye, PackagePlus, Plus, Save, Send, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useScoped, useStore } from "@/lib/store";
import type { BillingProfile, Client, Invoice, LineItem } from "@/lib/types";
import { addDays, calcTotals, cx, daysBetween, fmtMoney, todayISO, uid } from "@/lib/utils";
import { InvoiceDocument } from "./InvoiceDocument";
import { Button, Card, Field, Input, Modal, Select, Textarea, useToast } from "./ui";

const emptyClient = { name: "", company: "", email: "", phone: "", address: "" };

function profileSnapshot(p: BillingProfile): Invoice["profile"] {
  const { id: _a, ownerId: _b, label: _c, isDefault: _d, ...rest } = p;
  void _a; void _b; void _c; void _d;
  return rest;
}

function clientSnapshot(c: Client): Invoice["client"] {
  return { name: c.name, company: c.company, email: c.email, phone: c.phone, address: c.address };
}

const blankItem = (): LineItem => ({ id: uid(), name: "", description: "", qty: 1, unit: "pcs", unitPrice: 0 });

export function InvoiceEditor({ initial, presetClientId }: { initial?: Invoice; presetClientId?: string }) {
  const store = useStore();
  const { db, me, saveInvoice, upsert, issueNumber } = store;
  const { profiles, clients, catalog } = useScoped();
  const router = useRouter();
  const toast = useToast();

  const defaultProfile = profiles.find((p) => p.isDefault) ?? profiles[0];
  const presetClient = clients.find((c) => c.id === presetClientId);

  const [inv, setInv] = useState<Invoice>(() => {
    if (initial) return initial;
    const issue = todayISO();
    return {
      id: uid("inv-"),
      number: "DRAFT",
      ownerId: me!.id,
      profileId: defaultProfile?.id ?? "",
      profile: defaultProfile
        ? profileSnapshot(defaultProfile)
        : {
            senderName: db.settings.orgName,
            senderEmail: db.settings.orgEmail,
            senderPhone: "",
            address: db.settings.orgAddress,
            npwp: "",
            bankName: "",
            bankAccount: "",
            bankHolder: "",
            defaultTaxRate: 0,
            defaultDueDays: 14,
            defaultNotes: "",
            defaultTerms: "",
            signatureName: me!.name,
            signatureTitle: me!.division,
          },
      clientId: presetClient?.id ?? "",
      client: presetClient ? clientSnapshot(presetClient) : { ...emptyClient },
      title: "",
      issueDate: issue,
      dueDate: addDays(issue, defaultProfile?.defaultDueDays ?? 14),
      items: [blankItem()],
      discountType: "percent",
      discountValue: 0,
      taxRate: defaultProfile?.defaultTaxRate ?? 0,
      shipping: 0,
      notes: defaultProfile?.defaultNotes ?? "",
      terms: defaultProfile?.defaultTerms ?? "",
      status: "draft",
      payments: [],
      recurring: "none",
      adminNote: "",
      activity: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
  const [newClient, setNewClient] = useState(!inv.clientId && !initial && clients.length === 0);
  const [saveClient, setSaveClient] = useState(true);
  const [preview, setPreview] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const t = useMemo(() => calcTotals(inv), [inv]);
  const cur = db.settings.currency;
  const set = <K extends keyof Invoice>(k: K, v: Invoice[K]) => setInv((i) => ({ ...i, [k]: v }));
  const setItem = (id: string, patch: Partial<LineItem>) => set("items", inv.items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const dueGap = daysBetween(inv.issueDate, inv.dueDate);

  const pickProfile = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setInv((i) => ({
      ...i,
      profileId: p.id,
      profile: profileSnapshot(p),
      taxRate: p.defaultTaxRate,
      dueDate: addDays(i.issueDate, p.defaultDueDays),
      notes: p.defaultNotes,
      terms: p.defaultTerms,
    }));
  };

  const pickClient = (id: string) => {
    if (id === "__new") {
      setNewClient(true);
      setInv((i) => ({ ...i, clientId: "", client: { ...emptyClient } }));
      return;
    }
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setNewClient(false);
    setInv((i) => ({ ...i, clientId: c.id, client: clientSnapshot(c) }));
  };

  const addFromCatalog = (id: string) => {
    const c = catalog.find((x) => x.id === id);
    if (!c) return;
    const row: LineItem = { id: uid(), name: c.name, description: c.description, qty: 1, unit: c.unit, unitPrice: c.unitPrice };
    // replace the first empty row if present so users don't end up with a blank line
    const emptyIdx = inv.items.findIndex((x) => !x.name && !x.unitPrice);
    set("items", emptyIdx >= 0 ? inv.items.map((x, k) => (k === emptyIdx ? row : x)) : [...inv.items, row]);
    setCatalogOpen(false);
  };

  const saveItemToCatalog = (it: LineItem) => {
    if (!it.name) return toast("Isi nama item dulu");
    upsert("catalog", { id: uid("k-"), ownerId: me!.id, name: it.name, description: it.description, unit: it.unit, unitPrice: it.unitPrice });
    toast(`"${it.name}" disimpan ke katalog`);
  };

  const validate = () => {
    const e: string[] = [];
    if (!inv.title.trim()) e.push("Perihal invoice wajib diisi");
    if (!inv.client.name.trim() && !inv.client.company.trim()) e.push("Data klien wajib diisi");
    if (!inv.items.some((i) => i.name && i.qty > 0)) e.push("Minimal satu item dengan nama dan qty");
    if (inv.dueDate < inv.issueDate) e.push("Jatuh tempo tidak boleh sebelum tanggal terbit");
    if (!inv.profile.bankAccount) e.push("Rekening pembayaran kosong, lengkapi di profil tagihan");
    setErrors(e);
    return e.length === 0;
  };

  const commit = (mode: "draft" | "submit") => {
    if (mode === "submit" && !validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    let clientId = inv.clientId;
    if (newClient && saveClient && (inv.client.name || inv.client.company)) {
      clientId = uid("c-");
      upsert("clients", { id: clientId, ownerId: me!.id, notes: "", ...inv.client });
      setNewClient(false);
    }
    const isAdmin = me!.role === "admin";
    const directIssue = mode === "submit" && (isAdmin || !db.settings.requireApproval);
    const next: Invoice = {
      ...inv,
      clientId,
      items: inv.items.filter((i) => i.name || i.unitPrice),
      status: mode === "draft" ? (inv.status === "rejected" ? "rejected" : inv.status === "draft" ? "draft" : inv.status) : directIssue ? "sent" : "pending",
      number: directIssue && inv.number === "DRAFT" ? issueNumber() : inv.number,
    };
    const exists = db.invoices.some((x) => x.id === inv.id);
    const logText =
      mode === "draft" ? (exists ? "Draft diperbarui" : "Invoice dibuat") : directIssue ? `Invoice diterbitkan (${next.number})` : "Diajukan untuk approval";
    if (!exists && mode === "submit") next.activity = [...next.activity, { at: new Date().toISOString(), by: me!.name, text: "Invoice dibuat" }];
    saveInvoice(next, logText);
    toast(mode === "draft" ? "Draft tersimpan" : directIssue ? "Invoice diterbitkan" : "Diajukan ke bendahara");
    router.push(`/invoices/${next.id}`);
  };

  const submitLabel = me!.role === "admin" || !db.settings.requireApproval ? "Terbitkan" : "Ajukan Approval";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {errors.length > 0 && (
          <Card className="border-red-300 bg-red-50 p-4 text-sm text-red-700">
            <ul className="list-inside list-disc space-y-0.5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Card>
        )}
        {inv.status === "rejected" && inv.adminNote && (
          <Card className="border-red-300 bg-red-50 p-4 text-sm">
            <b>Catatan penolakan dari bendahara:</b> {inv.adminNote}
          </Card>
        )}

        <Section n={1} title="Dari (profil tagihan)">
          {profiles.length ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Select value={inv.profileId} onChange={(e) => pickProfile(e.target.value)}>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} {p.isDefault ? "(default)" : ""}
                  </option>
                ))}
              </Select>
              <Link href="/profiles">
                <Button variant="outline" className="w-full">Kelola profil</Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-xl bg-hmif-50 p-3 text-sm">
              Belum ada profil tagihan.{" "}
              <Link href="/profiles" className="font-semibold underline">
                Buat profil
              </Link>{" "}
              agar data pengirim dan rekening terisi otomatis.
            </div>
          )}
          <div className="mt-3 rounded-xl border border-black/10 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">
            <b className="text-ink">{inv.profile.senderName}</b> · {inv.profile.senderEmail}
            <br />
            {inv.profile.bankName} {inv.profile.bankAccount} a.n. {inv.profile.bankHolder}
          </div>
        </Section>

        <Section n={2} title="Untuk (klien)">
          <Select value={newClient ? "__new" : inv.clientId} onChange={(e) => pickClient(e.target.value)}>
            {!newClient && !inv.clientId && <option value="">Pilih klien tersimpan...</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company ? `${c.company} (${c.name})` : c.name}
              </option>
            ))}
            <option value="__new">+ Klien baru</option>
          </Select>
          {(newClient || inv.clientId) && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Nama kontak">
                <Input value={inv.client.name} onChange={(e) => set("client", { ...inv.client, name: e.target.value })} />
              </Field>
              <Field label="Perusahaan / instansi">
                <Input value={inv.client.company} onChange={(e) => set("client", { ...inv.client, company: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={inv.client.email} onChange={(e) => set("client", { ...inv.client, email: e.target.value })} />
              </Field>
              <Field label="No. HP / WhatsApp">
                <Input value={inv.client.phone} onChange={(e) => set("client", { ...inv.client, phone: e.target.value })} />
              </Field>
              <Field label="Alamat" className="sm:col-span-2">
                <Textarea rows={2} value={inv.client.address} onChange={(e) => set("client", { ...inv.client, address: e.target.value })} />
              </Field>
              {newClient && (
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" checked={saveClient} onChange={(e) => setSaveClient(e.target.checked)} className="h-4 w-4 accent-ink" />
                  <UserPlus size={14} /> Simpan klien ini untuk invoice berikutnya
                </label>
              )}
            </div>
          )}
        </Section>

        <Section n={3} title="Detail invoice">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Perihal" className="sm:col-span-2">
              <Input value={inv.title} onChange={(e) => set("title", e.target.value)} placeholder="cth. Sponsorship Arkavidia 11.0" />
            </Field>
            <Field label="Tanggal terbit">
              <Input type="date" value={inv.issueDate} onChange={(e) => setInv((i) => ({ ...i, issueDate: e.target.value, dueDate: addDays(e.target.value, Math.max(0, dueGap)) }))} />
            </Field>
            <Field label="Jatuh tempo">
              <Input type="date" value={inv.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-1.5 sm:col-span-2">
              {[0, 7, 14, 30, 45].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("dueDate", addDays(inv.issueDate, d))}
                  className={cx("rounded-full border px-3 py-1 text-xs font-semibold", dueGap === d ? "border-ink bg-ink text-hmif" : "border-black/15 hover:border-ink")}
                >
                  {d === 0 ? "Saat diterima" : `Net ${d}`}
                </button>
              ))}
            </div>
            <Field label="Invoice berulang" hint="Duplikasi otomatis dengan tanggal periode berikutnya." className="sm:col-span-2">
              <Select value={inv.recurring} onChange={(e) => set("recurring", e.target.value as Invoice["recurring"])}>
                <option value="none">Tidak berulang</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="quarterly">Per 3 bulan</option>
              </Select>
            </Field>
          </div>
        </Section>

        <Section
          n={4}
          title="Item"
          right={
            <Button variant="outline" size="sm" onClick={() => setCatalogOpen(true)} disabled={!catalog.length}>
              <PackagePlus size={14} /> Dari katalog
            </Button>
          }
        >
          <div className="space-y-3">
            {inv.items.map((it, idx) => (
              <div key={it.id} className="rounded-xl border border-black/10 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400">#{idx + 1}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => saveItemToCatalog(it)} className="rounded-md p-1.5 text-neutral-500 hover:bg-hmif-100 hover:text-ink" title="Simpan ke katalog">
                      <BookmarkPlus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => set("items", inv.items.length > 1 ? inv.items.filter((x) => x.id !== it.id) : [blankItem()])}
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  <Input className="col-span-6 sm:col-span-3" placeholder="Nama item" value={it.name} onChange={(e) => setItem(it.id, { name: e.target.value })} />
                  <Input className="col-span-6 sm:col-span-3" placeholder="Deskripsi (opsional)" value={it.description} onChange={(e) => setItem(it.id, { description: e.target.value })} />
                  <Input className="col-span-2 sm:col-span-1" type="number" min={0} inputMode="decimal" value={it.qty} onChange={(e) => setItem(it.id, { qty: Number(e.target.value) })} />
                  <Input className="col-span-2 sm:col-span-1" placeholder="unit" value={it.unit} onChange={(e) => setItem(it.id, { unit: e.target.value })} />
                  <Input className="col-span-2 sm:col-span-2" type="number" min={0} inputMode="numeric" placeholder="Harga" value={it.unitPrice || ""} onChange={(e) => setItem(it.id, { unitPrice: Number(e.target.value) })} />
                  <div className="col-span-6 flex items-center justify-end text-sm font-bold sm:col-span-2">{fmtMoney(it.qty * it.unitPrice, cur)}</div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={() => set("items", [...inv.items, blankItem()])}>
              <Plus size={16} /> Tambah baris
            </Button>
          </div>
        </Section>

        <Section n={5} title="Diskon, pajak & biaya">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Jenis diskon">
              <Select value={inv.discountType} onChange={(e) => set("discountType", e.target.value as Invoice["discountType"])}>
                <option value="percent">Persen (%)</option>
                <option value="fixed">Nominal</option>
              </Select>
            </Field>
            <Field label="Diskon">
              <Input type="number" min={0} value={inv.discountValue || ""} onChange={(e) => set("discountValue", Number(e.target.value))} />
            </Field>
            <Field label="Pajak (%)">
              <Input type="number" min={0} value={inv.taxRate || ""} onChange={(e) => set("taxRate", Number(e.target.value))} placeholder="0" />
            </Field>
            <Field label="Ongkir / biaya">
              <Input type="number" min={0} value={inv.shipping || ""} onChange={(e) => set("shipping", Number(e.target.value))} placeholder="0" />
            </Field>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[0, 11, 12].map((r) => (
              <button key={r} type="button" onClick={() => set("taxRate", r)} className={cx("rounded-full border px-3 py-1 text-xs font-semibold", inv.taxRate === r ? "border-ink bg-ink text-hmif" : "border-black/15")}>
                {r === 0 ? "Tanpa pajak" : `PPN ${r}%`}
              </button>
            ))}
          </div>
        </Section>

        <Section n={6} title="Catatan & ketentuan">
          <div className="grid gap-3">
            <Field label="Catatan untuk klien">
              <Textarea value={inv.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
            <Field label="Syarat & ketentuan">
              <Textarea value={inv.terms} onChange={(e) => set("terms", e.target.value)} />
            </Field>
          </div>
        </Section>
      </div>

      {/* Summary: sticky on desktop, fixed bar on mobile */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <Card className="hidden overflow-hidden lg:block">
          <div className="stripes-thin h-3 bg-hmif" />
          <div className="p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">Ringkasan</div>
            <SumRow k="Subtotal" v={fmtMoney(t.subtotal, cur)} />
            {t.discount > 0 && <SumRow k="Diskon" v={"- " + fmtMoney(t.discount, cur)} />}
            {t.tax > 0 && <SumRow k={`Pajak ${inv.taxRate}%`} v={fmtMoney(t.tax, cur)} />}
            {inv.shipping > 0 && <SumRow k="Biaya lain" v={fmtMoney(inv.shipping, cur)} />}
            <div className="mt-3 border-t border-black/10 pt-3">
              <div className="text-xs text-neutral-500">Total</div>
              <div className="font-display text-3xl font-black">{fmtMoney(t.total, cur)}</div>
            </div>
            <div className="mt-5 space-y-2">
              <Button className="w-full" onClick={() => commit("submit")}>
                <Send size={16} /> {submitLabel}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => commit("draft")}>
                <Save size={16} /> Simpan draft
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setPreview(true)}>
                <Eye size={16} /> Pratinjau
              </Button>
            </div>
            {me!.role !== "admin" && db.settings.requireApproval && (
              <p className="mt-3 text-xs text-neutral-500">Invoice akan diperiksa bendahara sebelum diberi nomor resmi dan dikirim.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(true)} className="min-w-0 flex-1 text-left">
            <div className="text-[10px] font-bold uppercase text-neutral-500">Total · lihat pratinjau</div>
            <div className="truncate font-display text-lg font-black">{fmtMoney(t.total, cur)}</div>
          </button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => commit("draft")} aria-label="Simpan draft">
            <Save size={16} />
          </Button>
          <Button className="h-10" onClick={() => commit("submit")}>
            <Send size={16} /> {submitLabel === "Terbitkan" ? "Terbitkan" : "Ajukan"}
          </Button>
        </div>
      </div>

      <Modal open={preview} onClose={() => setPreview(false)} title="Pratinjau invoice" wide>
        <div className="-m-5 bg-neutral-100 p-3 sm:p-5">
          <InvoiceDocument inv={inv} settings={db.settings} />
        </div>
      </Modal>

      <Modal open={catalogOpen} onClose={() => setCatalogOpen(false)} title="Pilih dari katalog">
        <ul className="space-y-2">
          {catalog.map((c) => (
            <li key={c.id}>
              <button onClick={() => addFromCatalog(c.id)} className="flex w-full items-center justify-between rounded-xl border border-black/10 p-3 text-left hover:border-ink hover:bg-hmif-50">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-neutral-500">{c.description}</div>
                </div>
                <div className="ml-3 text-sm font-bold whitespace-nowrap">
                  {fmtMoney(c.unitPrice, cur)}
                  <span className="font-normal text-neutral-500">/{c.unit}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function Section({ n, title, right, children }: { n: number; title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-bold">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-ink text-xs text-hmif">{n}</span>
          {title}
        </h2>
        {right}
      </div>
      {children}
    </Card>
  );
}

function SumRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="mt-2 flex justify-between text-sm">
      <span className="text-neutral-600">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
