// SMS follow-up logic. Message generation and reply parsing are real; TRANSPORT IS SIMULATED.
// Messages deliberately omit facility, diagnosis, barriers and any clinical detail (shared-phone privacy).

/** Privacy-safe Hindi reminder. Only the referral code is included. */
export function buildReminderSms(referralCode: string): string {
  return `आपके रेफरल का कोड ${referralCode} है। बताए गए केंद्र पर जाने के बाद 1 लिखकर जवाब दें।`;
}

export type ParsedReply = { kind: "patient_reported_arrival" } | { kind: "unrecognised" };

const DIGITS: Record<string, string> = { "१": "1" }; // Devanagari digit one

/** Deterministic parser. Supported: "1" = reached the referred facility. No AI. */
export function parseSmsReply(raw: string): ParsedReply {
  const t = raw.trim().replace(/[१]/g, (d) => DIGITS[d] ?? d).replace(/[.!\s]+$/g, "");
  return t === "1" ? { kind: "patient_reported_arrival" } : { kind: "unrecognised" };
}

export const UNRECOGNISED_REPLY =
  "Reply not recognised. This prototype currently supports 1 = reached referral facility.";
