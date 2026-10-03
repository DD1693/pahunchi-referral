// Practical (non-clinical) constraints. Worker-selected chips are the only input to ranking.
// The keyword helper is deterministic text matching — NOT AI — and only pre-highlights chips
// as "Suggested — please confirm". The barrier classifier is deliberately not used here.

import type { Session } from "./data";

export type ConstraintId = "time_today_morning" | "time_today_afternoon" | "time_tomorrow_morning" | "time_tomorrow_afternoon" | "one_trip" | "short_travel" | "accompaniment";

export const TIME_CHIPS: { id: ConstraintId; label: string; dayOffset: 0 | 1; session: Session }[] = [
  { id: "time_today_morning", label: "Can travel today morning", dayOffset: 0, session: "morning" },
  { id: "time_today_afternoon", label: "Can travel today afternoon", dayOffset: 0, session: "afternoon" },
  { id: "time_tomorrow_morning", label: "Can travel tomorrow morning", dayOffset: 1, session: "morning" },
  { id: "time_tomorrow_afternoon", label: "Can travel tomorrow afternoon", dayOffset: 1, session: "afternoon" },
];

export const OTHER_CHIPS: { id: ConstraintId; label: string }[] = [
  { id: "one_trip", label: "Cannot afford repeated trips" },
  { id: "short_travel", label: "Long travel is difficult" },
  { id: "accompaniment", label: "Needs someone to accompany her" },
];

export const constraintLabel = (id: ConstraintId) =>
  [...TIME_CHIPS, ...OTHER_CHIPS].find((c) => c.id === id)?.label ?? id;

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

/** Deterministic keyword pre-highlighting (Hindi + English). Suggestions only — worker must tap to confirm. */
export function suggestConstraints(text: string): ConstraintId[] {
  const t = text.toLowerCase().normalize("NFC");
  if (!t.trim()) return [];
  const out: ConstraintId[] = [];
  const tomorrow = has(t, ["tomorrow", "कल"]);
  const today = has(t, ["today", "आज"]);
  const morning = has(t, ["morning", "सुबह", "before lunch", "दोपहर से पहले"]);
  const afternoon = has(t, ["afternoon", "दोपहर बाद", "शाम"]);
  if (tomorrow && morning) out.push("time_tomorrow_morning");
  else if (tomorrow && afternoon) out.push("time_tomorrow_afternoon");
  else if (today && morning) out.push("time_today_morning");
  else if (today && afternoon) out.push("time_today_afternoon");
  if (has(t, ["repeated trip", "one trip", "only once", "एक ही बार", "बार-बार", "बार बार", "दोबारा नहीं"])) out.push("one_trip");
  if (has(t, ["far", "long way", "travel is difficult", "दूर", "लंबा सफर"])) out.push("short_travel");
  if (has(t, ["accompany", "husband", "with her", "साथ", "पति"])) out.push("accompaniment");
  return out;
}
