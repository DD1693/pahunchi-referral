import { Phone } from "lucide-react";
import { useState } from "react";
import { formatStamp } from "@/lib/followup";
import { IVR_BARRIER_MENU, IVR_BARRIER_PROMPT_HI, IVR_SCRIPT_HI, IVR_SCRIPT_HI_NOT_REACHED, isNotReachedKey, parseIvrBarrierKey, parseIvrKey } from "@/lib/ivr";
import { recordIvrBarrier, recordIvrNotReached, recordSimulatedIvrCall, recordSimulatedIvrKeypress } from "@/lib/store";
import type { Referral } from "@/lib/types";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export function IvrFollowUp({ r, arrivalKnown }: { r: Referral; arrivalKnown: boolean }) {
  const [callId, setCallId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [stage, setStage] = useState<"main" | "barrier" | "done">("main");
  const events = r.ivrEvents ?? [];

  async function startCall() {
    setFeedback(null);
    setStage("main");
    setCallId(await recordSimulatedIvrCall(r));
  }

  async function press(key: string) {
    if (!callId || stage === "done") return;
    if (stage === "barrier") {
      const code = parseIvrBarrierKey(key);
      if (!code) { setFeedback({ ok: false, text: `Key ${key} not recognised. Press 1–5.` }); return; }
      const label = IVR_BARRIER_MENU.find((m) => m.code === code)!.en;
      await recordIvrBarrier(r, callId, key, code, label);
      setStage("done");
      setFeedback({ ok: true, text: `Patient-reported barrier recorded: ${label}. Referral moved to Needs attention. Destination unchanged.` });
      return;
    }
    if (isNotReachedKey(key)) {
      await recordIvrNotReached(r, callId);
      setStage("barrier");
      setFeedback({ ok: true, text: "Key 2 received — patient has not reached the facility. Barrier menu playing (simulated)." });
      return;
    }
    const result = await recordSimulatedIvrKeypress(r, callId, key, parseIvrKey(key).kind);
    setFeedback(
      result === "patient_reported_arrival"
        ? { ok: true, text: "Key 1 received — patient-reported arrival recorded (via IVR)." }
        : result === "duplicate"
          ? { ok: true, text: "Arrival already reported — no new arrival added." }
          : { ok: false, text: `Key ${key} not recognised. This prototype supports 1 = reached referral facility.` },
    );
  }

  return (
    <div className="space-y-3 border-t border-border pt-4" aria-labelledby="ivr-h">
      <h3 id="ivr-h" className="flex items-center gap-2 text-base font-bold"><Phone className="h-4 w-4" aria-hidden /> Voice / IVR</h3>
      <p className="text-sm text-muted-foreground">
        In deployment, an automated call could play a privacy-safe message and let the patient press 1 on any keypad phone. Telephony is simulated in this prototype.
      </p>
      <div>
        <p className="eyebrow mb-1.5">Voice message preview — simulated telephony</p>
        <p lang="hi" className="hindi rounded-xl border border-dashed border-input bg-secondary p-3">{IVR_SCRIPT_HI} {IVR_SCRIPT_HI_NOT_REACHED}</p>
        <p className="mt-1 text-xs text-muted-foreground">In English: “This is a message about your referral. If you have visited the facility, press 1. If you have not been able to go yet, press 2.” After 2: “Tell us why — 1 travel/cost, 2 family/accompaniment, 3 work/caregiving, 4 unsure where/when, 5 other.” Not clinical triage.</p>
        <p className="mt-1 text-xs text-muted-foreground">The voice message avoids diagnosis and treatment details because another person may answer a shared phone.</p>
      </div>
      <p className="text-xs text-muted-foreground">
        The patient does not need the Pahunchi app. In deployment, SMS or IVR can work with basic phones using the mobile network. Pahunchi's health-worker workflow remains offline-first.
      </p>
      {arrivalKnown ? (
        <p className="text-sm text-muted-foreground">IVR arrival call not offered — arrival evidence already recorded (see above).</p>
      ) : (
      <button type="button" className="btn-secondary w-full text-sm" onClick={startCall}>
        <Phone className="h-4 w-4" aria-hidden /> Simulate IVR call
      </button>
      )}
      {callId && !arrivalKnown && (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <p role="status" className="text-sm font-semibold text-success">IVR call simulation started</p>
          {stage === "barrier" ? (
            <div className="text-xs text-muted-foreground">
              <p lang="hi" className="hindi">{IVR_BARRIER_PROMPT_HI}</p>
              <p>{IVR_BARRIER_MENU.map((m) => `${m.key} = ${m.en}`).join(" · ")}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Simulated patient keypad. Supported: 1 = I reached the referred facility · 2 = I have not reached it</p>
          )}
          <div className="mx-auto grid max-w-[14rem] grid-cols-3 gap-2" role="group" aria-label="Simulated keypad">
            {KEYS.map((k) => (
              <button key={k} type="button" className="btn-secondary h-11 font-mono text-lg" onClick={() => press(k)} aria-label={`Press ${k}`}>{k}</button>
            ))}
          </div>
          {feedback && <p role="status" className={`text-sm ${feedback.ok ? "font-semibold text-success" : "text-destructive"}`}>{feedback.text}</p>}
        </div>
      )}
      {events.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5">Simulated IVR log</p>
          <ul className="space-y-1.5 text-sm">
            {events.map((e, i) => (
              <li key={i} className="rounded-lg bg-secondary p-2">
                <span className="font-medium">{e.kind === "call_started" ? "Call started (simulated)" : `Key ${e.key} (simulated)`}</span>
                <span className="text-muted-foreground"> · {formatStamp(e.at)}</span>
                {e.kind === "keypress" && <span className="block text-muted-foreground">{e.parsed === "patient_reported_arrival" ? "recognised" : e.parsed === "duplicate" ? "duplicate — ignored" : e.parsed === "not_reached" ? "not reached — barrier menu" : e.parsed === "barrier" ? "patient-reported barrier" : "not recognised"}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
