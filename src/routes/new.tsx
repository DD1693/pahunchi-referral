import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Lock, Save } from "lucide-react";
import { useState } from "react";
import { BarrierReview, emptyReview, reviewComplete, type ReviewState } from "@/components/BarrierReview";
import { addDays, todayISO } from "@/lib/followup";
import { FollowUpSupport } from "@/components/FollowUpSupport";
import { ReferralCodeCard } from "@/components/ReferralCode";
import { saveReferral, uid } from "@/lib/store";
import type { HistoryEvent, Referral } from "@/lib/types";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New referral — Pahunchi" },
      { name: "description", content: "Record a referral and analyse a Hindi barrier note on this device." },
      { property: "og:title", content: "New referral — Pahunchi" },
      { property: "og:description", content: "Record a referral, analyse the note on-device, confirm barriers, save locally." },
    ],
  }),
  component: NewReferral,
});

const FACILITIES = ["District Hospital", "Community Health Centre", "Referral Clinic"];

export const PRIVACY_NOTE =
  "Prototype records are stored on this device. Do not enter names, phone numbers, clinical results or other identifying information.";

function NewReferral() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const t = todayISO();
  const [f, setF] = useState({
    patientId: "",
    referralDate: t,
    destination: "",
    department: "",
    followUpDate: addDays(t, 7),
    context: "",
  });
  const [tried, setTried] = useState(false);
  const [note, setNote] = useState("");
  const [review, setReview] = useState<ReviewState>(emptyReview());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Referral | null>(null);

  const missing = {
    patientId: !f.patientId.trim(),
    referralDate: !f.referralDate,
    destination: !f.destination.trim(),
    followUpDate: !f.followUpDate,
  };
  const valid = !Object.values(missing).some(Boolean);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function save() {
    setSaving(true);
    setSaveError(null);
    const now = new Date().toISOString();
    const history: HistoryEvent[] = [
      { type: "created", at: now },
      {
        type: "barrier_review",
        at: now,
        detail: review.noBarrier ? "No barrier confirmed" : `${review.confirmed.length} barrier(s) confirmed`,
      },
    ];
    const r: Referral = {
      id: uid(),
      patientId: f.patientId.trim().toUpperCase(),
      referralDate: f.referralDate,
      destination: f.destination.trim(),
      department: f.department.trim(),
      followUpDate: f.followUpDate,
      context: f.context.trim(),
      notes: note.trim() ? [{ text: note.trim(), at: now }] : [],
      confirmedBarriers: review.noBarrier ? [] : review.confirmed,
      noBarrierConfirmed: review.noBarrier,
      outcome: "open",
      syncState: "pending",
      isDemo: false,
      history,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const stored = await saveReferral(r);
      if (stored.confirmedBarriers.length > 0) {
        setSaved(stored);
        return;
      }
      navigate({ to: "/referral", search: { id: stored.id } });
    } catch (e) {
      console.error(e);
      setSaveError("Could not save on this device. Please try again.");
      setSaving(false);
    }
  }

  if (saved) {
    const done = () => navigate({ to: "/referral", search: { id: saved.id } });
    return (
      <div className="space-y-5">
        <p role="status" className="rounded-xl bg-success-soft p-3 font-semibold text-success">
          Referral {saved.patientId} saved on this device.
        </p>
        <ReferralCodeCard code={saved.referralCode} />
        <FollowUpSupport r={saved} onDone={done} doneLabel="Continue without actions" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Step {step} of 2</p>
        <h1 className="text-2xl font-bold">{step === 1 ? "Referral details" : "Barrier note"}</h1>
        <div className="mt-3 grid grid-cols-2 gap-2" aria-hidden>
          <span className="h-1.5 rounded-full bg-primary" />
          <span className={`h-1.5 rounded-full ${step === 2 ? "bg-primary" : "bg-border"}`} />
        </div>
      </div>

      {step === 1 ? (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setTried(true);
            if (valid) setStep(2);
          }}
        >
          <div>
            <label htmlFor="pid" className="field-label">Patient ID *</label>
            <input id="pid" className="field font-mono uppercase" autoComplete="off" placeholder="e.g. CG-0142" value={f.patientId} onChange={set("patientId")} aria-invalid={tried && missing.patientId} aria-describedby="pid-note" />
            <p id="pid-note" className="mt-2 flex items-start gap-2 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {PRIVACY_NOTE}
            </p>
            {tried && missing.patientId && <p className="mt-1 text-sm text-destructive">Patient ID is required.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rdate" className="field-label">Referral date *</label>
              <input id="rdate" type="date" className="field" value={f.referralDate} onChange={set("referralDate")} />
            </div>
            <div>
              <label htmlFor="fdate" className="field-label">Follow-up due *</label>
              <input id="fdate" type="date" className="field" value={f.followUpDate} onChange={set("followUpDate")} />
            </div>
          </div>
          <div>
            <label htmlFor="dest" className="field-label">Destination facility *</label>
            <input id="dest" className="field" list="facilities" value={f.destination} onChange={set("destination")} aria-invalid={tried && missing.destination} />
            <datalist id="facilities">{FACILITIES.map((x) => <option key={x} value={x} />)}</datalist>
            <div className="mt-2 flex flex-wrap gap-2">
              {FACILITIES.map((x) => (
                <button key={x} type="button" onClick={() => setF({ ...f, destination: x })} className={`min-h-10 rounded-full border px-3 text-sm ${f.destination === x ? "border-primary bg-primary-soft font-semibold text-accent-foreground" : "border-input bg-card"}`}>
                  {x}
                </button>
              ))}
            </div>
            {tried && missing.destination && <p className="mt-1 text-sm text-destructive">Destination is required.</p>}
          </div>
          <div>
            <label htmlFor="dept" className="field-label">Department / service</label>
            <input id="dept" className="field" placeholder="e.g. Outpatient department" value={f.department} onChange={set("department")} />
          </div>
          <div>
            <label htmlFor="ctx" className="field-label">Referral note / context <span className="font-normal text-muted-foreground">(optional)</span></label>
            <textarea id="ctx" rows={2} className="field py-3" placeholder="Logistics only — no clinical details" value={f.context} onChange={set("context")} />
          </div>
          <button type="submit" className="btn-primary w-full">
            Continue <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="surface flex items-center justify-between p-3 text-sm">
            <span>
              <span className="font-mono font-bold">{f.patientId.toUpperCase()}</span>
              <span className="text-muted-foreground"> → {f.destination}</span>
            </span>
            <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Edit
            </button>
          </div>
          <BarrierReview note={note} setNote={setNote} review={review} setReview={setReview} />
          {saveError && <p role="alert" className="text-destructive">{saveError}</p>}
          <div className="space-y-2">
            <button type="button" className="btn-primary w-full" disabled={!reviewComplete(review) || saving} onClick={save}>
              <Save className="h-5 w-5" aria-hidden /> Confirm & save
            </button>
            {!reviewComplete(review) && (
              <p className="text-center text-sm text-muted-foreground">
                {review.result ? "Confirm at least one barrier, or choose “No barrier confirmed”." : "Analyse the note, then confirm the barriers."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
