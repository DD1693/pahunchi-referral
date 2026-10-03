// ILLUSTRATIVE SYNTHETIC FACILITY DATA — not real hospitals, not live availability.
// Bundled with the app so the finder works fully offline. The service catalogue is
// illustrative prototype capabilities only — it is NOT a clinical referral protocol.

export const DATA_LABEL = "Illustrative synthetic facility data";

export type HealthArea = "cervical" | "breast" | "maternal" | "reproductive";
export type Status = "available" | "unavailable" | "unknown";
export type Session = "morning" | "afternoon";
export type Cost = "none" | "low" | "moderate" | "high";

export const HEALTH_AREAS: { id: HealthArea; label: string }[] = [
  { id: "cervical", label: "Cervical health" },
  { id: "breast", label: "Breast health" },
  { id: "maternal", label: "Maternal health" },
  { id: "reproductive", label: "Reproductive health" },
];

export const SERVICE_CATALOGUE: Record<HealthArea, { id: string; label: string }[]> = {
  cervical: [
    { id: "hpv_via", label: "HPV / VIA screening" },
    { id: "colposcopy", label: "Colposcopy" },
    { id: "thermal_ablation", label: "Thermal ablation" },
    { id: "cervical_biopsy", label: "Cervical biopsy" },
    { id: "pathology", label: "Pathology" },
    { id: "cervical_specialist", label: "Specialist assessment" },
  ],
  breast: [
    { id: "cbe", label: "Clinical breast examination" },
    { id: "breast_us", label: "Breast ultrasound" },
    { id: "mammography", label: "Mammography" },
    { id: "breast_biopsy", label: "Breast biopsy" },
    { id: "breast_specialist", label: "Specialist assessment" },
  ],
  maternal: [
    { id: "hr_anc", label: "High-risk antenatal assessment" },
    { id: "emoc", label: "Emergency obstetric care" },
    { id: "obs_us", label: "Obstetric ultrasound" },
    { id: "maternal_specialist", label: "Specialist assessment" },
  ],
  reproductive: [
    { id: "family_planning", label: "Family planning services" },
    { id: "gynae", label: "Gynaecology assessment" },
    { id: "repro_specialist", label: "Specialist assessment" },
  ],
};

export type FacilityTypeId = "sub_centre" | "phc" | "chc" | "district" | "tertiary" | "specialist" | "referral_clinic" | "other";
/** Illustrative facility categories. Context only — never a substitute for service availability. */
export const FACILITY_TYPES: { id: FacilityTypeId; en: string; hi: string }[] = [
  { id: "sub_centre", en: "Sub-centre / Health & Wellness Centre", hi: "उप-केंद्र / स्वास्थ्य एवं आरोग्य केंद्र" },
  { id: "phc", en: "PHC / Primary Health Centre", hi: "प्राथमिक स्वास्थ्य केंद्र (PHC)" },
  { id: "chc", en: "CHC / Community Health Centre", hi: "सामुदायिक स्वास्थ्य केंद्र (CHC)" },
  { id: "district", en: "District Hospital", hi: "ज़िला अस्पताल" },
  { id: "tertiary", en: "Medical College / Tertiary Hospital", hi: "मेडिकल कॉलेज / तृतीयक अस्पताल" },
  { id: "specialist", en: "Specialist Centre", hi: "विशेषज्ञ केंद्र" },
  { id: "referral_clinic", en: "Referral Clinic", hi: "रेफरल क्लिनिक" },
  { id: "other", en: "Other", hi: "अन्य" },
];
export const facilityTypeLabel = (id: string | undefined, lang: "en" | "hi" = "en") => {
  const t = FACILITY_TYPES.find((x) => x.id === id);
  return t ? t[lang] : "";
};

export interface Facility {
  facilityId: string;
  name: string;
  level: string;
  distanceKm: number;
  travelTimeMin: number;
  transportNote: string;
  dataSource: string;
  /** Facility category id (contextual only — never used for ranking). */
  facilityType: FacilityTypeId;
  address: string;
  /** Placeholder contact in synthetic data. */
  contact: string;
}

export interface FacilityService {
  facilityId: string;
  healthArea: HealthArea;
  serviceId: string;
  capability: "offered" | "not_offered" | "unknown";
  /** Omitted when equipment is not relevant for the service. */
  equipmentStatus?: Status;
  providerStatus?: Status;
  /** Weekly sessions; days 0 = Sunday … 6 = Saturday. */
  schedule?: { day: number; sessions: Session[] }[];
  acceptingReferrals?: boolean | null;
  appointmentRequired?: boolean | null;
  expectedPatientCost?: Cost | null;
  lastUpdated: string | null; // ISO date
  sourceNote: string;
  /** Reserved: raw operational update text for a future facility-update Small AI. Not used yet. */
  rawUpdate?: string;
}

export const FACILITIES: Facility[] = [
  { facilityId: "A", name: "Illustrative Community Health Centre A", level: "Community Health Centre", facilityType: "chc", address: "Block market road, Illustrative Block A", contact: "XXXXXXXXXX", distanceKm: 4, travelTimeMin: 20, transportNote: "Shared auto from the block market", dataSource: DATA_LABEL },
  { facilityId: "B", name: "Illustrative District Hospital B", level: "District Hospital", facilityType: "district", address: "Station road, Illustrative District B", contact: "XXXXXXXXXX", distanceKm: 14, travelTimeMin: 45, transportNote: "Direct bus, morning and evening", dataSource: DATA_LABEL },
  { facilityId: "C", name: "Illustrative Specialist Centre C", level: "Women's / specialist centre", facilityType: "specialist", address: "Civil lines, Illustrative Town C", contact: "XXXXXXXXXX", distanceKm: 22, travelTimeMin: 70, transportNote: "Bus with one change", dataSource: DATA_LABEL },
  { facilityId: "D", name: "Illustrative Medical College Hospital D", level: "Medical College Hospital", facilityType: "tertiary", address: "College campus, Illustrative City D", contact: "XXXXXXXXXX", distanceKm: 45, travelTimeMin: 110, transportNote: "Bus to city, then auto", dataSource: DATA_LABEL },
  { facilityId: "E", name: "Illustrative Tertiary Specialist Centre E", level: "Regional specialist centre", facilityType: "specialist", address: "Ring road, Illustrative Region E", contact: "XXXXXXXXXX", distanceKm: 80, travelTimeMin: 180, transportNote: "Long-distance bus", dataSource: DATA_LABEL },
];

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const every = (sessions: Session[]) => ALL_DAYS.map((day) => ({ day, sessions }));

type Profile = Omit<FacilityService, "facilityId" | "healthArea" | "serviceId" | "sourceNote">;

// Per-facility "typical" profile (dates relative to today so freshness always shows).
const TYPICAL: Record<string, Profile> = {
  A: { capability: "offered", providerStatus: "available", acceptingReferrals: true, appointmentRequired: false, expectedPatientCost: "none", lastUpdated: daysAgo(20) },
  B: { capability: "offered", providerStatus: "available", schedule: every(["morning"]), acceptingReferrals: true, appointmentRequired: false, expectedPatientCost: "low", lastUpdated: daysAgo(0) },
  C: { capability: "offered", providerStatus: "available", schedule: every(["morning", "afternoon"]), acceptingReferrals: true, appointmentRequired: false, expectedPatientCost: "low", lastUpdated: daysAgo(2) },
  D: { capability: "offered", providerStatus: "available", schedule: every(["afternoon"]), acceptingReferrals: true, appointmentRequired: true, expectedPatientCost: "moderate", lastUpdated: daysAgo(3) },
  E: { capability: "offered", providerStatus: "available", schedule: every(["morning", "afternoon"]), acceptingReferrals: false, appointmentRequired: true, expectedPatientCost: "high", lastUpdated: daysAgo(1) },
};

// Services a CHC does not offer in this synthetic dataset.
const CHC_NOT_OFFERED = new Set(["colposcopy", "cervical_biopsy", "pathology", "cervical_specialist", "breast_us", "mammography", "breast_biopsy", "breast_specialist", "emoc", "obs_us", "maternal_specialist", "repro_specialist"]);
const EQUIPMENT_SERVICES = new Set(["thermal_ablation", "colposcopy", "breast_us", "mammography", "obs_us", "pathology"]);

// Hand-set overrides so each availability state is visible.
const OVERRIDES: Record<string, Partial<Profile>> = {
  "C:thermal_ablation": { equipmentStatus: "unavailable", lastUpdated: daysAgo(2) },
  "B:mammography": { capability: "not_offered" },
  "A:hpv_via": { lastUpdated: daysAgo(3), schedule: every(["morning"]) },
  "B:obs_us": { equipmentStatus: "unknown", lastUpdated: daysAgo(40) },
  "A:family_planning": { lastUpdated: daysAgo(1), schedule: every(["morning", "afternoon"]) },
};

export const FACILITY_SERVICES: FacilityService[] = FACILITIES.flatMap((f) =>
  (Object.keys(SERVICE_CATALOGUE) as HealthArea[]).flatMap((area) =>
    SERVICE_CATALOGUE[area].map((s) => {
      const base: Profile = { ...TYPICAL[f.facilityId]! };
      if (EQUIPMENT_SERVICES.has(s.id)) base.equipmentStatus = "available";
      if (f.facilityId === "A" && CHC_NOT_OFFERED.has(s.id)) base.capability = "not_offered";
      return { facilityId: f.facilityId, healthArea: area, serviceId: s.id, sourceNote: DATA_LABEL, ...base, ...OVERRIDES[`${f.facilityId}:${s.id}`] };
    }),
  ),
);

export const serviceLabel = (area: HealthArea, id: string) => SERVICE_CATALOGUE[area].find((s) => s.id === id)?.label ?? id;
export const areaLabel = (area: HealthArea) => HEALTH_AREAS.find((a) => a.id === area)?.label ?? area;

export const SERVICE_HI: Record<string, string> = {
  hpv_via: "HPV / VIA जाँच", colposcopy: "कॉल्पोस्कोपी", thermal_ablation: "थर्मल एब्लेशन", cervical_biopsy: "सर्वाइकल बायोप्सी",
  pathology: "पैथोलॉजी", cervical_specialist: "विशेषज्ञ परामर्श", cbe: "क्लिनिकल स्तन जाँच", breast_us: "स्तन अल्ट्रासाउंड",
  mammography: "मैमोग्राफ़ी", breast_biopsy: "स्तन बायोप्सी", breast_specialist: "विशेषज्ञ परामर्श", hr_anc: "उच्च-जोखिम प्रसवपूर्व जाँच",
  emoc: "आपातकालीन प्रसूति सेवा", obs_us: "प्रसूति अल्ट्रासाउंड", maternal_specialist: "विशेषज्ञ परामर्श",
  family_planning: "परिवार नियोजन सेवाएँ", gynae: "स्त्री रोग परामर्श", repro_specialist: "विशेषज्ञ परामर्श",
};
/** "Thermal ablation / थर्मल एब्लेशन" */
export const serviceBilingual = (area: HealthArea, id: string) => {
  const hi = SERVICE_HI[id];
  return hi ? `${serviceLabel(area, id)} / ${hi}` : serviceLabel(area, id);
};
export const facilityById = (id: string) => FACILITIES.find((f) => f.facilityId === id);
export const facilityService = (facilityId: string, area: HealthArea, serviceId: string) =>
  FACILITY_SERVICES.find((s) => s.facilityId === facilityId && s.healthArea === area && s.serviceId === serviceId);

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Human-readable schedule, e.g. "Daily, morning (9am–1pm)". */
export function scheduleSummary(svc: FacilityService | undefined): string {
  if (!svc?.schedule?.length) return "Contact facility for days/times";
  const sess = (ss: Session[]) => ss.map((x) => (x === "morning" ? "morning (9am–1pm)" : "afternoon (2pm–5pm)")).join(" & ");
  const first = svc.schedule[0]!;
  const same = svc.schedule.every((d) => d.sessions.join() === first.sessions.join());
  if (same && svc.schedule.length === 7) return `Daily, ${sess(first.sessions)}`;
  return svc.schedule.map((d) => `${DAY[d.day]} ${sess(d.sessions)}`).join("; ");
}
export const appointmentText = (svc: FacilityService | undefined) =>
  svc?.appointmentRequired === true ? "Required" : svc?.appointmentRequired === false ? "Not required" : "Contact facility";
