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

async function reload() {
  const d = await db();
  const all = (await d.getAll("referrals")) as Referral[];
  all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  state = { loaded: true, referrals: all, error: null };
  emit();
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
  await d.put("referrals", r);
  await reload();
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
