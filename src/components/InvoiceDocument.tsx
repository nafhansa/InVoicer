import type { Invoice, OrgSettings } from "@/lib/types";
import { calcTotals, displayStatus, fmtDate, fmtMoney, STATUS_META, terbilang } from "@/lib/utils";

/** Printable A4-ish invoice. Used in preview, detail page, and public link. */
export function InvoiceDocument({ inv, settings }: { inv: Invoice; settings: OrgSettings }) {
  const t = calcTotals(inv);
  const cur = settings.currency;
  const st = displayStatus(inv);
  const stamp = st === "paid" ? "LUNAS" : st === "void" ? "BATAL" : st === "overdue" ? "JATUH TEMPO" : null;

  return (
    <div className="print-area relative mx-auto w-full max-w-[820px] overflow-hidden rounded-2xl border border-black/10 bg-white text-[13px] text-ink shadow-sm">
      <div className="flex items-stretch">
        <div className="flex-1 bg-hmif px-6 py-6 sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="font-display text-3xl font-black tracking-tight sm:text-4xl">INVOICE</div>
              <div className="mt-1 font-mono text-xs font-semibold">{inv.number}</div>
            </div>
            <div className="sm:text-right">
              <div className="font-display text-base font-extrabold">{inv.profile.senderName}</div>
              <div className="max-w-[260px] text-xs whitespace-pre-line sm:ml-auto">{inv.profile.address}</div>
              <div className="text-xs">
                {inv.profile.senderEmail} · {inv.profile.senderPhone}
              </div>
              {inv.profile.npwp && <div className="text-xs">NPWP {inv.profile.npwp}</div>}
            </div>
          </div>
        </div>
        <div className="stripes hidden w-16 bg-hmif sm:block" />
      </div>

      <div className="px-6 py-6 sm:px-10">
        {stamp && (
          <div
            className={`pointer-events-none absolute bottom-28 left-1/3 rotate-[-14deg] rounded-lg border-4 px-4 py-1 font-display text-2xl font-black tracking-widest opacity-80 ${
              stamp === "LUNAS" ? "border-emerald-600 text-emerald-600" : "border-red-600 text-red-600"
            }`}
          >
            {stamp}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label>Ditagihkan kepada</Label>
            <div className="font-semibold">{inv.client.company || inv.client.name}</div>
            {inv.client.company && <div>u.p. {inv.client.name}</div>}
            <div className="whitespace-pre-line text-neutral-600">{inv.client.address}</div>
            <div className="text-neutral-600">{inv.client.email}</div>
            <div className="text-neutral-600">{inv.client.phone}</div>
          </div>
          <div>
            <Label>Perihal</Label>
            <div className="font-semibold">{inv.title || "-"}</div>
            <div className="mt-3 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide no-print">
              <span className={`rounded-full px-2 py-0.5 ${STATUS_META[st].cls}`}>{STATUS_META[st].label}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
            <div>
              <Label>Tanggal terbit</Label>
              <div className="font-semibold">{fmtDate(inv.issueDate)}</div>
            </div>
            <div>
              <Label>Jatuh tempo</Label>
              <div className="font-semibold">{fmtDate(inv.dueDate)}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr className="bg-ink text-left text-[11px] uppercase tracking-wider text-hmif">
                <th className="rounded-l-md px-3 py-2 font-bold">Item</th>
                <th className="px-3 py-2 text-right font-bold">Qty</th>
                <th className="px-3 py-2 text-right font-bold">Harga</th>
                <th className="rounded-r-md px-3 py-2 text-right font-bold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it) => (
                <tr key={it.id} className="border-b border-black/10 align-top">
                  <td className="px-3 py-3">
                    <div className="font-semibold">{it.name || "-"}</div>
                    {it.description && <div className="text-xs text-neutral-500">{it.description}</div>}
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    {it.qty} {it.unit}
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">{fmtMoney(it.unitPrice, cur)}</td>
                  <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">{fmtMoney(it.qty * it.unitPrice, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div className="sm:max-w-[48%]">
            <Label>Pembayaran ke</Label>
            <div className="rounded-xl border-2 border-dashed border-ink/20 p-3">
              <div className="font-semibold">{inv.profile.bankName}</div>
              <div className="font-mono text-base font-bold tracking-wide">{inv.profile.bankAccount}</div>
              <div className="text-xs text-neutral-600">a.n. {inv.profile.bankHolder}</div>
            </div>
          </div>
          <div className="w-full sm:w-72">
            <Row k="Subtotal" v={fmtMoney(t.subtotal, cur)} />
            {t.discount > 0 && <Row k={`Diskon${inv.discountType === "percent" ? ` (${inv.discountValue}%)` : ""}`} v={"- " + fmtMoney(t.discount, cur)} />}
            {inv.taxRate > 0 && <Row k={`Pajak (${inv.taxRate}%)`} v={fmtMoney(t.tax, cur)} />}
            {inv.shipping > 0 && <Row k="Ongkir / Biaya lain" v={fmtMoney(inv.shipping, cur)} />}
            <div className="mt-2 flex items-center justify-between rounded-lg bg-ink px-3 py-2.5 text-hmif">
              <span className="text-xs font-bold uppercase tracking-wider">Total</span>
              <span className="font-display text-lg font-black">{fmtMoney(t.total, cur)}</span>
            </div>
            {t.paid > 0 && (
              <>
                <Row k="Sudah dibayar" v={"- " + fmtMoney(t.paid, cur)} />
                <Row k="Sisa tagihan" v={fmtMoney(t.balance, cur)} bold />
              </>
            )}
          </div>
        </div>

        {cur === "IDR" && (
          <div className="mt-4 rounded-lg bg-hmif-50 px-3 py-2 text-xs italic">
            <span className="font-semibold not-italic">Terbilang: </span>
            {terbilang(Math.round(t.total))}
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-4">
            {inv.notes && (
              <div>
                <Label>Catatan</Label>
                <p className="whitespace-pre-line text-neutral-700">{inv.notes}</p>
              </div>
            )}
            {inv.terms && (
              <div>
                <Label>Syarat & Ketentuan</Label>
                <p className="whitespace-pre-line text-xs text-neutral-600">{inv.terms}</p>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-600">Bandung, {fmtDate(inv.issueDate)}</div>
            <div className="h-16" />
            <div className="border-t border-ink pt-1 font-semibold">{inv.profile.signatureName}</div>
            <div className="text-xs text-neutral-600">{inv.profile.signatureTitle}</div>
          </div>
        </div>
      </div>
      <div className="stripes-thin h-4 bg-hmif opacity-90" />
      <div className="bg-hmif px-6 py-2 text-center text-[10px] font-semibold uppercase tracking-[.2em] sm:px-10">
        {settings.orgTagline}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-[10px] font-bold uppercase tracking-[.15em] text-neutral-500">{children}</div>;
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1 ${bold ? "font-bold" : ""}`}>
      <span className="text-neutral-600">{k}</span>
      <span>{v}</span>
    </div>
  );
}
