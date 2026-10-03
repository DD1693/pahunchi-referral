import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Lock, Printer, Save } from "lucide-react";
import { useState } from "react";
import { BarrierReview, emptyReview, reviewComplete, type ReviewState } from "@/components/BarrierReview";
import { addDays, todayISO } from "@/lib/followup";
import { FollowUpSupport } from "@/components/FollowUpSupport";
import { ReferralCodeCard } from "@/components/ReferralCode";
import { saveReferral, uid, updateReferral, useReferrals } from "@/lib/store";
import type { FacilityRef, HistoryEvent, Referral } from "@/lib/types";
import { FacilityFinder } from "@/components/FacilityFinder";
import { TalkToPahunchi, type VoiceApply } from "@/components/TalkToPahunchi";
import { constraintLabel } from "@/lib/facilities/constraints";
import { FACILITY_TYPES, facilityById, facilityTypeLabel } from "@/lib/facilities/data";
import { useLang, useT } from "@/lib/i18n";

export const Route = createFileRoute("/new")({
  validateSearch: (s: Record<string, unknown>): { onward?: string } => (typeof s["onward"] === "string" ? { onward: s["onward"] } : {}),
  head: () => ({
    meta: [
      { title: "New referral — Pahunchi" },
      { name: "description", content: "Record a referral and analyse a Hindi barrier note on this device." },
      { property: "og:title", content: "New referral — Pahunchi" },
      { property: "og:description", content: "Record a referral, analyse the note on-device, confirm barriers, save locally." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewReferral,
});

export const PRIVACY_NOTE =
  "Prototype records are stored on this device. Do not enter names, phone numbers, clinical results or other identifying information.";

function NewReferral() {
  const { onward } = Route.useSearch();
  const { loaded, referrals } = useReferrals();
  if (onward && !loaded) return <p className="text-muted-foreground">Loading…</p>;
  const parent = onward ? referrals.find((x) => x.id === onward) : undefined;
  return <NewReferralForm key={parent?.id ?? "new"} parent={parent} />;
}

function NewReferralForm({ parent }: { parent?: Referral | undefined }) {
  const navigate = useNavigate();
  const tr = useT();
  const lang = useLang();
  const [step, setStep] = useState<1 | 2>(1);
  const t = todayISO();
  const [f, setF] = useState({
    patientId: parent?.patientId ?? "",
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
  const [facilityRef, setFacilityRef] = useState<{ ref: FacilityRef; name: string } | null>(null);
  const [manualType, setManualType] = useState("");
  const [voice, setVoice] = useState<(VoiceApply & { n: number }) | null>(null);
  // Keep the finder link only while the destination still matches the worker's finder choice.
  const activeRef = facilityRef && facilityRef.name === f.destination.trim() ? facilityRef.ref : null;
  // Finder choice locks the facility type; a manual destination uses the manual selector.
  const facilityType = activeRef ? facilityById(activeRef.facilityId)?.facilityType ?? "" : manualType;

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
    if (activeRef) history.splice(1, 0, { type: "facility_selected", at: now, detail: f.destination.trim() });
    if (parent) history.splice(1, 0, { type: "onward_referral_created", at: now, detail: `From ${parent.referralCode ?? ""} · ${parent.destination}` });
    const r: Referral = {
      ...(activeRef ? { facilityRef: activeRef } : {}),
      ...(facilityType ? { facilityType } : {}),
      ...(parent
        ? {
            ...(parent.journeyId ? { journeyId: parent.journeyId } : {}),
            parentReferralId: parent.id,
            origin: parent.destination,
            ...(parent.facilityType ? { originType: parent.facilityType } : {}),
          }
        : {}),
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
      if (parent) {
        await updateReferral(parent, {}, { type: "onward_referral_created", at: now, detail: `${stored.referralCode} → ${stored.destination}` });
      }
      setSaved(stored);
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
        <Link to="/print" search={{ id: saved.id }} className="btn-secondary w-full">
          <Printer className="h-5 w-5" aria-hidden /> {tr("print_referral")}
        </Link>
        {saved.confirmedBarriers.length > 0 ? (
          <FollowUpSupport r={saved} onDone={done} doneLabel="Continue without actions" />
        ) : (
          <button type="button" className="btn-primary w-full" onClick={done}>{tr("continue")}</button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">{tr("step_of", { n: step })}</p>
        <h1 className="text-2xl font-bold">{step === 1 ? tr("referral_details") : tr("barrier_note")}</h1>
        {parent && (
          <div className="mt-3 rounded-xl border border-primary/30 bg-primary-soft p-3 text-sm">
            <p className="font-semibold">{tr("onward_from", { code: parent.referralCode ?? "" })} · {tr("journey_id")} <span className="font-mono">{parent.journeyId}</span></p>
            <p>{tr("origin")}: {parent.destination}{parent.facilityType ? ` (${facilityTypeLabel(parent.facilityType, lang)})` : ""}</p>
            <p className="mt-1 text-xs text-muted-foreground">{tr("onward_note")}</p>
          </div>
        )}
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
            <label htmlFor="pid" className="field-label">{tr("patient_id")} *</label>
            <input id="pid" className="field font-mono uppercase" autoComplete="off" placeholder="e.g. CG-0142" value={f.patientId} onChange={set("patientId")} aria-invalid={tried && missing.patientId} aria-describedby="pid-note" />
            <p id="pid-note" className="mt-2 flex items-start gap-2 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {PRIVACY_NOTE}
            </p>
            {tried && missing.patientId && <p className="mt-1 text-sm text-destructive">Patient ID is required.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rdate" className="field-label">{tr("referral_date")} *</label>
              <input id="rdate" type="date" className="field" value={f.referralDate} onChange={set("referralDate")} />
            </div>
            <div>
              <label htmlFor="fdate" className="field-label">{tr("followup_due")} *</label>
              <input id="fdate" type="date" className="field" value={f.followUpDate} onChange={set("followUpDate")} />
            </div>
          </div>
          <TalkToPahunchi
            onApply={(v) => {
              setVoice({ ...v, n: (voice?.n ?? 0) + 1 });
              if (v.note) setNote(v.note);
            }}
          />
          <FacilityFinder
            key={voice?.n ?? 0}
            defaultOpen={!!parent || !!voice}
            initial={voice ?? undefined}
            chosenId={activeRef?.facilityId}
            onChoose={(ref, name, service) => {
              setFacilityRef({ ref, name });
              setF((prev) => ({ ...prev, destination: name, department: service }));
            }}
          />
          <div>
            <label htmlFor="dest" className="field-label">{tr("destination")} *</label>
            <input id="dest" className="field" value={f.destination} onChange={set("destination")} aria-invalid={tried && missing.destination} />
            {tried && missing.destination && <p className="mt-1 text-sm text-destructive">Destination is required.</p>}
          </div>
          <div>
            <label htmlFor="ftype" className="field-label">{tr("facility_type")}</label>
            {activeRef ? (
              <>
                <p id="ftype" className="field flex items-center bg-secondary font-semibold" aria-readonly="true">{facilityTypeLabel(facilityType, lang)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{tr("ft_locked")}</p>
              </>
            ) : (
              <select id="ftype" className="field" value={manualType} onChange={(e) => setManualType(e.target.value)}>
                <option value="">{tr("ft_choose")}</option>
                {FACILITY_TYPES.map((x) => <option key={x.id} value={x.id}>{x[lang]}</option>)}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="dept" className="field-label">{tr("department")}</label>
            <input id="dept" className="field" placeholder="e.g. Outpatient department" value={f.department} onChange={set("department")} />
          </div>
          <div>
            <label htmlFor="ctx" className="field-label">{tr("context")} <span className="font-normal text-muted-foreground">(optional)</span></label>
            <textarea id="ctx" rows={2} className="field py-3" placeholder="Logistics only — no clinical details" value={f.context} onChange={set("context")} />
          </div>
          <button type="submit" className="btn-primary w-full">
            {tr("continue")} <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="surface flex items-center justify-between p-3 text-sm">
            <span>
              <span className="font-mono font-bold">{f.patientId.toUpperCase()}</span>
              <span className="text-muted-foreground"> → {f.destination}{facilityType ? ` · ${facilityTypeLabel(facilityType, lang)}` : ""}</span>
            </span>
            <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> {tr("edit")}
            </button>
          </div>
          {activeRef && activeRef.constraints.length > 0 && (
            <div className="rounded-xl bg-secondary p-3 text-sm">
              <p className="font-semibold">Already noted before referral</p>
              <p className="text-muted-foreground">{activeRef.constraints.map(constraintLabel).join(" · ")}</p>
              <p className="mt-1 text-xs text-muted-foreground">Practical constraints are kept separate and are not sent to the barrier suggestions.</p>
            </div>
          )}
          <BarrierReview note={note} setNote={setNote} review={review} setReview={setReview} />
          {saveError && <p role="alert" className="text-destructive">{saveError}</p>}
          <div className="space-y-2">
            <button type="button" className="btn-primary w-full" disabled={!reviewComplete(review) || saving} onClick={save}>
              <Save className="h-5 w-5" aria-hidden /> {tr("confirm_save")}
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
