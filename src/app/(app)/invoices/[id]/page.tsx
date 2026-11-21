"use client";

import {
  ArrowLeft,
  Ban,
  BellRing,
  Check,
  Copy,
  CopyPlus,
  FileX,
  Link2,
  Mail,
  MessageCircle,
  Pencil,
  Printer,
  Repeat,
  Send,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { Button, Card, EmptyState, Field, Input, Modal, Select, StatusBadge, Textarea, useToast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { calcTotals, displayStatus, fmtDate, fmtDateTime, fmtMoney, todayISO } from "@/lib/utils";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const { db, me, setStatus, addPayment, removePayment, duplicate, remove, issueNumber, saveInvoice, log } = store;
  const router = useRouter();
  const toast = useToast();
  const inv = db.invoices.find((i) => i.id === id);

  const [payOpen, setPayOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [pay, setPay] = useState({ date: todayISO(), amount: 0, method: "Transfer Bank", note: "" });

  if (!inv || (me!.role !== "admin" && inv.ownerId !== me!.id)) {
    return (
      <Card>
        <EmptyState
          icon={<FileX />}
          title="Invoice tidak ditemukan"
          desc="Mungkin sudah dihapus atau kamu tidak punya akses."
          action={
            <Link href="/invoices">
              <Button>Kembali</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const t = calcTotals(inv);
  const cur = db.settings.currency;
  const st = displayStatus(inv);
  const isAdmin = me!.role === "admin";
  const isOwner = inv.ownerId === me!.id;
  const issued = ["sent", "partial", "paid"].includes(inv.status);
  const canEdit = isAdmin ? !["paid", "void"].includes(inv.status) : isOwner && ["draft", "rejected", "pending"].includes(inv.status);
  const owner = db.users.find((u) => u.id === inv.ownerId);
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${inv.id}` : `/p/${inv.id}`;
  const progress = t.total ? Math.min(100, (t.paid / t.total) * 100) : 0;

  const shareText =
    `Halo ${inv.client.name},\n\nBerikut invoice ${inv.number} untuk "${inv.title}" sebesar ${fmtMoney(t.balance, cur)}, jatuh tempo ${fmtDate(inv.dueDate)}.\n\n` +
    `Pembayaran: ${inv.profile.bankName} ${inv.profile.bankAccount} a.n. ${inv.profile.bankHolder}\nLihat invoice: ${publicUrl}\n\nTerima kasih,\n${inv.profile.signatureName}`;
  const reminderText =
    `Halo ${inv.client.name}, ini pengingat ramah bahwa invoice ${inv.number} (${inv.title}) dengan sisa tagihan ${fmtMoney(t.balance, cur)} ` +
    `${st === "overdue" ? "telah melewati" : "akan mencapai"} jatuh tempo pada ${fmtDate(inv.dueDate)}.\nDetail: ${publicUrl}\n\nTerima kasih.`;
  const waNumber = inv.client.phone.replace(/\D/g, "").replace(/^0/, "62");

  const approve = () => {
    const number = inv.number === "DRAFT" ? issueNumber() : inv.number;
    saveInvoice({ ...inv, number, status: "sent", adminNote: "" }, `Disetujui & diterbitkan (${number})`);
    toast("Invoice disetujui dan diterbitkan");
  };
  const submit = () => {
    if (!isAdmin && db.settings.requireApproval) {
      setStatus(inv.id, "pending", "Diajukan untuk approval");
      toast("Diajukan ke bendahara");
    } else approve();
  };
  const reject = () => {
    setStatus(inv.id, "rejected", `Ditolak: ${rejectNote || "tanpa catatan"}`, rejectNote);
    setRejectOpen(false);
    setRejectNote("");
    toast("Invoice ditolak");
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast("Link publik disalin");
    } catch {
      toast(publicUrl);
    }
  };
  const doDuplicate = () => {
    const nid = duplicate(inv.id);
    toast(inv.recurring !== "none" ? "Invoice periode berikutnya dibuat" : "Invoice diduplikasi");
    router.push(`/invoices/${nid}/edit`);
  };
  const doDelete = () => {
    if (!confirm("Hapus invoice ini? Tindakan tidak bisa dibatalkan.")) return;
    remove("invoices", inv.id);
    toast("Invoice dihapus");
    router.replace("/invoices");
  };
  const doVoid = () => {
    if (!confirm("Batalkan (void) invoice ini?")) return;
    setStatus(inv.id, "void", "Invoice dibatalkan");
  };
  const savePayment = () => {
    if (pay.amount <= 0) return toast("Nominal harus lebih dari 0");
    addPayment(inv.id, pay);
    setPayOpen(false);
    toast("Pembayaran dicatat");
  };

  return (
    <div>
      <div className="no-print mb-5 flex flex-col gap-4">
        <Link href="/invoices" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-neutral-600 hover:text-ink">
          <ArrowLeft size={16} /> Semua invoice
        </Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={st} />
              {inv.recurring !== "none" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-hmif-100 px-2 py-0.5 text-[11px] font-bold uppercase">
                  <Repeat size={11} /> {inv.recurring === "weekly" ? "Mingguan" : inv.recurring === "monthly" ? "Bulanan" : "Per 3 bulan"}
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">{inv.title}</h1>
            <p className="font-mono text-sm text-neutral-500">
              {inv.number} · dibuat oleh {owner?.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && inv.status === "pending" && (
              <>
                <Button onClick={approve}>
                  <Check size={16} /> Setujui & Terbitkan
                </Button>
                <Button variant="danger" onClick={() => setRejectOpen(true)}>
                  <X size={16} /> Tolak
                </Button>
              </>
            )}
            {(inv.status === "draft" || inv.status === "rejected") && (isOwner || isAdmin) && (
              <Button onClick={submit}>
                <Send size={16} /> {!isAdmin && db.settings.requireApproval ? "Ajukan Approval" : "Terbitkan"}
              </Button>
            )}
            {issued && inv.status !== "paid" && (isAdmin || isOwner) && (
              <Button
                onClick={() => {
                  setPay({ date: todayISO(), amount: t.balance, method: "Transfer Bank", note: "" });
                  setPayOpen(true);
                }}
              >
                <Wallet size={16} /> Catat Pembayaran
              </Button>
            )}
            {canEdit && (
              <Link href={`/invoices/${inv.id}/edit`}>
                <Button variant="outline">
                  <Pencil size={16} /> Edit
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} /> PDF
            </Button>
          </div>
        </div>
      </div>

      {inv.status === "rejected" && inv.adminNote && (
        <Card className="no-print mb-5 border-red-300 bg-red-50 p-4 text-sm">
          <b>Ditolak bendahara:</b> {inv.adminNote}
        </Card>
      )}
      {inv.status === "pending" && !isAdmin && (
        <Card className="no-print mb-5 border-amber-300 bg-amber-50 p-4 text-sm">Menunggu persetujuan bendahara. Nomor invoice resmi akan diberikan setelah disetujui.</Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="-mx-4 sm:mx-0">
          <InvoiceDocument inv={inv} settings={db.settings} />
        </div>

        <div className="no-print space-y-4">
          <Card className="p-5">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-neutral-500">Sisa tagihan</div>
                <div className="font-display text-2xl font-black">{fmtMoney(t.balance, cur)}</div>
              </div>
              <div className="text-right text-xs text-neutral-500">dari {fmtMoney(t.total, cur)}</div>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full border border-ink bg-neutral-100">
              <div className="h-full bg-hmif transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 text-xs text-neutral-500">{Math.round(progress)}% terbayar</div>

            {inv.payments.length > 0 && (
              <ul className="mt-4 space-y-2">
                {inv.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                    <div>
                      <div className="font-semibold">{fmtMoney(p.amount, cur)}</div>
                      <div className="text-xs text-neutral-500">
                        {fmtDate(p.date)} · {p.method}
                        {p.note && ` · ${p.note}`}
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => removePayment(inv.id, p.id)} className="rounded p-1 text-neutral-400 hover:text-red-600" aria-label="Hapus pembayaran">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Kirim & bagikan</div>
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn icon={Link2} label="Salin link" onClick={copyLink} disabled={!issued} />
              <ActionBtn
                icon={MessageCircle}
                label="WhatsApp"
                disabled={!issued}
                onClick={() => {
                  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(shareText)}`, "_blank");
                  log(inv.id, "Dikirim via WhatsApp");
                }}
              />
              <ActionBtn
                icon={Mail}
                label="Email"
                disabled={!issued}
                onClick={() => {
                  window.location.href = `mailto:${inv.client.email}?subject=${encodeURIComponent(`Invoice ${inv.number}: ${inv.title}`)}&body=${encodeURIComponent(shareText)}`;
                  log(inv.id, "Dikirim via email");
                }}
              />
              <ActionBtn
                icon={BellRing}
                label="Pengingat"
                disabled={!(inv.status === "sent" || inv.status === "partial")}
                onClick={() => {
                  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(reminderText)}`, "_blank");
                  log(inv.id, "Pengingat pembayaran dikirim");
                  toast("Pengingat dicatat");
                }}
              />
            </div>
            {!issued && <p className="mt-2 text-xs text-neutral-500">Tersedia setelah invoice diterbitkan.</p>}

            <div className="mt-4 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Lainnya</div>
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn icon={inv.recurring !== "none" ? Repeat : CopyPlus} label={inv.recurring !== "none" ? "Periode berikut" : "Duplikasi"} onClick={doDuplicate} />
              <ActionBtn
                icon={Copy}
                label="Lihat publik"
                disabled={!issued}
                onClick={() => window.open(`/p/${inv.id}`, "_blank")}
              />
              {isAdmin && issued && <ActionBtn icon={Ban} label="Void" onClick={doVoid} danger />}
              {(inv.status === "draft" || inv.status === "rejected" || (isAdmin && inv.status !== "paid")) && <ActionBtn icon={Trash2} label="Hapus" onClick={doDelete} danger />}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Riwayat aktivitas</div>
            <ol className="relative space-y-4 border-l-2 border-hmif pl-4">
              {[...inv.activity].reverse().map((a, k) => (
                <li key={k} className="relative">
                  <span className="absolute top-1 -left-[23px] h-3 w-3 rounded-full border-2 border-ink bg-hmif" />
                  <div className="text-sm font-medium">{a.text}</div>
                  <div className="text-xs text-neutral-500">
                    {a.by} · {fmtDateTime(a.at)}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Catat pembayaran">
        <div className="space-y-3">
          <Field label="Nominal" hint={`Sisa tagihan ${fmtMoney(t.balance, cur)}`}>
            <Input type="number" value={pay.amount || ""} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} />
          </Field>
          <div className="flex gap-1.5">
            {[100, 50, 30].map((p) => (
              <button key={p} onClick={() => setPay({ ...pay, amount: Math.round((t.balance * p) / 100) })} className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold hover:border-ink">
                {p === 100 ? "Lunas" : `${p}%`}
              </button>
            ))}
          </div>
          <Field label="Tanggal">
            <Input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} />
          </Field>
          <Field label="Metode">
            <Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
              {["Transfer Bank", "QRIS", "Tunai", "E-Wallet", "Lainnya"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </Field>
          <Field label="Catatan">
            <Input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} placeholder="cth. DP 50%" />
          </Field>
          <Button className="w-full" onClick={savePayment}>
            Simpan pembayaran
          </Button>
        </div>
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Tolak invoice">
        <Field label="Alasan / catatan untuk pembuat">
          <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="cth. Nominal sponsor belum sesuai MoU" />
        </Field>
        <Button variant="danger" className="mt-4 w-full" onClick={reject}>
          Tolak invoice
        </Button>
      </Modal>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, disabled, danger }: { icon: React.ElementType; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:opacity-40 ${
        danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-black/10 hover:border-ink hover:bg-hmif-50"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}
