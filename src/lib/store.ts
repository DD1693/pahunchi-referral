// Local-only referral store backed by IndexedDB. No backend, no network.
import { useEffect, useSyncExternalStore } from "react";
import type { IDBPDatabase } from "idb";
import type { HistoryEvent, Referral } from "./types";
import { addDays, todayISO } from "./followup";

interface State {
  loaded: boolean;
  referrals: Referral[];
  error: string | null;
}
const INITIAL: State = { loaded: false, referrals: [], error: null };
let state: State = INITIAL;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let dbPromise: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbPromise) {
    dbPromise = import("idb").then(({ openDB }) =>
      openDB("pahunchi", 1, {
        upgrade(d) {
          d.createObjectStore("referrals", { keyPath: "id" });
          d.createObjectStore("meta");
        },
      }),
    );
  }
  return dbPromise;
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function demoRecords(): Referral[] {
  const t = todayISO();
  const now = new Date().toISOString();
  const ev = (type: HistoryEvent["type"], detail?: string): HistoryEvent =>
    detail ? { type, at: now, detail } : { type, at: now };
  const base = {
    context: "",
    noBarrierConfirmed: false,
    syncState: "synced" as const,
    isDemo: true,
    createdAt: now,
    updatedAt: now,
  };
  return [
    {
      ...base,
      id: "demo-001",
      patientId: "CG-DEMO-001",
      referralDate: addDays(t, -10),
      destination: "District Hospital",
      department: "Outpatient department",
      followUpDate: addDays(t, -3),
      notes: [{ text: "अस्पताल बहुत दूर है और बस का किराया नहीं है। पति काम पर जाते हैं।", at: now }],
      confirmedBarriers: ["access_cost", "work_caregiving"],
      outcome: "open",
      syncState: "pending",
      history: [ev("created"), ev("barrier_review", "Demo — human-confirmed")],
    },
    {
      ...base,
      id: "demo-002",
      patientId: "CG-DEMO-002",
      referralDate: addDays(t, -2),
      destination: "Community Health Centre",
      department: "Women's health clinic",
      followUpDate: addDays(t, 4),
      notes: [{ text: "Unko samajh nahi aaya ki kahan jaana hai aur kis din.", at: now }],
      confirmedBarriers: ["understanding_information"],
      outcome: "open",
      history: [ev("created"), ev("barrier_review", "Demo — human-confirmed")],
    },
    {
      ...base,
      id: "demo-003",
      patientId: "CG-DEMO-003",
      referralDate: addDays(t, -14),
      destination: "Referral Clinic",
      department: "Specialist clinic",
      followUpDate: addDays(t, -6),
      notes: [{ text: "Saas se poochna padega, ghar par bachche akele hain.", at: now }],
      confirmedBarriers: ["household_constraint"],
      outcome: "completed",
      history: [ev("created"), ev("barrier_review", "Demo — human-confirmed"), ev("completed")],
    },
  ];
}

async function seedOnce(d: IDBPDatabase) {
  const seeded = await d.get("meta", "demoSeeded");
  if (seeded) return;
  const tx = d.transaction(["referrals", "meta"], "readwrite");
  for (const r of demoRecords()) await tx.objectStore("referrals").put(r);
  await tx.objectStore("meta").put(true, "demoSeeded");
  await tx.done;
}

// Referral codes: "PH-" + 4 chars from an unambiguous alphabet (no 0/O, 1/I/L).
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function randomCode(): string {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256);
  return "PH-" + Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}
/** Unique among codes already on this device; retries on collision. */
export function newReferralCode(taken: Set<string>): string {
  let c = randomCode();
  while (taken.has(c)) c = randomCode();
  taken.add(c);
  return c;
}
export const normaliseCode = (s: string) => {
  const t = s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return t.startsWith("PH") ? `PH-${t.slice(2)}` : `PH-${t}`;
};

async function reload() {
  const d = await db();
  const all = (await d.getAll("referrals")) as Referral[];
  // Backfill codes for older/demo records, in place, without touching other fields.
  const taken = new Set(all.map((r) => r.referralCode).filter(Boolean) as string[]);
  const missing = all.filter((r) => !r.referralCode);
  if (missing.length) {
    const tx = d.transaction("referrals", "readwrite");
    for (const r of missing) {
      r.referralCode = newReferralCode(taken);
      await tx.store.put(r);
    }
    await tx.done;
  }
  all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  state = { loaded: true, referrals: all, error: null };
  emit();
}

export async function findByCode(code: string): Promise<Referral | undefined> {
  const d = await db();
  const target = normaliseCode(code);
  const all = (await d.getAll("referrals")) as Referral[];
  return all.find((r) => r.referralCode === target);
}

let started = false;
function init() {
  if (started) return;
  started = true;
  db()
    .then(async (d) => {
      await seedOnce(d);
      await reload();
    })
    .catch((e) => {
      console.error(e);
      state = { loaded: true, referrals: [], error: "Local storage is unavailable on this device/browser." };
      emit();
    });
}

export function useReferrals(): State {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => INITIAL,
  );
  useEffect(init, []);
  return s;
}

export async function saveReferral(r: Referral) {
  const d = await db();
  if (!r.referralCode) {
    const all = (await d.getAll("referrals")) as Referral[];
    r = { ...r, referralCode: newReferralCode(new Set(all.map((x) => x.referralCode).filter(Boolean) as string[])) };
  }
  await d.put("referrals", r);
  await reload();
  return r;
}

/** Records a facility-verified arrival. Does not change outcome/priority. */
export async function confirmFacilityArrival(r: Referral) {
  const at = new Date().toISOString();
  const code = r.referralCode!;
  await updateReferral(
    r,
    { arrivals: [...(r.arrivals ?? []), { type: "facility_verified_arrival", referralCode: code, at }] },
    { type: "facility_verified_arrival", at, detail: code },
  );
}

/** Apply a change, append history, and mark as waiting to sync. */
export async function updateReferral(r: Referral, change: Partial<Referral>, event: HistoryEvent) {
  await saveReferral({
    ...r,
    ...change,
    syncState: event.type === "synced" ? "synced" : "pending",
    history: [...r.history, event],
    updatedAt: event.at,
  });
}

/** Records a SIMULATED reminder SMS. Nothing is sent anywhere. */
export async function recordSimulatedReminder(r: Referral, body: string) {
  const at = new Date().toISOString();
  await updateReferral(
    r,
    { smsEvents: [...(r.smsEvents ?? []), { direction: "outbound_reminder", body, at, simulated: true }] },
    { type: "sms_reminder_simulated", at, detail: "Simulated — no SMS was sent" },
  );
}

/** Records a SIMULATED patient reply after deterministic parsing; only "1" adds a patient-reported arrival. */
export async function recordSimulatedReply(r: Referral, body: string, parsed: "patient_reported_arrival" | "unrecognised") {
  const at = new Date().toISOString();
  const smsEvents = [...(r.smsEvents ?? []), { direction: "inbound_reply" as const, body, at, simulated: true as const, parsed }];
  if (parsed === "unrecognised") {
    await updateReferral(r, { smsEvents }, { type: "sms_reply_simulated", at, detail: "Not recognised — no status change" });
    return;
  }
  const withReply = { ...r, smsEvents, history: [...r.history, { type: "sms_reply_simulated" as const, at, detail: `Reply "${body.trim()}"` }] };
  await updateReferral(
    withReply,
    { arrivals: [...(r.arrivals ?? []), { type: "patient_reported_arrival", referralCode: r.referralCode!, at }] },
    { type: "patient_reported_arrival", at, detail: r.referralCode! },
  );
}
