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
  | "action_planned";

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
