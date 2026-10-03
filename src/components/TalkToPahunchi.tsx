import { ChevronDown, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HEALTH_AREAS, SERVICE_CATALOGUE, type HealthArea } from "@/lib/facilities/data";
import { constraintLabel, type ConstraintId } from "@/lib/facilities/constraints";

type Field<T> = { value: T; quote: string };
interface Draft {
  intent?: Field<string>;
  referralCode?: Field<string>;
  healthArea?: Field<HealthArea>;
  serviceId?: Field<string>;
  constraints: Field<ConstraintId>[];
  timing?: Field<string>;
  referralUpdate?: Field<string>;
  clinicalDetailsMentioned: boolean;
}
export interface VoiceApply { area?: HealthArea; serviceId?: string; constraints: ConstraintId[]; note?: string }

const MAX_MS = 30_000;

/** Connected demo only. Never saves anything; the worker reviews and applies to the normal form. */
export function TalkToPahunchi({ onApply }: { onApply: (v: VoiceApply) => void }) {
  const [open, setOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [state, setState] = useState<"idle" | "recording" | "processing" | "review">("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dropped, setDropped] = useState<string[]>([]);
  const [area, setArea] = useState<HealthArea | "">("");
  const [svc, setSvc] = useState("");
  const [cons, setCons] = useState<ConstraintId[]>([]);
  const [useNote, setUseNote] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(0);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); rec.current?.stream.getTracks().forEach((t) => t.stop()); }, []);

  async function start() {
    setError(null);
    if (!navigator.onLine) return setError("No internet connection. The voice demo needs connectivity — continue with the form below.");
    if (!passcode.trim()) return setError("Enter the demo passcode first.");
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { return setError("Microphone permission was denied. Continue with the form below."); }
    const chunks: BlobPart[] = [];
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const seconds = Math.min(30, (Date.now() - started.current) / 1000);
      void send(new Blob(chunks, { type: mr.mimeType || "audio/webm" }), seconds);
    };
    rec.current = mr;
    started.current = Date.now();
    mr.start();
    setState("recording");
    timer.current = setTimeout(stop, MAX_MS);
  }
  function stop() {
    if (timer.current) clearTimeout(timer.current);
    if (rec.current?.state === "recording") rec.current.stop();
  }

  async function send(audio: Blob, seconds: number) {
    setState("processing");
    const fd = new FormData();
    fd.append("passcode", passcode);
    fd.append("seconds", String(Math.max(0.5, seconds)));
    fd.append("audio", audio, "recording.webm");
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 45_000);
      const res = await fetch("/api/public/voice", { method: "POST", body: fd, signal: ctrl.signal });
      clearTimeout(to);
      const body = (await res.json().catch(() => ({}))) as { error?: string; transcript?: string; draft?: Draft; dropped?: string[] };
      if (!res.ok || !body.draft) throw new Error(body.error || `Voice processing failed (${res.status}).`);
      setTranscript(body.transcript ?? "");
      setDraft(body.draft);
      setDropped(body.dropped ?? []);
      setArea(body.draft.healthArea?.value ?? "");
      setSvc(body.draft.serviceId?.value ?? "");
      setCons(body.draft.constraints.map((c) => c.value));
      setUseNote(false);
      setState("review");
    } catch (e) {
      setError(`${e instanceof Error && e.name !== "AbortError" ? e.message : "Voice processing timed out."} Nothing was saved — continue with the form below.`);
      setState("idle");
    }
    // Audio blob goes out of scope here; it is never stored.
  }

  const reset = () => { setState("idle"); setDraft(null); setTranscript(""); setDropped([]); };
  const apply = () => {
    onApply({ ...(area ? { area } : {}), ...(area && svc ? { serviceId: svc } : {}), constraints: cons, ...(useNote ? { note: transcript } : {}) });
    reset();
    setOpen(false);
  };
  const Quote = ({ q }: { q: string }) => <span className="block text-xs text-muted-foreground">“{q}”</span>;

  return (
    <div className="surface p-3">
      <button type="button" className="flex w-full items-center justify-between text-left font-semibold" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="flex flex-wrap items-center gap-2"><Mic className="h-4 w-4" aria-hidden /> Talk to Pahunchi <span className="chip-demo">Connected demo</span></span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-muted-foreground">This browser microphone demonstrates the voice processing that could sit behind an ordinary cellular-call gateway. In deployment, a basic phone could call using the cellular voice network without mobile data. The gateway and server-side processing would still need connectivity.</p>
          <p className="font-semibold">Live telephony integration is not implemented in this prototype.</p>
          <p className="rounded-lg bg-attention-soft p-2">Do not say the patient’s name, phone number, Aadhaar number, or other directly identifying information.</p>
          <p className="text-xs text-muted-foreground">Audio is sent to ElevenLabs for transcription. The resulting transcript is sent to Anthropic for structured processing. Audio is not stored. Phone-line audio is lower quality than this browser recording. Speech recognition accuracy would need testing on real calls before deployment.</p>

          {state !== "review" && (
            <div className="space-y-2">
              <label htmlFor="voice-pass" className="field-label">Demo passcode</label>
              <input id="voice-pass" type="password" className="field" autoComplete="off" value={passcode} onChange={(e) => setPasscode(e.target.value)} disabled={state !== "idle"} />
              {state === "recording" ? (
                <button type="button" className="btn-primary w-full" onClick={stop}><Square className="h-4 w-4" aria-hidden /> Stop recording (max 30 s)</button>
              ) : (
                <button type="button" className="btn-secondary w-full" onClick={start} disabled={state !== "idle"}>
                  <Mic className="h-4 w-4" aria-hidden /> {state === "processing" ? "Processing…" : "Record once (max 30 s)"}
                </button>
              )}
            </div>
          )}
          {error && <p role="alert" className="text-destructive">{error}</p>}

          {state === "review" && draft && (
            <div className="space-y-3">
              <div>
                <p className="eyebrow mb-1">Transcript</p>
                <p className="rounded-lg bg-secondary p-2" lang="hi">{transcript}</p>
              </div>
              {draft.clinicalDetailsMentioned && (
                <p role="note" className="rounded-lg border border-border p-2">Clinical details are not interpreted by Pahunchi. Follow normal clinical assessment and referral processes.</p>
              )}
              <p className="font-semibold">Draft — AI suggestions require worker review. Nothing is saved until you complete the normal form.</p>
              {draft.intent && <p>Intent: {draft.intent.value.replace(/_/g, " ")}<Quote q={draft.intent.quote} /></p>}
              {draft.referralCode && <p>Referral code mentioned: {draft.referralCode.value}<Quote q={draft.referralCode.quote} /></p>}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="v-area" className="field-label">Health area</label>
                  <select id="v-area" className="field" value={area} onChange={(e) => { setArea(e.target.value as HealthArea); setSvc(""); }}>
                    <option value="">Not set</option>
                    {HEALTH_AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                  {draft.healthArea && <Quote q={draft.healthArea.quote} />}
                </div>
                <div>
                  <label htmlFor="v-svc" className="field-label">Service</label>
                  <select id="v-svc" className="field" value={svc} disabled={!area} onChange={(e) => setSvc(e.target.value)}>
                    <option value="">Not set</option>
                    {area && SERVICE_CATALOGUE[area].map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  {draft.serviceId && <Quote q={draft.serviceId.quote} />}
                </div>
              </div>
              {draft.constraints.length > 0 && (
                <fieldset>
                  <legend className="field-label">Practical constraints (untick to reject)</legend>
                  {draft.constraints.map((c) => (
                    <label key={c.value} className="flex items-start gap-2 py-1">
                      <input type="checkbox" checked={cons.includes(c.value)} onChange={() => setCons((p) => (p.includes(c.value) ? p.filter((x) => x !== c.value) : [...p, c.value]))} />
                      <span>{constraintLabel(c.value)}<Quote q={c.quote} /></span>
                    </label>
                  ))}
                </fieldset>
              )}
              {draft.timing && <p>Preferred timing: {draft.timing.value}<Quote q={draft.timing.quote} /></p>}
              {draft.referralUpdate && <p>Referral update mentioned: {draft.referralUpdate.value}<Quote q={draft.referralUpdate.quote} /></p>}
              {dropped.length > 0 && <p className="text-xs text-muted-foreground">{dropped.length} unsupported item(s) were discarded by server checks.</p>}
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={useNote} onChange={(e) => setUseNote(e.target.checked)} />
                <span>Use transcript as the worker note (barrier suggestions then come from the on-device classifier in step 2)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn-primary" onClick={apply}>Accept into form</button>
                <button type="button" className="btn-secondary" onClick={reset}>Reject draft</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
