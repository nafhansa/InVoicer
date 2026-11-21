"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock, FilePlus2, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { useScoped, useStore } from "@/lib/store";
import { calcTotals, displayStatus, fmtCompact, fmtDate, fmtMoney, todayISO } from "@/lib/utils";

export default function Dashboard() {
  const { me, db } = useStore();
  const { invoices, profiles } = useScoped();
  const cur = db.settings.currency;

  const stats = useMemo(() => {
    let billed = 0,
      collected = 0,
      outstanding = 0,
      overdue = 0,
      overdueCount = 0;
    for (const i of invoices) {
      if (["draft", "pending", "rejected", "void"].includes(i.status)) continue;
      const t = calcTotals(i);
      billed += t.total;
      collected += t.paid;
      outstanding += t.balance;
      if (displayStatus(i) === "overdue") {
        overdue += t.balance;
        overdueCount++;
      }
    }
    // last 6 months collected
    const months: { key: string; label: string; value: number }[] = [];
    const d = new Date();
    for (let k = 5; k >= 0; k--) {
      const m = new Date(d.getFullYear(), d.getMonth() - k, 1);
      months.push({
        key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
        label: m.toLocaleDateString("id-ID", { month: "short" }),
        value: 0,
      });
    }
    for (const i of invoices) for (const p of i.payments) {
      const mm = months.find((m) => p.date.startsWith(m.key));
      if (mm) mm.value += p.amount;
    }
    return { billed, collected, outstanding, overdue, overdueCount, months };
  }, [invoices]);

  const pending = invoices.filter((i) => i.status === "pending");
  const recent = [...invoices].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const dueSoon = invoices
    .filter((i) => (i.status === "sent" || i.status === "partial") && i.dueDate >= todayISO())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
  const max = Math.max(1, ...stats.months.map((m) => m.value));
  const rate = stats.billed ? Math.round((stats.collected / stats.billed) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={`Halo, ${me!.name.split(" ")[0]}`}
        subtitle={me!.role === "admin" ? "Ringkasan keuangan seluruh divisi HMIF." : `Ringkasan invoice ${me!.division}.`}
        actions={
          <Link href="/invoices/new">
            <Button>
              <FilePlus2 size={16} /> Buat Invoice
            </Button>
          </Link>
        }
      />

      {profiles.length === 0 && (
        <Card className="mb-6 flex flex-col gap-3 border-ink bg-hmif p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm font-medium">Kamu belum punya profil tagihan. Buat sekali, lalu semua invoice akan terisi otomatis.</p>
          <Link href="/profiles">
            <Button variant="dark" size="sm">Buat Profil</Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Wallet} label="Total ditagihkan" value={fmtMoney(stats.billed, cur)} dark />
        <Stat icon={CheckCircle2} label="Sudah diterima" value={fmtMoney(stats.collected, cur)} sub={`${rate}% terkumpul`} />
        <Stat icon={Clock} label="Belum dibayar" value={fmtMoney(stats.outstanding, cur)} />
        <Stat icon={AlertTriangle} label="Jatuh tempo" value={fmtMoney(stats.overdue, cur)} sub={`${stats.overdueCount} invoice`} warn={stats.overdueCount > 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Pemasukan 6 bulan terakhir</h2>
          </div>
          <div className="flex h-48 gap-3">
            {stats.months.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-[10px] font-semibold text-neutral-500">{m.value ? fmtCompact(m.value) : ""}</div>
                <div className="relative w-full flex-1">
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t-md border-2 border-ink bg-hmif transition-all"
                    style={{ height: `${Math.max(3, (m.value / max) * 100)}%` }}
                  />
                </div>
                <div className="text-xs font-semibold uppercase">{m.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg font-bold">{me!.role === "admin" ? "Butuh approval" : "Jatuh tempo terdekat"}</h2>
          {(me!.role === "admin" ? pending : dueSoon).length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">Tidak ada. Aman.</p>
          ) : (
            <ul className="space-y-2">
              {(me!.role === "admin" ? pending : dueSoon).map((i) => (
                <li key={i.id}>
                  <Link href={`/invoices/${i.id}`} className="flex items-center justify-between rounded-xl border border-black/10 p-3 transition hover:border-ink">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{i.title}</div>
                      <div className="text-xs text-neutral-500">
                        {i.client.company || i.client.name} · {fmtDate(i.dueDate)}
                      </div>
                    </div>
                    <div className="ml-2 text-right text-sm font-bold whitespace-nowrap">{fmtCompact(calcTotals(i).balance)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 className="font-display text-lg font-bold">Aktivitas terbaru</h2>
          <Link href="/invoices" className="flex items-center gap-1 text-sm font-semibold hover:underline">
            Semua <ArrowRight size={14} />
          </Link>
        </div>
        <ul className="divide-y divide-black/5">
          {recent.map((i) => (
            <li key={i.id}>
              <Link href={`/invoices/${i.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-hmif-50">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{i.title}</div>
                  <div className="truncate text-xs text-neutral-500">
                    {i.number} · {i.client.company || i.client.name}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <StatusBadge status={displayStatus(i)} />
                </div>
                <div className="text-right text-sm font-bold whitespace-nowrap">{fmtMoney(calcTotals(i).total, cur)}</div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, dark, warn }: { icon: React.ElementType; label: string; value: string; sub?: string; dark?: boolean; warn?: boolean }) {
  return (
    <Card className={`p-4 ${dark ? "border-ink !bg-ink text-white" : ""} ${warn ? "border-red-300 !bg-red-50" : ""}`}>
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${dark ? "bg-hmif text-ink" : warn ? "bg-red-600 text-white" : "bg-hmif-100"}`}>
        <Icon size={18} />
      </div>
      <div className={`text-xs font-medium ${dark ? "text-white/60" : "text-neutral-500"}`}>{label}</div>
      <div className="mt-0.5 font-display text-lg font-extrabold leading-tight break-all sm:text-xl">{value}</div>
      {sub && <div className={`mt-0.5 text-xs ${dark ? "text-hmif" : "text-neutral-500"}`}>{sub}</div>}
    </Card>
  );
}
