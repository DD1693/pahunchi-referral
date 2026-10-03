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
