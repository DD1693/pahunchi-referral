export type BarrierLabel =
  | "access_cost"
  | "household_constraint"
  | "fear_hesitancy"
  | "work_caregiving"
  | "understanding_information";

export const BARRIERS: { label: BarrierLabel; en: string; hi: string }[] = [
  { label: "access_cost", en: "Access & cost", hi: "पहुंच और खर्च" },
  { label: "household_constraint", en: "Household constraint", hi: "परिवार से जुड़ी बाधा" },
  { label: "fear_hesitancy", en: "Fear or hesitancy", hi: "डर या झिझक" },
  { label: "work_caregiving", en: "Work or caregiving", hi: "काम या देखभाल की जिम्मेदारी" },
  { label: "understanding_information", en: "Information or understanding", hi: "जानकारी या समझ" },
];

export const barrierMeta = (l: BarrierLabel) => BARRIERS.find((b) => b.label === l)!;

export type Outcome = "open" | "not_completed" | "completed";

export type HistoryType =
  | "created"
  | "barrier_review"
  | "attempted"
  | "rescheduled"
  | "not_completed"
  | "completed"
  | "synced"
  | "action_planned"
  | "sms_reminder_simulated"
  | "sms_reply_simulated"
  | "ivr_call_simulated"
  | "ivr_keypress_simulated"
  | "facility_selected"
  | ArrivalType;

/** Worker's choice from the facility finder (illustrative synthetic data). Optional; destination stays a string. */
export interface FacilityRef {
  facilityId: string;
  healthArea: import("./facilities/data").HealthArea;
  serviceId: string;
  constraints: import("./facilities/constraints").ConstraintId[];
  matchedAt: string;
}

/** One step of a SIMULATED IVR call (no telephony). */
export interface IvrEvent {
  callId: string;
  kind: "call_started" | "keypress";
  key?: string;
  parsed?: "patient_reported_arrival" | "unrecognised" | "duplicate";
  at: string;
  simulated: true;
}

/** One SMS in the follow-up thread. `simulated` is always true in this prototype (no transport). */
export interface SmsEvent {
  direction: "outbound_reminder" | "inbound_reply";
  body: string;
  at: string;
  simulated: true;
  /** For inbound replies: result of the deterministic parser. */
  parsed?: "patient_reported_arrival" | "unrecognised";
}

/** Arrival confirmations are independent and non-exclusive; both may exist for one referral. */
export type ArrivalType = "patient_reported_arrival" | "facility_verified_arrival" | "worker_confirmed_arrival";

/** Operational outcome of a referral leg. Never clinical. */
export type ReferralOutcome = "service_completed" | "refer_onward" | "service_unavailable" | "other";

/** Barrier the PATIENT reported through the simulated IVR menu (operational, not triage). */
export type PatientBarrierCode = "travel_cost" | "family_accompaniment" | "work_caregiving" | "unsure_where_when" | "other";
export interface PatientReportedBarrier {
  code: PatientBarrierCode;
  source: "ivr";
  at: string;
}

export interface ArrivalEvent {
  type: ArrivalType;
  referralCode: string;
  at: string; // ISO timestamp
  /** Channel for patient-reported arrivals (older records: SMS). */
  source?: "sms" | "ivr";
}

export interface HistoryEvent {
  type: HistoryType;
  at: string; // ISO timestamp
  detail?: string;
}

export interface PlannedAction {
  barrier: BarrierLabel;
  action: string; // fixed prompt text chosen by the health worker
  at: string;
}

export interface WorkerNote {
  text: string;
  at: string;
}

export interface Referral {
  id: string;
  patientId: string;
  /** Short portable code (e.g. PH-7F3K). No personal or clinical info. Backfilled for older records. */
  referralCode?: string;
  /** Arrival confirmations (patient-reported and/or facility-verified). Optional for older records. */
  arrivals?: ArrivalEvent[];
  /** SMS follow-up thread (supports many reminders/replies later). Optional for older records. */
  smsEvents?: SmsEvent[];
  /** Simulated Voice/IVR follow-up steps. Optional for older records. */
  ivrEvents?: IvrEvent[];
  /** Set only when the worker chose a destination via the facility finder. */
  facilityRef?: FacilityRef;
  referralDate: string; // YYYY-MM-DD
  destination: string;
  department: string;
  followUpDate: string; // YYYY-MM-DD
  context: string;
  notes: WorkerNote[];
  /** Human-confirmed barriers only. Never raw AI output. */
  confirmedBarriers: BarrierLabel[];
  noBarrierConfirmed: boolean;
  /** Fixed follow-up prompts chosen by the worker. Optional for older records. */
  plannedActions?: PlannedAction[];
  outcome: Outcome;
  syncState: "synced" | "pending";
  isDemo: boolean;
  history: HistoryEvent[];
  createdAt: string;
  updatedAt: string;
}
