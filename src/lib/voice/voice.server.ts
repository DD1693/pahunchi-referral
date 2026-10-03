// Server-only voice-processing demo: ElevenLabs transcription → Anthropic strict operational extraction
// → server-side validation in code. Keys are read only inside these functions; never returned or logged.
import { createHash, timingSafeEqual } from "crypto";
import { HEALTH_AREAS, SERVICE_CATALOGUE, type HealthArea } from "@/lib/facilities/data";
import { OTHER_CHIPS, TIME_CHIPS, type ConstraintId } from "@/lib/facilities/constraints";

export const MAX_AUDIO_BYTES = 1_500_000; // ~30 s of compressed browser audio, with headroom
export const MAX_SECONDS = 32;

export type Field<T> = { value: T; quote: string };
export interface VoiceDraft {
  intent?: Field<"create_referral" | "check_referral" | "confirm_arrival" | "referral_update">;
  referralCode?: Field<string>;
  healthArea?: Field<HealthArea>;
  serviceId?: Field<string>;
  constraints: Field<ConstraintId>[];
  timing?: Field<string>;
  referralUpdate?: Field<string>;
  clinicalDetailsMentioned: boolean;
}
export interface VoiceResult { transcript: string; draft: VoiceDraft; dropped: string[] }

export class VoiceError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function checkPasscode(given: string): void {
  const expected = process.env["PAHUNCHI_DEMO_PASSCODE"];
  if (!expected) throw new VoiceError(503, "Demo passcode is not configured on the server.");
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(a, b)) throw new VoiceError(401, "Incorrect demo passcode.");
}

export async function transcribe(audio: Blob): Promise<string> {
  const key = process.env["ELEVENLABS_API_KEY"];
  if (!key) throw new VoiceError(503, "Transcription service is not configured.");
  const fd = new FormData();
  fd.append("file", audio, "recording.webm");
  fd.append("model_id", "scribe_v2");
  fd.append("tag_audio_events", "false");
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: fd });
  if (!res.ok) {
    console.error(`ElevenLabs transcription failed [${res.status}]`);
    throw new VoiceError(502, `Transcription failed (${res.status}).`);
  }
  const data = (await res.json()) as { text?: string; words?: { end?: number }[] };
  const lastEnd = data.words?.length ? data.words[data.words.length - 1]?.end ?? 0 : 0;
  if (lastEnd > MAX_SECONDS) throw new VoiceError(413, "Recording is longer than 30 seconds.");
  return (data.text ?? "").trim();
}

const SERVICE_IDS = Object.values(SERVICE_CATALOGUE).flat().map((s) => s.id);
const CONSTRAINT_IDS = [...TIME_CHIPS, ...OTHER_CHIPS].map((c) => c.id);
const INTENTS = ["create_referral", "check_referral", "confirm_arrival", "referral_update"] as const;

const fieldSchema = (value: object) => ({ type: "object", properties: { value, quote: { type: "string" } }, required: ["value", "quote"] });

const TOOL = {
  name: "record_operational_draft",
  description: "Record ONLY operational information explicitly spoken in the transcript. Omit any field not explicitly spoken.",
  input_schema: {
    type: "object",
    properties: {
      intent: fieldSchema({ type: "string", enum: INTENTS }),
      referral_code: fieldSchema({ type: "string" }),
      health_area: fieldSchema({ type: "string", enum: HEALTH_AREAS.map((a) => a.id) }),
      service: fieldSchema({ type: "string", enum: SERVICE_IDS }),
      constraints: { type: "array", items: fieldSchema({ type: "string", enum: CONSTRAINT_IDS }) },
      timing: fieldSchema({ type: "string" }),
      referral_update: fieldSchema({ type: "string" }),
      clinical_details_mentioned: { type: "boolean" },
    },
    required: ["clinical_details_mentioned"],
  },
};

const SYSTEM = `You convert a health worker's spoken transcript (Hindi, English or Hinglish) into a structured OPERATIONAL draft for a referral-continuity tool.
Rules:
- Extract a field ONLY if it is explicitly spoken. Never guess.
- Every field needs "quote": a short exact substring copied character-for-character from the transcript that states it.
- health_area / service: only if the worker explicitly names the area or service. NEVER infer a service or area from symptoms, conditions or test results.
- Do not diagnose, interpret symptoms, infer disease or treatment, judge urgency or risk, choose or rank facilities, or decide on referral.
- constraints: only practical, non-clinical constraints explicitly spoken (travel timing, cannot afford repeated trips, long travel difficult, needs accompaniment).
- timing: preferred day/time if spoken, in a few words.
- referral_update: a short operational update (e.g. patient reached facility) only if spoken.
- clinical_details_mentioned: true if the transcript mentions symptoms, conditions, test results or other clinical details. Do NOT extract or interpret them.
Health areas: ${HEALTH_AREAS.map((a) => `${a.id}=${a.label}`).join(", ")}.
Services: ${Object.entries(SERVICE_CATALOGUE).map(([a, s]) => `${a}: ${s.map((x) => `${x.id}=${x.label}`).join(", ")}`).join("; ")}.
Constraints: ${[...TIME_CHIPS, ...OTHER_CHIPS].map((c) => `${c.id}=${c.label}`).join(", ")}.`;

export async function extract(transcript: string): Promise<Record<string, unknown>> {
  const key = process.env["ANTHROPIC_API_KEY"];
  if (!key) throw new VoiceError(503, "Extraction service is not configured.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-5-5",
      max_tokens: 800,
      temperature: 0,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: `Transcript:\n"""${transcript}"""` }],
    }),
  });
  if (!res.ok) {
    console.error(`Anthropic extraction failed [${res.status}]`);
    throw new VoiceError(502, `Extraction failed (${res.status}).`);
  }
  const data = (await res.json()) as { content?: { type: string; input?: Record<string, unknown> }[] };
  return data.content?.find((c) => c.type === "tool_use")?.input ?? {};
}

const norm = (s: string) => s.normalize("NFC").toLowerCase().replace(/[\s।,.!?"'“”]+/g, " ").trim();

/** Code-level validation: quote must appear in transcript and enum values must be allowed; else drop. */
export function validate(transcript: string, raw: Record<string, unknown>): { draft: VoiceDraft; dropped: string[] } {
  const T = norm(transcript);
  const dropped: string[] = [];
  const take = <V extends string>(name: string, f: unknown, allowed?: readonly string[]): Field<V> | undefined => {
    if (f == null) return undefined;
    const o = f as { value?: unknown; quote?: unknown };
    const ok = typeof o.value === "string" && o.value.trim() && typeof o.quote === "string" && norm(o.quote).length > 0 && T.includes(norm(o.quote)) && (!allowed || allowed.includes(o.value));
    if (!ok) { dropped.push(name); return undefined; }
    return { value: (o.value as string).trim().slice(0, 120) as V, quote: (o.quote as string).slice(0, 200) };
  };
  const draft: VoiceDraft = { constraints: [], clinicalDetailsMentioned: raw["clinical_details_mentioned"] === true };
  const intent = take<NonNullable<VoiceDraft["intent"]>["value"]>("intent", raw["intent"], INTENTS);
  if (intent) draft.intent = intent;
  const code = take<string>("referral_code", raw["referral_code"]);
  if (code) draft.referralCode = code;
  const area = take<HealthArea>("health_area", raw["health_area"], HEALTH_AREAS.map((a) => a.id));
  if (area) draft.healthArea = area;
  const svc = take<string>("service", raw["service"], SERVICE_IDS);
  if (svc) {
    // Service must belong to the spoken area; if no area was spoken, use the area that owns that service id.
    const owner = (Object.keys(SERVICE_CATALOGUE) as HealthArea[]).filter((a) => SERVICE_CATALOGUE[a].some((s) => s.id === svc.value));
    if (draft.healthArea && !owner.includes(draft.healthArea.value)) dropped.push("service");
    else draft.serviceId = svc;
  }
  if (Array.isArray(raw["constraints"])) {
    for (const c of raw["constraints"]) { const v = take<ConstraintId>("constraint", c, CONSTRAINT_IDS); if (v && !draft.constraints.some((x) => x.value === v.value)) draft.constraints.push(v); }
  }
  const timing = take<string>("timing", raw["timing"]);
  if (timing) draft.timing = timing;
  const upd = take<string>("referral_update", raw["referral_update"]);
  if (upd) draft.referralUpdate = upd;
  return { draft, dropped };
}
