"use client";

import { ArrowRight, Bell, Copy, FileCheck2, Repeat, Share2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";

const DEMO = [
  { email: "admin@hmif.itb.ac.id", password: "admin123", label: "Admin", who: "Bendahara HMIF" },
  { email: "budi@std.stei.itb.ac.id", password: "user123", label: "User", who: "Budi, Divisi Eksternal" },
  { email: "sari@std.stei.itb.ac.id", password: "user123", label: "User", who: "Sari, Divisi Merchandise" },
];

const FEATURES = [
  { icon: Zap, text: "Profil tagihan tersimpan, isi sekali dipakai selamanya" },
  { icon: FileCheck2, text: "Alur approval bendahara sebelum invoice terbit" },
  { icon: Repeat, text: "Invoice berulang dan duplikasi sekali klik" },
  { icon: Share2, text: "Link publik, kirim via WhatsApp atau email" },
  { icon: Bell, text: "Pelacakan pembayaran sebagian dan jatuh tempo" },
  { icon: Copy, text: "PDF siap cetak dengan terbilang otomatis" },
];

export default function LoginPage() {
  const { ready, me, login } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (ready && me) router.replace("/dashboard");
  }, [ready, me, router]);

  const submit = (e?: React.FormEvent, creds?: { email: string; password: string }) => {
    e?.preventDefault();
    const res = login(creds?.email ?? email, creds?.password ?? password);
    if (res) setErr(res);
    else router.replace("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-hmif p-12 lg:flex lg:flex-col">
        <Logo />
        <div className="stripes absolute top-40 right-0 left-24 h-[300px] opacity-90" style={{ maskImage: "linear-gradient(to right, transparent, black 30%)" }} />
        <div className="relative mt-auto">
          <h1 className="font-display text-6xl leading-[.95] font-black tracking-tight">
            Invoice cepat.
            <br />
            Tanpa isi ulang.
          </h1>
          <p className="mt-4 max-w-md text-lg">Sistem invoicing Himpunan Mahasiswa Informatika ITB. Simpan data sekali, terbitkan invoice dalam hitungan detik.</p>
          <ul className="mt-8 grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2 text-sm font-medium">
                <f.icon size={18} className="mt-0.5 shrink-0" />
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
            <div className="stripes mt-6 h-14" />
          </div>
          <h2 className="font-display text-3xl font-extrabold">Masuk</h2>
          <p className="mt-1 text-sm text-neutral-600">Gunakan akun HMIF kamu.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@std.stei.itb.ac.id" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>
            {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <Button type="submit" className="h-11 w-full">
              Masuk <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-8">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Akun demo (prototype)</div>
            <div className="space-y-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  onClick={() => submit(undefined, d)}
                  className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-left transition hover:border-ink hover:shadow-[0_2px_0_#0b0b0b]"
                >
                  <div>
                    <div className="text-sm font-semibold">{d.who}</div>
                    <div className="text-xs text-neutral-500">
                      {d.email} / {d.password}
                    </div>
                  </div>
                  <span className={d.label === "Admin" ? "rounded-md bg-ink px-2 py-1 text-[10px] font-bold text-hmif uppercase" : "rounded-md bg-hmif px-2 py-1 text-[10px] font-bold uppercase"}>
                    {d.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
