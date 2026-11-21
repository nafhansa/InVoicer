"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { seedDB } from "./seed";
import type { BillingProfile, CatalogItem, Client, DB, Invoice, OrgSettings, Payment, User } from "./types";
import { addInterval, calcTotals, todayISO, uid } from "./utils";

const DB_KEY = "invoicer.db.v1";
const SESSION_KEY = "invoicer.session.v1";

type Upsertable = "profiles" | "clients" | "catalog" | "users";

interface Store {
  ready: boolean;
  db: DB;
  me: User | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  upsert: <K extends Upsertable>(col: K, row: DB[K][number]) => void;
  remove: (col: Upsertable | "invoices", id: string) => void;
  saveInvoice: (inv: Invoice, logText?: string) => void;
  setStatus: (id: string, status: Invoice["status"], logText: string, adminNote?: string) => void;
  issueNumber: () => string;
  addPayment: (id: string, p: Omit<Payment, "id">) => void;
  removePayment: (id: string, paymentId: string) => void;
  duplicate: (id: string) => string;
  log: (id: string, text: string, by?: string) => void;
  updateSettings: (s: Partial<OrgSettings>) => void;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

// Static placeholder for prerender; real data (seed or saved) loads on the client after mount.
const EMPTY_DB: DB = {
  users: [],
  profiles: [],
  clients: [],
  catalog: [],
  invoices: [],
  settings: {
    orgName: "HMIF ITB",
    orgTagline: "",
    orgAddress: "",
    orgEmail: "",
    prefix: "INV/HMIF",
    nextNumber: 1,
    requireApproval: true,
    currency: "IDR",
  },
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(EMPTY_DB);
  const [meId, setMeId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDb(raw ? JSON.parse(raw) : seedDB());
      setMeId(localStorage.getItem(SESSION_KEY));
    } catch {
      setDb(seedDB());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch {}
  }, [db, ready]);

  const me = useMemo(() => db.users.find((u) => u.id === meId && u.active) ?? null, [db.users, meId]);

  const login = useCallback(
    (email: string, password: string) => {
      const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u || u.password !== password) return "Email atau password salah";
      if (!u.active) return "Akun dinonaktifkan oleh admin";
      setMeId(u.id);
      try {
        localStorage.setItem(SESSION_KEY, u.id);
      } catch {}
      return null;
    },
    [db.users],
  );

  const logout = useCallback(() => {
    setMeId(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  const upsert = useCallback(<K extends Upsertable>(col: K, row: DB[K][number]) => {
    setDb((d) => {
      const list = d[col] as { id: string }[];
      const exists = list.some((x) => x.id === row.id);
      let next = exists ? list.map((x) => (x.id === row.id ? row : x)) : [...list, row];
      // only one default billing profile per owner
      if (col === "profiles" && (row as BillingProfile).isDefault) {
        const r = row as BillingProfile;
        next = (next as BillingProfile[]).map((p) =>
          p.ownerId === r.ownerId && p.id !== r.id ? { ...p, isDefault: false } : p,
        );
      }
      return { ...d, [col]: next };
    });
  }, []);

  const remove = useCallback((col: Upsertable | "invoices", id: string) => {
    setDb((d) => ({ ...d, [col]: (d[col] as { id: string }[]).filter((x) => x.id !== id) }));
  }, []);

  const by = me?.name ?? "Sistem";

  const patchInvoice = useCallback((id: string, fn: (i: Invoice) => Invoice) => {
    setDb((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === id ? { ...fn(i), updatedAt: new Date().toISOString() } : i)) }));
  }, []);

  const log = useCallback(
    (id: string, text: string, who?: string) =>
      patchInvoice(id, (i) => ({ ...i, activity: [...i.activity, { at: new Date().toISOString(), by: who ?? by, text }] })),
    [patchInvoice, by],
  );

  const issueNumber = useCallback(() => {
    const n = db.settings.nextNumber;
    const ym = todayISO().slice(0, 7).replace("-", "/");
    setDb((d) => ({ ...d, settings: { ...d.settings, nextNumber: Math.max(d.settings.nextNumber, n + 1) } }));
    return `${db.settings.prefix}/${ym}/${String(n).padStart(4, "0")}`;
  }, [db.settings]);

  const saveInvoice = useCallback(
    (inv: Invoice, logText?: string) => {
      setDb((d) => {
        const exists = d.invoices.some((x) => x.id === inv.id);
        const row: Invoice = {
          ...inv,
          updatedAt: new Date().toISOString(),
          activity: logText ? [...inv.activity, { at: new Date().toISOString(), by, text: logText }] : inv.activity,
        };
        return { ...d, invoices: exists ? d.invoices.map((x) => (x.id === inv.id ? row : x)) : [row, ...d.invoices] };
      });
    },
    [by],
  );

  const setStatus = useCallback(
    (id: string, status: Invoice["status"], logText: string, adminNote?: string) =>
      patchInvoice(id, (i) => ({
        ...i,
        status,
        adminNote: adminNote ?? i.adminNote,
        activity: [...i.activity, { at: new Date().toISOString(), by, text: logText }],
      })),
    [patchInvoice, by],
  );

  const addPayment = useCallback(
    (id: string, p: Omit<Payment, "id">) =>
      patchInvoice(id, (i) => {
        const payments = [...i.payments, { ...p, id: uid("pay-") }];
        const t = calcTotals({ ...i, payments });
        return {
          ...i,
          payments,
          status: t.balance <= 0 ? "paid" : "partial",
          activity: [...i.activity, { at: new Date().toISOString(), by, text: `Pembayaran dicatat (${p.method})` }],
        };
      }),
    [patchInvoice, by],
  );

  const removePayment = useCallback(
    (id: string, paymentId: string) =>
      patchInvoice(id, (i) => {
        const payments = i.payments.filter((p) => p.id !== paymentId);
        return {
          ...i,
          payments,
          status: payments.length ? "partial" : "sent",
          activity: [...i.activity, { at: new Date().toISOString(), by, text: "Pembayaran dihapus" }],
        };
      }),
    [patchInvoice, by],
  );

  const duplicate = useCallback(
    (id: string) => {
      const newId = uid("inv-");
      setDb((d) => {
        const src = d.invoices.find((i) => i.id === id);
        if (!src) return d;
        const issue = todayISO();
        const gap = Math.max(
          0,
          Math.round((new Date(src.dueDate).getTime() - new Date(src.issueDate).getTime()) / 86400000),
        );
        const due = new Date(issue);
        due.setDate(due.getDate() + gap);
        const copy: Invoice = {
          ...src,
          id: newId,
          number: "DRAFT",
          ownerId: me?.id ?? src.ownerId,
          title: src.recurring !== "none" ? src.title : src.title + " (salinan)",
          issueDate: src.recurring !== "none" ? addInterval(src.issueDate, src.recurring) : issue,
          dueDate: due.toISOString().slice(0, 10),
          items: src.items.map((x) => ({ ...x, id: uid() })),
          status: "draft",
          payments: [],
          adminNote: "",
          activity: [{ at: new Date().toISOString(), by, text: `Diduplikasi dari ${src.number}` }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { ...d, invoices: [copy, ...d.invoices] };
      });
      return newId;
    },
    [by, me],
  );

  const updateSettings = useCallback((s: Partial<OrgSettings>) => setDb((d) => ({ ...d, settings: { ...d.settings, ...s } })), []);

  const resetDemo = useCallback(() => {
    setDb(seedDB());
  }, []);

  const value: Store = {
    ready,
    db,
    me,
    login,
    logout,
    upsert,
    remove,
    saveInvoice,
    setStatus,
    issueNumber,
    addPayment,
    removePayment,
    duplicate,
    log,
    updateSettings,
    resetDemo,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

/** Records visible to the current user: admins see everything, users see their own. */
export function useScoped() {
  const { db, me } = useStore();
  return useMemo(() => {
    const mine = <T extends { ownerId: string }>(rows: T[]) =>
      me?.role === "admin" ? rows : rows.filter((r) => r.ownerId === me?.id);
    return {
      invoices: mine(db.invoices),
      clients: mine(db.clients),
      catalog: mine(db.catalog),
      profiles: db.profiles.filter((p) => p.ownerId === me?.id),
    };
  }, [db, me]);
}

export type { BillingProfile, CatalogItem, Client };
