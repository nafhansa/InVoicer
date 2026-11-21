"use client";

import { Download, FilePlus2, FileText, Repeat, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, EmptyState, Input, PageHeader, Select, StatusBadge } from "@/components/ui";
import { useScoped, useStore } from "@/lib/store";
import type { DisplayStatus } from "@/lib/types";
import { calcTotals, cx, displayStatus, downloadCSV, fmtDate, fmtMoney, STATUS_META } from "@/lib/utils";

const TABS: ("all" | DisplayStatus)[] = ["all", "draft", "pending", "sent", "partial", "overdue", "paid", "rejected", "void"];

export default function InvoicesPage() {
  const { db, me } = useStore();
  const router = useRouter();
  const { invoices } = useScoped();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [owner, setOwner] = useState("all");
  const [sort, setSort] = useState("updated");
  const cur = db.settings.currency;

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return invoices
      .filter((i) => tab === "all" || displayStatus(i) === tab)
      .filter((i) => owner === "all" || i.ownerId === owner)
      .filter((i) => !s || [i.number, i.title, i.client.name, i.client.company].join(" ").toLowerCase().includes(s))
      .sort((a, b) => {
        if (sort === "due") return a.dueDate.localeCompare(b.dueDate);
        if (sort === "amount") return calcTotals(b).total - calcTotals(a).total;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [invoices, q, tab, owner, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: invoices.length };
    for (const i of invoices) c[displayStatus(i)] = (c[displayStatus(i)] ?? 0) + 1;
    return c;
  }, [invoices]);

  const ownerName = (id: string) => db.users.find((u) => u.id === id)?.name ?? "-";

  const exportCSV = () =>
    downloadCSV(`invoices-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Nomor", "Perihal", "Klien", "Pembuat", "Terbit", "Jatuh Tempo", "Status", "Total", "Dibayar", "Sisa"],
      ...rows.map((i) => {
        const t = calcTotals(i);
        return [i.number, i.title, i.client.company || i.client.name, ownerName(i.ownerId), i.issueDate, i.dueDate, STATUS_META[displayStatus(i)].label, t.total, t.paid, t.balance];
      }),
    ]);

  return (
    <div>
      <PageHeader
        title="Invoice"
        subtitle={me!.role === "admin" ? "Semua invoice dari seluruh divisi." : "Invoice yang kamu buat."}
        actions={
          <>
            <Button variant="outline" onClick={exportCSV}>
              <Download size={16} /> CSV
            </Button>
            <Link href="/invoices/new">
              <Button>
                <FilePlus2 size={16} /> Buat Invoice
              </Button>
            </Link>
          </>
        }
      />

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {TABS.filter((t) => t === "all" || counts[t]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
              tab === t ? "border-ink bg-ink text-hmif" : "border-black/10 bg-white hover:border-ink",
            )}
          >
            {t === "all" ? "Semua" : STATUS_META[t].label} <span className="opacity-60">{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nomor, perihal, klien..." className="pl-9" />
        </div>
        {me!.role === "admin" && (
          <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="all">Semua pembuat</option>
            {db.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        )}
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="updated">Terbaru diubah</option>
          <option value="due">Jatuh tempo terdekat</option>
          <option value="amount">Nominal terbesar</option>
        </Select>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Belum ada invoice"
            desc="Invoice yang cocok dengan filter akan muncul di sini."
            action={
              <Link href="/invoices/new">
                <Button>Buat Invoice</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-hmif-50 text-left text-[11px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Klien</th>
                  {me!.role === "admin" && <th className="px-4 py-3">Pembuat</th>}
                  <th className="px-4 py-3">Jatuh tempo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {rows.map((i) => {
                  const t = calcTotals(i);
                  return (
                    <tr key={i.id} className="cursor-pointer hover:bg-hmif-50" onClick={() => router.push(`/invoices/${i.id}`)}>
                      <td className="px-4 py-3">
                        <Link href={`/invoices/${i.id}`} className="font-semibold hover:underline">
                          {i.title}
                        </Link>
                        <div className="flex items-center gap-1 font-mono text-xs text-neutral-500">
                          {i.number}
                          {i.recurring !== "none" && <Repeat size={12} className="text-hmif-600" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">{i.client.company || i.client.name}</td>
                      {me!.role === "admin" && <td className="px-4 py-3 text-neutral-600">{ownerName(i.ownerId)}</td>}
                      <td className="px-4 py-3 whitespace-nowrap">{fmtDate(i.dueDate)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={displayStatus(i)} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-bold">{fmtMoney(t.total, cur)}</div>
                        {t.paid > 0 && t.balance > 0 && <div className="text-xs text-neutral-500">sisa {fmtMoney(t.balance, cur)}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {rows.map((i) => {
              const t = calcTotals(i);
              return (
                <Link key={i.id} href={`/invoices/${i.id}`}>
                  <Card className="mb-2 p-4 active:bg-hmif-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{i.title}</div>
                        <div className="truncate text-xs text-neutral-500">{i.client.company || i.client.name}</div>
                      </div>
                      <StatusBadge status={displayStatus(i)} />
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div className="font-mono text-[11px] text-neutral-500">
                        {i.number}
                        <div>Jatuh tempo {fmtDate(i.dueDate)}</div>
                      </div>
                      <div className="font-display text-lg font-extrabold">{fmtMoney(t.total, cur)}</div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
