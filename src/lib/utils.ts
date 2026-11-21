import type { DisplayStatus, Invoice } from "./types";

export const uid = (p = "") =>
  p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const addInterval = (iso: string, interval: string) => {
  const d = new Date(iso + "T00:00:00");
  if (interval === "weekly") d.setDate(d.getDate() + 7);
  if (interval === "monthly") d.setMonth(d.getMonth() + 1);
  if (interval === "quarterly") d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (a: string, b: string) =>
  Math.round(
    (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) /
      86400000,
  );

export const fmtMoney = (n: number, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(Number.isFinite(n) ? n : 0);

export const fmtCompact = (n: number) =>
  new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const fmtDate = (iso: string) =>
  iso
    ? new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function calcTotals(inv: Pick<Invoice, "items" | "discountType" | "discountValue" | "taxRate" | "shipping" | "payments">) {
  const subtotal = inv.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
  const discount =
    inv.discountType === "percent"
      ? (subtotal * (Number(inv.discountValue) || 0)) / 100
      : Math.min(Number(inv.discountValue) || 0, subtotal);
  const taxable = subtotal - discount;
  const tax = (taxable * (Number(inv.taxRate) || 0)) / 100;
  const total = taxable + tax + (Number(inv.shipping) || 0);
  const paid = inv.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  return { subtotal, discount, tax, total, paid, balance: Math.max(total - paid, 0) };
}

export function displayStatus(inv: Invoice): DisplayStatus {
  if ((inv.status === "sent" || inv.status === "partial") && inv.dueDate < todayISO()) return "overdue";
  return inv.status;
}

export const STATUS_META: Record<DisplayStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-neutral-200 text-neutral-700" },
  pending: { label: "Menunggu Approval", cls: "bg-amber-100 text-amber-800 ring-1 ring-amber-300" },
  rejected: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
  sent: { label: "Terkirim", cls: "bg-sky-100 text-sky-800" },
  partial: { label: "Dibayar Sebagian", cls: "bg-violet-100 text-violet-800" },
  paid: { label: "Lunas", cls: "bg-emerald-100 text-emerald-800" },
  overdue: { label: "Jatuh Tempo", cls: "bg-red-600 text-white" },
  void: { label: "Dibatalkan", cls: "bg-neutral-800 text-neutral-200 line-through" },
};

const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

function terbilangRaw(n: number): string {
  n = Math.floor(n);
  if (n < 12) return SATUAN[n];
  if (n < 20) return terbilangRaw(n - 10) + " belas";
  if (n < 100) return terbilangRaw(Math.floor(n / 10)) + " puluh " + terbilangRaw(n % 10);
  if (n < 200) return "seratus " + terbilangRaw(n - 100);
  if (n < 1000) return terbilangRaw(Math.floor(n / 100)) + " ratus " + terbilangRaw(n % 100);
  if (n < 2000) return "seribu " + terbilangRaw(n - 1000);
  if (n < 1e6) return terbilangRaw(Math.floor(n / 1000)) + " ribu " + terbilangRaw(n % 1000);
  if (n < 1e9) return terbilangRaw(Math.floor(n / 1e6)) + " juta " + terbilangRaw(n % 1e6);
  if (n < 1e12) return terbilangRaw(Math.floor(n / 1e9)) + " miliar " + terbilangRaw(n % 1e9);
  return terbilangRaw(Math.floor(n / 1e12)) + " triliun " + terbilangRaw(n % 1e12);
}

/** Indonesian amount-in-words, e.g. 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah". */
export function terbilang(n: number) {
  if (!n) return "Nol Rupiah";
  const s = terbilangRaw(n).replace(/\s+/g, " ").trim();
  return s.replace(/\b\w/g, (c) => c.toUpperCase()) + " Rupiah";
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
