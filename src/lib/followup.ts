import type { Referral } from "./types";

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export const todayISO = () => toISODate(new Date());
function parse(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(iso: string, n: number): string {
  const dt = parse(iso);
  dt.setDate(dt.getDate() + n);
  return toISODate(dt);
}

export type Timing = "overdue" | "due_today" | "upcoming" | "closed";

/** Computed every render from dates — never persisted. */
export function timing(r: Referral, today = todayISO()): Timing {
  if (r.outcome === "completed") return "closed";
  if (r.followUpDate < today) return "overdue";
  if (r.followUpDate === today) return "due_today";
  return "upcoming";
}

export type DisplayStatus =
  | "Referred"
  | "Follow-up due"
  | "Not completed"
  | "Completed"
  | "Patient reports arrival"
  | "Arrival verified";

/** Arrival loop state from arrival events. Facility verification takes precedence; events are never removed. */
export type ArrivalState = "none" | "patient_reported" | "verified";
export function arrivalState(r: Referral): ArrivalState {
  const a = r.arrivals ?? [];
  if (a.some((x) => x.type === "facility_verified_arrival")) return "verified";
  if (a.some((x) => x.type === "patient_reported_arrival")) return "patient_reported";
  return "none";
}

export function displayStatus(r: Referral, today = todayISO()): DisplayStatus {
  if (r.outcome === "completed") return "Completed";
  const as = arrivalState(r);
  if (as === "verified") return "Arrival verified";
  if (as === "patient_reported") return "Patient reports arrival";
  if (r.outcome === "not_completed") return "Not completed";
  return r.followUpDate <= today ? "Follow-up due" : "Referred";
}

/** Arrival information replaces the date-based arrival follow-up task. */
const awaitingArrival = (r: Referral) => r.outcome !== "completed" && arrivalState(r) === "none";
export const needsFollowUp = (r: Referral, t = todayISO()) =>
  awaitingArrival(r) && r.followUpDate <= t;
export const dueSoon = (r: Referral, t = todayISO()) =>
  awaitingArrival(r) && r.followUpDate > t && r.followUpDate <= addDays(t, 3);

const RANK: Record<Timing, number> = { overdue: 0, due_today: 1, upcoming: 2, closed: 3 };

/** Follow-up priority: overdue → due today → upcoming, then earliest date, then more confirmed barriers. */
export function followUpQueue(rs: Referral[]): Referral[] {
  const t = todayISO();
  return rs
    .filter((r) => r.outcome !== "completed" && arrivalState(r) !== "verified")
    .sort(
      (a, b) =>
        RANK[timing(a, t)] - RANK[timing(b, t)] ||
        a.followUpDate.localeCompare(b.followUpDate) ||
        b.confirmedBarriers.length - a.confirmedBarriers.length,
    );
}

export function formatDate(iso: string): string {
  return parse(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
export function formatStamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function timingLabel(r: Referral): string {
  const as = arrivalState(r);
  if (r.outcome !== "completed" && as === "verified") return "Arrival verified";
  if (r.outcome !== "completed" && as === "patient_reported") return "Patient reports arrival";
  const t = todayISO();
  const tm = timing(r, t);
  if (tm === "closed") return "Closed";
  if (tm === "due_today") return "Due today";
  const diff = Math.round((parse(r.followUpDate).getTime() - parse(t).getTime()) / 86400000);
  return tm === "overdue" ? `Overdue ${-diff}d` : `In ${diff}d`;
}
