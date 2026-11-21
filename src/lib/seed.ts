import type { BillingProfile, CatalogItem, Client, DB, Invoice, LineItem } from "./types";
import { addDays, todayISO } from "./utils";

const users: DB["users"] = [
  {
    id: "u-admin",
    name: "Bendahara HMIF",
    email: "admin@hmif.itb.ac.id",
    password: "admin123",
    role: "admin",
    division: "Kesekretariatan & Keuangan",
    phone: "081200000001",
    active: true,
    createdAt: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "u-budi",
    name: "Budi Santoso",
    email: "budi@std.stei.itb.ac.id",
    password: "user123",
    role: "user",
    division: "Divisi Eksternal",
    phone: "081200000002",
    active: true,
    createdAt: "2026-02-10T08:00:00.000Z",
  },
  {
    id: "u-sari",
    name: "Sari Wulandari",
    email: "sari@std.stei.itb.ac.id",
    password: "user123",
    role: "user",
    division: "Divisi Media & Merchandise",
    phone: "081200000003",
    active: true,
    createdAt: "2026-03-01T08:00:00.000Z",
  },
];

const baseProfile = {
  senderEmail: "keuangan@hmif.itb.ac.id",
  senderPhone: "+62 22 2500935",
  address: "Gedung Labtek V, Jl. Ganesha No. 10, Bandung 40132",
  npwp: "01.234.567.8-423.000",
  bankName: "Bank Mandiri",
  bankAccount: "130-00-1234567-8",
  bankHolder: "HMIF ITB",
  defaultTaxRate: 0,
  defaultDueDays: 14,
  defaultTerms: "Pembayaran dilakukan melalui transfer ke rekening di atas. Mohon cantumkan nomor invoice pada berita transfer.",
  signatureTitle: "Bendahara Umum",
};

const profiles: BillingProfile[] = [
  {
    ...baseProfile,
    id: "p-admin",
    ownerId: "u-admin",
    label: "HMIF ITB (Umum)",
    isDefault: true,
    senderName: "Himpunan Mahasiswa Informatika ITB",
    defaultNotes: "Terima kasih atas kerja samanya.",
    signatureName: "Bendahara HMIF",
  },
  {
    ...baseProfile,
    id: "p-budi",
    ownerId: "u-budi",
    label: "Sponsorship Eksternal",
    isDefault: true,
    senderName: "HMIF ITB, Divisi Eksternal",
    senderEmail: "eksternal@hmif.itb.ac.id",
    defaultTaxRate: 11,
    defaultDueDays: 30,
    defaultNotes: "Terima kasih telah mendukung kegiatan HMIF ITB.",
    signatureName: "Budi Santoso",
    signatureTitle: "Kepala Divisi Eksternal",
  },
  {
    ...baseProfile,
    id: "p-sari",
    ownerId: "u-sari",
    label: "Penjualan Merchandise",
    isDefault: true,
    senderName: "HMIF ITB, Media & Merchandise",
    senderEmail: "merch@hmif.itb.ac.id",
    defaultDueDays: 7,
    defaultNotes: "Barang dikirim setelah pembayaran terverifikasi.",
    signatureName: "Sari Wulandari",
    signatureTitle: "Kepala Divisi Merchandise",
  },
];

const clients: Client[] = [
  { id: "c-1", ownerId: "u-budi", name: "Rina Pratama", company: "PT Teknologi Nusantara", email: "rina@teknus.co.id", phone: "081311112222", address: "Jl. Sudirman Kav. 21, Jakarta", notes: "Sponsor Gold Arkavidia" },
  { id: "c-2", ownerId: "u-budi", name: "Andi Wijaya", company: "CV Kode Kreatif", email: "andi@kodekreatif.id", phone: "081322223333", address: "Jl. Dago No. 88, Bandung", notes: "" },
  { id: "c-3", ownerId: "u-sari", name: "Dimas Haryo", company: "HMIF Alumni Association", email: "dimas@alumni.hmif.id", phone: "081344445555", address: "Bandung", notes: "Order jaket angkatan" },
  { id: "c-4", ownerId: "u-admin", name: "Lembaga Kemahasiswaan", company: "Direktorat Kemahasiswaan ITB", email: "lk@itb.ac.id", phone: "0222500935", address: "Jl. Ganesha No. 10, Bandung", notes: "" },
];

const catalog: CatalogItem[] = [
  { id: "k-1", ownerId: "u-budi", name: "Paket Sponsor Gold", description: "Logo besar di semua materi publikasi + booth", unit: "paket", unitPrice: 25000000 },
  { id: "k-2", ownerId: "u-budi", name: "Paket Sponsor Silver", description: "Logo sedang + 1 sesi talk", unit: "paket", unitPrice: 12500000 },
  { id: "k-3", ownerId: "u-budi", name: "Booth Expo", description: "Booth 3x3m selama acara", unit: "hari", unitPrice: 2000000 },
  { id: "k-4", ownerId: "u-sari", name: "Jaket Himpunan", description: "Jaket bomber bordir logo HMIF", unit: "pcs", unitPrice: 225000 },
  { id: "k-5", ownerId: "u-sari", name: "Kaos Arkavidia", description: "Kaos cotton combed 24s", unit: "pcs", unitPrice: 95000 },
  { id: "k-6", ownerId: "u-sari", name: "Sticker Pack", description: "Isi 10 sticker vinyl", unit: "pack", unitPrice: 25000 },
  { id: "k-7", ownerId: "u-admin", name: "Sewa Sekretariat", description: "Peminjaman ruang himpunan", unit: "hari", unitPrice: 300000 },
];

function li(name: string, qty: number, unit: string, unitPrice: number, description = ""): LineItem {
  return { id: Math.random().toString(36).slice(2, 9), name, description, qty, unit, unitPrice };
}

function inv(
  n: number,
  ownerId: string,
  profileId: string,
  clientId: string,
  title: string,
  issueOffset: number,
  dueDays: number,
  status: Invoice["status"],
  items: LineItem[],
  extra: Partial<Invoice> = {},
): Invoice {
  const p = profiles.find((x) => x.id === profileId)!;
  const c = clients.find((x) => x.id === clientId)!;
  const issue = addDays(todayISO(), issueOffset);
  const { id: _pid, ownerId: _po, label: _pl, isDefault: _pd, ...profile } = p;
  const { id: _cid, ownerId: _co, notes: _cn, ...client } = c;
  void _pid; void _po; void _pl; void _pd; void _cid; void _co; void _cn;
  const ym = issue.slice(0, 7).replace("-", "/");
  return {
    id: `inv-${n}`,
    number: `INV/HMIF/${ym}/${String(n).padStart(4, "0")}`,
    ownerId,
    profileId,
    profile,
    clientId,
    client,
    title,
    issueDate: issue,
    dueDate: addDays(issue, dueDays),
    items,
    discountType: "percent",
    discountValue: 0,
    taxRate: p.defaultTaxRate,
    shipping: 0,
    notes: p.defaultNotes,
    terms: p.defaultTerms,
    status,
    payments: [],
    recurring: "none",
    adminNote: "",
    activity: [{ at: issue + "T09:00:00.000Z", by: "Sistem", text: "Invoice dibuat" }],
    createdAt: issue + "T09:00:00.000Z",
    updatedAt: issue + "T09:00:00.000Z",
    ...extra,
  };
}

export function seedDB(): DB {
  const invoices: Invoice[] = [
    inv(1, "u-budi", "p-budi", "c-1", "Sponsorship Arkavidia 10.0", -120, 30, "paid", [li("Paket Sponsor Gold", 1, "paket", 25000000), li("Booth Expo", 2, "hari", 2000000)], {
      payments: [{ id: "pay1", date: addDays(todayISO(), -100), amount: 32190000, method: "Transfer Bank", note: "Lunas" }],
    }),
    inv(2, "u-budi", "p-budi", "c-2", "Sponsorship Workshop UI/UX", -75, 30, "partial", [li("Paket Sponsor Silver", 1, "paket", 12500000)], {
      payments: [{ id: "pay2", date: addDays(todayISO(), -60), amount: 6000000, method: "Transfer Bank", note: "DP 50%" }],
    }),
    inv(3, "u-sari", "p-sari", "c-3", "Order Jaket Angkatan 2024", -40, 7, "sent", [li("Jaket Himpunan", 48, "pcs", 225000), li("Sticker Pack", 48, "pack", 25000)], {
      discountValue: 5,
    }),
    inv(4, "u-sari", "p-sari", "c-3", "Kaos Arkavidia Batch 2", -20, 7, "paid", [li("Kaos Arkavidia", 30, "pcs", 95000)], {
      shipping: 50000,
      payments: [{ id: "pay3", date: addDays(todayISO(), -15), amount: 2900000, method: "QRIS", note: "" }],
    }),
    inv(5, "u-admin", "p-admin", "c-4", "Peminjaman Sekretariat Bulan Ini", -10, 14, "sent", [li("Sewa Sekretariat", 4, "hari", 300000)], { recurring: "monthly" }),
    inv(6, "u-budi", "p-budi", "c-1", "Sponsorship Arkavidia 11.0", -2, 30, "pending", [li("Paket Sponsor Gold", 1, "paket", 25000000)], {
      activity: [
        { at: addDays(todayISO(), -2) + "T09:00:00.000Z", by: "Budi Santoso", text: "Invoice dibuat" },
        { at: addDays(todayISO(), -2) + "T09:05:00.000Z", by: "Budi Santoso", text: "Diajukan untuk approval" },
      ],
    }),
    inv(7, "u-sari", "p-sari", "c-3", "Pre-order Sticker", -1, 7, "draft", [li("Sticker Pack", 100, "pack", 25000)]),
    inv(8, "u-budi", "p-budi", "c-2", "Booth Job Fair", -150, 30, "paid", [li("Booth Expo", 3, "hari", 2000000)], {
      payments: [{ id: "pay4", date: addDays(todayISO(), -130), amount: 6660000, method: "Transfer Bank", note: "" }],
    }),
    inv(9, "u-sari", "p-sari", "c-3", "Merch Wisuda", -50, 7, "paid", [li("Kaos Arkavidia", 20, "pcs", 95000), li("Sticker Pack", 20, "pack", 25000)], {
      payments: [{ id: "pay5", date: addDays(todayISO(), -45), amount: 2400000, method: "QRIS", note: "" }],
    }),
  ];
  return {
    users,
    profiles,
    clients,
    catalog,
    invoices,
    settings: {
      orgName: "HMIF ITB",
      orgTagline: "Himpunan Mahasiswa Informatika, Institut Teknologi Bandung",
      orgAddress: "Gedung Labtek V, Jl. Ganesha No. 10, Bandung 40132",
      orgEmail: "keuangan@hmif.itb.ac.id",
      prefix: "INV/HMIF",
      nextNumber: 10,
      requireApproval: true,
      currency: "IDR",
    },
  };
}
