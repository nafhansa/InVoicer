export type Role = "admin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  division: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

/** Saved sender identity, reused on every invoice so users never retype it. */
export interface BillingProfile {
  id: string;
  ownerId: string;
  label: string;
  isDefault: boolean;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  address: string;
  npwp: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  defaultTaxRate: number;
  defaultDueDays: number;
  defaultNotes: string;
  defaultTerms: string;
  signatureName: string;
  signatureTitle: string;
}

export interface Client {
  id: string;
  ownerId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export interface CatalogItem {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  unit: string;
  unitPrice: number;
}

export interface LineItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  note: string;
}

export interface Activity {
  at: string;
  by: string;
  text: string;
}

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "rejected"
  | "sent"
  | "partial"
  | "paid"
  | "void";

export type DisplayStatus = InvoiceStatus | "overdue";

export type RecurringInterval = "none" | "weekly" | "monthly" | "quarterly";

export interface Invoice {
  id: string;
  number: string;
  ownerId: string;
  profileId: string;
  profile: Omit<BillingProfile, "id" | "ownerId" | "label" | "isDefault">;
  clientId: string;
  client: Omit<Client, "id" | "ownerId" | "notes">;
  title: string;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  discountType: "percent" | "fixed";
  discountValue: number;
  taxRate: number;
  shipping: number;
  notes: string;
  terms: string;
  status: InvoiceStatus;
  payments: Payment[];
  recurring: RecurringInterval;
  adminNote: string;
  activity: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface OrgSettings {
  orgName: string;
  orgTagline: string;
  orgAddress: string;
  orgEmail: string;
  prefix: string;
  nextNumber: number;
  requireApproval: boolean;
  currency: string;
}

export interface DB {
  users: User[];
  profiles: BillingProfile[];
  clients: Client[];
  catalog: CatalogItem[];
  invoices: Invoice[];
  settings: OrgSettings;
}
