import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { formatStamp } from "@/lib/followup";
import { buildReminderSms, parseSmsReply, UNRECOGNISED_REPLY } from "@/lib/sms";
import { recordSimulatedReminder, recordSimulatedReply } from "@/lib/store";
import type { Referral } from "@/lib/types";
import { IvrFollowUp } from "@/components/IvrFollowUp";

export function SmsFollowUp({ r }: { r: Referral }) {
  const [reply, setReply] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [justSent, setJustSent] = useState(false);
  if (!r.referralCode) return null;
  const body = buildReminderSms(r.referralCode);
  const events = r.smsEvents ?? [];
  const sent = events.some((e) => e.direction === "outbound_reminder");
  const patientReported = r.arrivals?.find((a) => a.type === "patient_reported_arrival");
  const facilityVerified = r.arrivals?.some((a) => a.type === "facility_verified_arrival");
  // Arrival-confirmation reminders stop once any arrival evidence exists.
  const arrivalKnown = !!patientReported || !!facilityVerified;

  async function simulateSend() {
    await recordSimulatedReminder(r, body);
    setJustSent(true);
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    const parsed = parseSmsReply(reply);
    await recordSimulatedReply(r, reply, parsed.kind);
    setFeedback(parsed.kind === "unrecognised" ? { ok: false, text: UNRECOGNISED_REPLY } : { ok: true, text: "Patient-reported arrival recorded." });
    setReply("");
  }

  return (
    <section className="surface space-y-4 p-4" aria-labelledby="sms-h">
      <div>
        <h2 id="sms-h" className="flex items-center gap-2 text-lg font-bold"><MessageSquare className="h-5 w-5" aria-hidden /> Patient SMS follow-up</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          In deployment, these messages can be sent through an SMS gateway or local SMS hub. SMS transport is simulated in this prototype.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The patient does not need the Pahunchi app. In deployment, an SMS-capable basic phone can reply through the SMS network. The health-worker app remains offline-first.
        </p>
      </div>

      <div>
        <p className="eyebrow mb-1.5">SMS preview — simulated transport</p>
        <p lang="hi" className="hindi rounded-xl border border-dashed border-input bg-secondary p-3">{body}</p>
        <p className="mt-1 text-xs text-muted-foreground">Contains only the referral code — no facility, barrier or clinical details.</p>
      </div>

      {arrivalKnown ? (
        <div role="status" className="rounded-xl border border-border p-3 text-sm">
          <p className="font-semibold">{facilityVerified ? "Arrival verified by referral facility" : "Arrival already reported by patient"}</p>
          {patientReported && <p className="text-muted-foreground">Reported via {patientReported.source === "ivr" ? "IVR" : "SMS"}</p>}
          <p className="mt-1 text-xs text-muted-foreground">Arrival-confirmation reminders (SMS and IVR) are no longer offered. Other care follow-up may still be needed.</p>
        </div>
      ) : (<>
      <button type="button" className="btn-secondary w-full text-sm" onClick={simulateSend}>
        <Send className="h-4 w-4" aria-hidden /> Simulate sending SMS
      </button>
      {justSent && <p role="status" className="text-sm font-semibold text-success">SMS simulation recorded</p>}

      {sent && (
        <form onSubmit={submitReply} className="space-y-2 rounded-xl border border-border p-3">
          <label htmlFor="sms-reply" className="field-label">Simulate patient reply</label>
          <p className="text-xs text-muted-foreground">Supported: 1 = I reached the referred facility</p>
          <div className="flex gap-2">
            <input id="sms-reply" className="field flex-1 font-mono" autoComplete="off" inputMode="numeric" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="1" />
            <button type="submit" className="btn-primary" disabled={!reply.trim()}>Submit reply</button>
          </div>
          {feedback && <p role="status" className={`text-sm ${feedback.ok ? "font-semibold text-success" : "text-destructive"}`}>{feedback.text}</p>}
        </form>
      )}
      </>)}

      {patientReported && (
        <div className="rounded-xl bg-success-soft p-3 text-sm">
          <p className="font-semibold text-success">Patient-reported arrival · {formatStamp(patientReported.at)}</p>
          <p className="mt-1 text-muted-foreground">Reported by the patient via {patientReported.source === "ivr" ? "the Voice / IVR" : "the SMS"} follow-up workflow. This does not verify diagnosis or treatment completion.</p>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5">Simulated SMS log</p>
          <ul className="space-y-1.5 text-sm">
            {events.map((e, i) => (
              <li key={i} className="rounded-lg bg-secondary p-2">
                <span className="font-medium">{e.direction === "outbound_reminder" ? "Reminder (simulated)" : "Patient reply (simulated)"}</span>
                <span className="text-muted-foreground"> · {formatStamp(e.at)}</span>
                {e.direction === "inbound_reply" && <span className="block font-mono">“{e.body}” — {e.parsed === "patient_reported_arrival" ? "recognised" : "not recognised"}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <IvrFollowUp r={r} arrivalKnown={arrivalKnown} />
    </section>
  );
}
