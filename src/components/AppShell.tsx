"use client";

import {
  BookUser,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/utils";
import { Logo } from "./Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoice", icon: FileText },
  { href: "/clients", label: "Klien", icon: Users },
  { href: "/catalog", label: "Katalog Item", icon: Package },
  { href: "/profiles", label: "Profil Tagihan", icon: BookUser },
  { href: "/account", label: "Akun Saya", icon: UserCog },
];

const ADMIN_NAV = [
  { href: "/admin/users", label: "Kelola Pengguna", icon: ShieldCheck },
  { href: "/admin/settings", label: "Pengaturan Organisasi", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, me, logout, db } = useStore();
  const router = useRouter();
  const path = usePathname();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (ready && !me) router.replace("/");
  }, [ready, me, router]);

  if (!ready || !me) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-hmif border-t-ink" />
      </div>
    );
  }

  const isActive = (href: string) => (href === "/invoices" ? path === "/invoices" || (path.startsWith("/invoices/") && path !== "/invoices/new") : path.startsWith(href));
  const pendingCount = db.invoices.filter((i) => i.status === "pending").length;
  const links = me.role === "admin" ? [...NAV, ...ADMIN_NAV] : NAV;

  const doLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-white lg:flex">
        <div className="px-5 pt-6 pb-4">
          <Logo dark />
        </div>
        <div className="px-4 pb-4">
          <Link href="/invoices/new">
            <span className="flex h-11 items-center justify-center gap-2 rounded-xl bg-hmif font-bold text-ink transition hover:bg-hmif-300">
              <Plus size={18} /> Buat Invoice
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {NAV.map((n) => (
            <NavLink key={n.href} {...n} active={isActive(n.href)} badge={n.href === "/invoices" && me.role === "admin" ? pendingCount : 0} />
          ))}
          {me.role === "admin" && (
            <>
              <div className="px-3 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[.2em] text-hmif/70">Admin</div>
              {ADMIN_NAV.map((n) => (
                <NavLink key={n.href} {...n} active={isActive(n.href)} />
              ))}
            </>
          )}
        </nav>
        <div className="stripes-thin mx-4 h-6 opacity-30 invert" />
        <div className="flex items-center gap-3 border-t border-white/10 p-4">
          <Avatar name={me.name} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{me.name}</div>
            <div className="truncate text-xs text-white/50">{me.role === "admin" ? "Admin" : me.division}</div>
          </div>
          <button onClick={doLogout} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Keluar">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-black/10 bg-hmif px-4 py-3 lg:hidden">
        <Logo />
        <Avatar name={me.name} />
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-5 items-end">
          <BottomLink href="/dashboard" label="Beranda" icon={LayoutDashboard} active={isActive("/dashboard")} />
          <BottomLink href="/invoices" label="Invoice" icon={FileText} active={isActive("/invoices")} badge={me.role === "admin" ? pendingCount : 0} />
          <Link href="/invoices/new" className="-mt-5 flex flex-col items-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-ink bg-hmif shadow-[0_3px_0_#0b0b0b]">
              <Plus size={26} />
            </span>
          </Link>
          <BottomLink href="/clients" label="Klien" icon={Users} active={isActive("/clients")} />
          <button onClick={() => setMenu(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-neutral-500">
            <Menu size={22} />
            Menu
          </button>
        </div>
      </nav>

      {menu && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setMenu(false)}>
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-ink p-5 pb-8 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={me.name} />
                <div>
                  <div className="font-semibold">{me.name}</div>
                  <div className="text-xs text-white/50">{me.email}</div>
                </div>
              </div>
              <button onClick={() => setMenu(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Tutup">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {links.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenu(false)}
                  className={cx("flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium", isActive(n.href) ? "bg-hmif text-ink" : "bg-white/5")}
                >
                  <n.icon size={18} /> {n.label}
                </Link>
              ))}
            </div>
            <button onClick={doLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-semibold">
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavLink({ href, label, icon: Icon, active, badge }: { href: string; label: string; icon: React.ElementType; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      className={cx(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
        active ? "bg-hmif text-ink" : "text-white/70 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon size={18} />
      <span className="flex-1">{label}</span>
      {!!badge && <span className={cx("rounded-full px-2 text-xs font-bold", active ? "bg-ink text-hmif" : "bg-hmif text-ink")}>{badge}</span>}
    </Link>
  );
}

function BottomLink({ href, label, icon: Icon, active, badge }: { href: string; label: string; icon: React.ElementType; active: boolean; badge?: number }) {
  return (
    <Link href={href} className={cx("relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-ink" : "text-neutral-500")}>
      <span className={cx("rounded-full px-3 py-0.5", active && "bg-hmif")}>
        <Icon size={20} />
      </span>
      {label}
      {!!badge && <span className="absolute top-1 right-[22%] grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{badge}</span>}
    </Link>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-hmif font-display text-xs font-black text-ink">{initials}</div>;
}
