import type { PatientBarrierCode } from "./types";
// Voice/IVR follow-up logic. Keypad parsing is real; TELEPHONY IS SIMULATED.
// The script avoids diagnosis, disease, results, treatment and barriers (shared-phone privacy).

export const IVR_SCRIPT_HI =
  "नमस्ते। यह आपके रेफरल के बारे में एक संदेश है। अगर आप बताए गए केंद्र पर जा चुकी हैं, तो 1 दबाएँ।";

export type ParsedKey = { kind: "patient_reported_arrival" } | { kind: "unrecognised" };

/** Deterministic DTMF-style parser. Supported: "1" (or "१") = reached the referred facility. */
export function parseIvrKey(key: string): ParsedKey {
  const k = key.trim().replace("१", "1");
  return k === "1" ? { kind: "patient_reported_arrival" } : { kind: "unrecognised" };
}

// Extended simulated menu. "1" handling above is unchanged.
export const IVR_SCRIPT_HI_NOT_REACHED = "अगर आप अभी तक नहीं जा पाई हैं, तो 2 दबाएँ।";
export const IVR_BARRIER_PROMPT_HI =
  "कारण बताएँ: यात्रा या खर्च के लिए 1, परिवार या साथ जाने वाले के लिए 2, काम या देखभाल के लिए 3, कहाँ या कब जाना है पता नहीं तो 4, अन्य के लिए 5 दबाएँ।";

export const IVR_BARRIER_MENU: { key: string; code: PatientBarrierCode; en: string; hi: string }[] = [
  { key: "1", code: "travel_cost", en: "Travel / cost", hi: "यात्रा / खर्च" },
  { key: "2", code: "family_accompaniment", en: "Family / accompaniment", hi: "परिवार / साथ जाने वाला" },
  { key: "3", code: "work_caregiving", en: "Work / caregiving", hi: "काम / देखभाल" },
  { key: "4", code: "unsure_where_when", en: "Unsure where/when to go", hi: "कहाँ/कब जाना है पता नहीं" },
  { key: "5", code: "other", en: "Other", hi: "अन्य" },
];
export const patientBarrierLabel = (c: PatientBarrierCode, lang: "en" | "hi" = "en") =>
  IVR_BARRIER_MENU.find((m) => m.code === c)?.[lang] ?? c;

/** "2" = have not reached the facility (opens the barrier menu). */
export const isNotReachedKey = (key: string) => key.trim().replace("२", "2") === "2";
/** Barrier menu: keys 1–5 → operational barrier code; anything else → null. Not clinical triage. */
export function parseIvrBarrierKey(key: string): PatientBarrierCode | null {
  const k = key.trim().replace(/[१२३४५]/, (d) => String("१२३४५".indexOf(d) + 1));
  return IVR_BARRIER_MENU.find((m) => m.key === k)?.code ?? null;
}
