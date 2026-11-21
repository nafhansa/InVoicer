"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { DisplayStatus } from "@/lib/types";
import { cx, STATUS_META } from "@/lib/utils";

type BtnVariant = "primary" | "dark" | "ghost" | "outline" | "danger";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-hmif text-ink hover:bg-hmif-500 shadow-[0_2px_0_#0b0b0b] border border-ink",
        variant === "dark" && "bg-ink text-hmif hover:bg-ink-2",
        variant === "ghost" && "text-ink hover:bg-black/5",
        variant === "outline" && "border border-black/15 bg-white hover:bg-black/5",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("rounded-2xl border border-black/10 bg-white", className)} />;
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-hmif";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, "h-10", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cx(inputCls, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, "h-10", props.className)} />;
}

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const m = STATUS_META[status];
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", m.cls)}>{m.label}</span>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={cx(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white px-5 py-4">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-black/5" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-hmif text-ink">{icon}</div>
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const ToastCtx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msgs, setMsgs] = useState<{ id: number; msg: string }[]>([]);
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setMsgs((m) => [...m, { id, msg }]);
    setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {msgs.map((m) => (
          <div key={m.id} className="rounded-xl border border-hmif bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            {m.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

export function AdminOnly() {
  return (
    <Card className="p-10 text-center">
      <p className="font-display text-xl font-bold">Khusus admin</p>
      <Link href="/dashboard" className="mt-2 inline-block text-sm font-semibold underline">
        Kembali ke dashboard
      </Link>
    </Card>
  );
}
