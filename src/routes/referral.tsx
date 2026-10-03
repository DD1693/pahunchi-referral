import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, ClipboardList, CheckCircle2, CloudUpload, History, PhoneOutgoing, RotateCcw, Smartphone, UserCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { BarrierReview, emptyReview, reviewComplete, type ReviewState } from "@/components/BarrierReview";
import { FollowUpSupport } from "@/components/FollowUpSupport";
import { StatusPill } from "@/components/ReferralCard";
import { ArrivalStatus, ReferralCodeCard } from "@/components/ReferralCode";
import { SmsFollowUp } from "@/components/SmsFollowUp";
import { areaLabel, facilityTypeLabel, serviceLabel } from "@/lib/facilities/data";
import { useLang, useT } from "@/lib/i18n";
import { patientBarrierLabel } from "@/lib/ivr";
import { JourneyView } from "@/components/JourneyView";
import { Printer, Route as RouteIcon } from "lucide-react";
import { constraintLabel } from "@/lib/facilities/constraints";
import { addDays, arrivalState, formatDate, formatStamp, timingLabel, todayISO } from "@/lib/followup";
import { confirmWorkerArrival, recordReferralOutcome, updateReferral, useReferrals } from "@/lib/store";
import { barrierMeta, type HistoryType, type Referral, type ReferralOutcome } from "@/lib/types";

export const Route = createFileRoute("/referral")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s["id"] === "string" ? s["id"] : "" }),
  head: () => ({
    meta: [
      { title: "Referral detail — Pahunchi" },
      { name: "description", content: "Referral follow-up detail, confirmed barriers and activity history." },
      { property: "og:title", content: "Referral detail — Pahunchi" },
      { property: "og:description", content: "Update follow-up and review human-confirmed barriers for a referral." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Detail,
});

const EVENT_LABEL: Record<HistoryType, string> = {
  created: "Referral created",
  barrier_review: "Barrier review completed",
  attempted: "Follow-up attempted",
  rescheduled: "Referral rescheduled",
  not_completed: "Referral not yet completed",
  completed: "Referral completed",
  synced: "Marked as synced (demo)",
  action_planned: "Follow-up action planned",
  facility_verified_arrival: "Facility-verified arrival",
  patient_reported_arrival: "Patient-reported arrival",
  sms_reminder_simulated: "SMS reminder (simulated)",
  sms_reply_simulated: "Patient SMS reply (simulated)",
  ivr_call_simulated: "IVR call (simulated)",
  ivr_keypress_simulated: "IVR keypad press (simulated)",
  facility_selected: "Facility chosen by worker",
  worker_confirmed_arrival: "Worker-confirmed arrival",
  ivr_barrier_simulated: "Patient-reported barrier via IVR (simulated)",
  referral_outcome: "Referral outcome recorded",
  onward_referral_created: "Onward referral",
};

const OUTCOMES: { id: ReferralOutcome; key: "oc_service_completed" | "oc_refer_onward" | "oc_service_unavailable" | "oc_other" }[] = [
  { id: "service_completed", key: "oc_service_completed" },
  { id: "refer_onward", key: "oc_refer_onward" },
  { id: "service_unavailable", key: "oc_service_unavailable" },
  { id: "other", key: "oc_other" },
];

function Detail() {
  const { id } = Route.useSearch();
  const { loaded, referrals } = useReferrals();
  const r = referrals.find((x) => x.id === id);

  if (!loaded) return <p className="text-muted-foreground">Loading…</p>;
  if (!r)
    return (
      <div className="surface space-y-3 p-6 text-center">
        <p>This referral was not found on this device.</p>
        <Link to="/referrals" className="btn-secondary">Back to referrals</Link>
      </div>
    );
  return <DetailView key={r.id} r={r} />;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v || "—"}</dd>
    </div>
  );
}

function DetailView({ r }: { r: Referral }) {
  const [mode, setMode] = useState<"none" | "reschedule" | "notyet" | "support">("none");
  const [newDate, setNewDate] = useState(addDays(todayISO(), 7));
  const [note, setNote] = useState("");
  const [review, setReview] = useState<ReviewState>(emptyReview(r.confirmedBarriers));
  const now = () => new Date().toISOString();
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const { referrals } = useReferrals();
  const as = arrivalState(r);
  const hasOnward = referrals.some((x) => x.parentReferralId === r.id);

  async function chooseOutcome(o: ReferralOutcome) {
    await recordReferralOutcome(r, o);
    if (o === "refer_onward") navigate({ to: "/new", search: { onward: r.id } });
  }

  return (
    <div className="space-y-5">
      <Link to="/referrals" className="btn-ghost -ml-3 min-h-10 px-3 text-sm">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t("back_referrals")}
      </Link>

      <section className="surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-2xl font-bold">{r.patientId}</h1>
          {r.isDemo && <span className="chip-demo">Demo</span>}
          <StatusPill r={r} />
        </div>
        <div className="mt-3"><ReferralCodeCard code={r.referralCode} /></div>
        <div className="mt-3"><ArrivalStatus r={r} /></div>
        {as !== "verified" && as !== "worker_confirmed" && r.outcome !== "completed" && (
          <div className="mt-3 rounded-xl border border-border p-3">
            <button type="button" className="btn-secondary w-full text-sm" onClick={() => confirmWorkerArrival(r)}>
              <UserCheck className="h-4 w-4" aria-hidden /> {t("confirm_manual")}
            </button>
            <p className="mt-1 text-xs text-muted-foreground">{t("manual_note")}</p>
          </div>
        )}
        <Link to="/print" search={{ id: r.id }} className="btn-secondary mt-3 w-full text-sm"><Printer className="h-4 w-4" aria-hidden /> {t("print_referral")}</Link>
        <dl className="mt-3 divide-y divide-border text-sm">
          <Row k={t("referral_date")} v={formatDate(r.referralDate)} />
          {r.origin && <Row k={t("origin")} v={`${r.origin}${r.originType ? ` · ${facilityTypeLabel(r.originType, lang)}` : ""}`} />}
          <Row k={t("destination")} v={r.destination} />
          <Row k={t("facility_type")} v={facilityTypeLabel(r.facilityType, lang)} />
          <Row k={t("department")} v={r.department} />
          {r.journeyId && <Row k={t("journey_id")} v={r.journeyId} />}
          {r.facilityRef && <Row k="Chosen via facility finder" v={`${areaLabel(r.facilityRef.healthArea)} · ${serviceLabel(r.facilityRef.healthArea, r.facilityRef.serviceId)}${r.facilityRef.constraints.length ? ` · ${r.facilityRef.constraints.map(constraintLabel).join(", ")}` : ""} (illustrative data)`} />}
          {arrivalState(r) === "none" ? (
            <Row k="Follow-up due" v={`${formatDate(r.followUpDate)} · ${timingLabel(r)}`} />
          ) : (
            <Row k="Original follow-up date" v={formatDate(r.followUpDate)} />
          )}
          <Row k="Current status" v={r.outcome === "completed" ? "Completed" : r.outcome === "not_completed" ? "Not completed" : "Open"} />
          {r.context && <Row k="Context" v={r.context} />}
        </dl>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <span className="chip-demo"><CloudUpload className="h-3.5 w-3.5" aria-hidden /> Stored offline</span>
          <span className="text-sm text-muted-foreground">Stored locally on this device.</span>
        </div>
      </section>

      {(as === "verified" || as === "worker_confirmed") && (
        <section className="surface space-y-3 p-4">
          <h2 className="text-lg font-bold">{t("what_happened")}</h2>
          <p className="text-xs text-muted-foreground">{t("outcome_note")}</p>
          <div className="grid grid-cols-2 gap-2">
            {OUTCOMES.map((o) => (
              <button key={o.id} type="button" aria-pressed={r.referralOutcome === o.id}
                className={`${r.referralOutcome === o.id ? "btn-primary" : "btn-secondary"} h-auto py-3 text-sm`}
                onClick={() => chooseOutcome(o.id)}>
                {o.id === "refer_onward" && <RouteIcon className="h-4 w-4" aria-hidden />} {t(o.key)}
              </button>
            ))}
          </div>
          {r.referralOutcome === "refer_onward" && !hasOnward && (
            <Link to="/new" search={{ onward: r.id }} className="btn-ghost w-full text-sm">{t("oc_refer_onward")} →</Link>
          )}
        </section>
      )}

      {r.journeyId && <JourneyView r={r} all={referrals} />}

      {(r.patientReportedBarriers?.length ?? 0) > 0 && (
        <section className="surface p-4">
          <h2 className="text-lg font-bold">{t("patient_barriers")}</h2>
          <p className="text-xs text-muted-foreground">Reported by the patient through the simulated IVR menu. Operational only — not clinical triage. Destination is not changed automatically.</p>
          <ul className="mt-2 space-y-1.5">
            {r.patientReportedBarriers!.map((b, i) => (
              <li key={i} className="rounded-lg bg-attention-soft p-2 text-sm"><span className="font-semibold">{patientBarrierLabel(b.code, lang)}</span> <span className="text-xs text-muted-foreground">· IVR · {formatStamp(b.at)}</span></li>
            ))}
          </ul>
        </section>
      )}

      <section className="surface p-4">
        <h2 className="text-lg font-bold">Confirmed barriers</h2>
        {r.confirmedBarriers.length === 0 ? (
          <p className="mt-2 text-muted-foreground">{r.noBarrierConfirmed ? "No barrier confirmed" : "None recorded yet"}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {r.confirmedBarriers.map((b) => (
              <li key={b} className="flex items-center justify-between gap-2 rounded-xl bg-primary-soft p-3">
                <span>
                  <span className="block font-semibold">{barrierMeta(b).en}</span>
                  <span lang="hi" className="hindi block text-sm text-muted-foreground">{barrierMeta(b).hi}</span>
                </span>
                <span className="chip-human"><UserCheck className="h-3 w-3" aria-hidden />{r.isDemo ? "Demo — human-confirmed" : "Human confirmed"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Worker note</h2>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Smartphone className="h-3.5 w-3.5" aria-hidden /> Stored on this device</span>
        </div>
        {r.notes.length === 0 ? (
          <p className="mt-2 text-muted-foreground">No note.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {r.notes.map((n, i) => (
              <li key={i} className="rounded-xl bg-secondary p-3">
                <p lang="hi" className="hindi">{n.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatStamp(n.at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(r.plannedActions?.length ?? 0) > 0 && (
        <section className="surface p-4">
          <h2 className="text-lg font-bold">Planned follow-up actions</h2>
          <p className="text-xs text-muted-foreground">Chosen by the health worker from fixed prompts.</p>
          <ul className="mt-3 space-y-2">
            {r.plannedActions!.map((a, i) => (
              <li key={i} className="rounded-xl bg-secondary p-3 text-sm">
                <span className="font-medium">{a.action}</span>
                <span className="block text-xs text-muted-foreground">{barrierMeta(a.barrier).en} · {formatStamp(a.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.outcome !== "completed" && (
        <section className="surface space-y-3 p-4">
          <h2 className="text-lg font-bold">Update follow-up</h2>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary h-auto flex-col py-3 text-sm" onClick={() => updateReferral(r, { outcome: "completed" }, { type: "completed", at: now() })}>
              <CheckCircle2 className="h-5 w-5 text-success" aria-hidden /> Referral completed
            </button>
            <button type="button" className="btn-secondary h-auto flex-col py-3 text-sm" aria-expanded={mode === "notyet"} onClick={() => setMode(mode === "notyet" ? "none" : "notyet")}>
              <XCircle className="h-5 w-5 text-attention-foreground" aria-hidden /> Not yet completed
            </button>
            <button type="button" className="btn-secondary h-auto flex-col py-3 text-sm" onClick={() => updateReferral(r, {}, { type: "attempted", at: now() })}>
              <PhoneOutgoing className="h-5 w-5 text-primary" aria-hidden /> Follow-up attempted
            </button>
            <button type="button" className="btn-secondary h-auto flex-col py-3 text-sm" aria-expanded={mode === "reschedule"} onClick={() => setMode(mode === "reschedule" ? "none" : "reschedule")}>
              <CalendarClock className="h-5 w-5 text-primary" aria-hidden /> Reschedule follow-up
            </button>
          </div>
          {r.confirmedBarriers.length > 0 && (
            <button type="button" className="btn-secondary w-full text-sm" aria-expanded={mode === "support"} onClick={() => setMode(mode === "support" ? "none" : "support")}>
              <ClipboardList className="h-5 w-5 text-primary" aria-hidden /> Follow-up support
            </button>
          )}
          {mode === "support" && <FollowUpSupport r={r} onDone={() => setMode("none")} doneLabel="Close" />}

          {mode === "reschedule" && (
            <div className="flex items-end gap-2 rounded-xl bg-secondary p-3">
              <div className="flex-1">
                <label htmlFor="resched" className="field-label">New follow-up date</label>
                <input id="resched" type="date" className="field" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <button type="button" className="btn-primary" disabled={!newDate} onClick={() => { void updateReferral(r, { followUpDate: newDate }, { type: "rescheduled", at: now(), detail: `New date ${formatDate(newDate)}` }); setMode("none"); }}>
                Save
              </button>
            </div>
          )}

          {mode === "notyet" && (
            <div className="space-y-4 rounded-xl border border-border p-3">
              <BarrierReview note={note} setNote={setNote} review={review} setReview={setReview} />
              <button
                type="button"
                className="btn-primary w-full"
                disabled={!reviewComplete(review)}
                onClick={() => {
                  const at = now();
                  void updateReferral(
                    { ...r, history: [...r.history, { type: "not_completed", at }] },
                    {
                      outcome: "not_completed",
                      notes: note.trim() ? [...r.notes, { text: note.trim(), at }] : r.notes,
                      confirmedBarriers: review.noBarrier ? [] : review.confirmed,
                      noBarrierConfirmed: review.noBarrier,
                    },
                    { type: "barrier_review", at, detail: review.noBarrier ? "No barrier confirmed" : `${review.confirmed.length} barrier(s) confirmed` },
                  );
                  setMode("none");
                  setNote("");
                }}
              >
                Confirm & save
              </button>
            </div>
          )}
        </section>
      )}

      <SmsFollowUp r={r} />

      {r.outcome === "completed" && (
        <button type="button" className="btn-secondary w-full" onClick={() => updateReferral(r, { outcome: "open" }, { type: "rescheduled", at: now(), detail: "Reopened" })}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Reopen follow-up
        </button>
      )}

      <section className="surface p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold"><History className="h-5 w-5" aria-hidden /> Activity</h2>
        <ol className="mt-3 space-y-3 border-l-2 border-dashed border-primary/30 pl-4">
          {[...r.history].reverse().map((h, i) => (
            <li key={i} className="relative">
              <span aria-hidden className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="font-medium">{EVENT_LABEL[h.type]}</p>
              <p className="text-xs text-muted-foreground">{formatStamp(h.at)}{h.detail ? ` · ${h.detail}` : ""}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
