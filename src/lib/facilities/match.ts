// Deterministic feasibility + ranking. This is a filter and sort with fixed rules — NOT AI.
// Missing or stale data is never treated as availability.

import { FACILITIES, FACILITY_SERVICES, type Facility, type FacilityService, type HealthArea } from "./data";
import { TIME_CHIPS, type ConstraintId } from "./constraints";

/** Recently confirmed if updated within this many days (rosters typically change weekly). */
export const FRESH_DAYS = 7;
/** Older than this (or no date) is treated as unknown. */
export const STALE_LIMIT_DAYS = 30;

export type Availability = "confirmed" | "not_recent" | "unknown" | "unavailable";
export const AVAILABILITY_LABEL: Record<Availability, string> = {
  confirmed: "Confirmed available",
  not_recent: "Not recently confirmed",
  unknown: "Unknown — confirm with facility",
  unavailable: "Unavailable",
};
const GROUP_ORDER: Availability[] = ["confirmed", "not_recent", "unknown", "unavailable"];

export function ageDays(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(new Date().toISOString().slice(0, 10)).getTime() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}
export function updatedLabel(iso: string | null): string {
  const d = ageDays(iso);
  if (d === null) return "Update date unknown";
  return d === 0 ? "Updated today" : d === 1 ? "Updated yesterday" : `Updated ${d} days ago`;
}

export interface Match {
  facility: Facility;
  service: FacilityService;
  availability: Availability;
  timeMatch: boolean | null; // null = no time chip selected
  reasons: string[]; // "Why this option?" lines
}

function availabilityOf(s: FacilityService): Availability {
  if (s.equipmentStatus === "unavailable" || s.providerStatus === "unavailable" || s.acceptingReferrals === false) return "unavailable";
  const age = ageDays(s.lastUpdated);
  const allPositive =
    s.capability === "offered" &&
    (s.equipmentStatus === undefined || s.equipmentStatus === "available") &&
    s.providerStatus === "available" &&
    s.acceptingReferrals === true;
  if (!allPositive || age === null || age > STALE_LIMIT_DAYS) return "unknown";
  return age <= FRESH_DAYS ? "confirmed" : "not_recent";
}

function timeWanted(constraints: ConstraintId[]) {
  const chip = TIME_CHIPS.find((c) => constraints.includes(c.id));
  if (!chip) return null;
  const d = new Date();
  d.setDate(d.getDate() + chip.dayOffset);
  return { day: d.getDay(), session: chip.session, label: `${chip.dayOffset ? "tomorrow" : "today"} ${chip.session}` };
}

const COST_RANK = { none: 0, low: 1, moderate: 2, high: 3 } as const;
const costRank = (s: FacilityService) => (s.expectedPatientCost ? COST_RANK[s.expectedPatientCost] : 4);

export function findFacilities(area: HealthArea, serviceId: string, constraints: ConstraintId[]) {
  const want = timeWanted(constraints);
  const oneTrip = constraints.includes("one_trip");
  const shortTravel = constraints.includes("short_travel");

  const rows = FACILITIES.map((facility) => ({
    facility,
    service: FACILITY_SERVICES.find((s) => s.facilityId === facility.facilityId && s.healthArea === area && s.serviceId === serviceId)!,
  }));

  // 1. Hard filter: constraints can never lift a facility that does not offer the service.
  const notOffered = rows.filter((r) => r.service.capability === "not_offered").map((r) => r.facility);

  const matches: Match[] = rows
    .filter((r) => r.service.capability !== "not_offered")
    .map(({ facility, service: s }) => {
      const availability = availabilityOf(s);
      const timeMatch = want ? !!s.schedule?.some((x) => x.day === want.day && x.sessions.includes(want.session)) && s.providerStatus === "available" : null;
      const reasons: string[] = [];
      reasons.push(`Required service: ${s.capability === "offered" ? "offered" : "not confirmed"}`);
      if (s.equipmentStatus) reasons.push(`Equipment: ${s.equipmentStatus}`);
      reasons.push(`Trained provider: ${s.providerStatus ?? "unknown"}${want && timeMatch ? ` ${want.label}` : ""}`);
      if (want && !timeMatch) reasons.push(`No confirmed session ${want.label}`);
      reasons.push(`Accepting referrals: ${s.acceptingReferrals === true ? "yes" : s.acceptingReferrals === false ? "no" : "unknown"}`);
      if (s.appointmentRequired) reasons.push("Appointment required");
      reasons.push(updatedLabel(s.lastUpdated));
      return { facility, service: s, availability, timeMatch, reasons };
    });

  // 2–5. Group, then worker-confirmed constraint rules, then stable tie-breakers.
  matches.sort((a, b) => {
    const g = GROUP_ORDER.indexOf(a.availability) - GROUP_ORDER.indexOf(b.availability);
    if (g) return g;
    if (want && a.timeMatch !== b.timeMatch) return a.timeMatch ? -1 : 1;
    if (oneTrip) {
      const ap = (a.service.appointmentRequired ? 1 : 0) - (b.service.appointmentRequired ? 1 : 0);
      if (ap) return ap;
      const c = costRank(a.service) - costRank(b.service);
      if (c) return c;
    }
    if (shortTravel && a.facility.travelTimeMin !== b.facility.travelTimeMin) return a.facility.travelTimeMin - b.facility.travelTimeMin;
    return a.facility.distanceKm - b.facility.distanceKm || a.facility.facilityId.localeCompare(b.facility.facilityId);
  });

  return { matches, notOffered, timeLabel: want?.label ?? null };
}

/** "Why not the closer facility?" — first fixed rule where the closer option differs. */
export function whyNotCloser(top: Match, all: Match[], timeLabel: string | null, constraints: ConstraintId[]): string | null {
  const closer = all.filter((m) => m.facility.distanceKm < top.facility.distanceKm).sort((a, b) => a.facility.distanceKm - b.facility.distanceKm)[0];
  if (!closer) return null;
  const name = `${closer.facility.name} (${closer.facility.distanceKm} km)`;
  if (closer.availability !== top.availability) {
    const why =
      closer.availability === "unavailable" ? "it is currently marked unavailable"
      : closer.availability === "not_recent" ? `its availability is not recently confirmed (${updatedLabel(closer.service.lastUpdated).toLowerCase()})`
      : "its availability is unknown — confirm with the facility";
    return `${name} is closer, but ${why}.`;
  }
  if (timeLabel && closer.timeMatch !== top.timeMatch) return `${name} is closer, but has no confirmed provider session ${timeLabel}.`;
  if (constraints.includes("one_trip") && closer.service.appointmentRequired && !top.service.appointmentRequired) return `${name} is closer, but needs an appointment, which may mean an extra trip.`;
  if (constraints.includes("one_trip")) return `${name} is closer, but its expected patient cost is higher.`;
  return null;
}
