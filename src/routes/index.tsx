import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, CheckCircle2, CloudUpload, Info, Plus, RefreshCw, Smartphone, UserCheck } from "lucide-react";
import { useState } from "react";
import { ReferralCard } from "@/components/ReferralCard";
import { RouteLine } from "@/components/RouteMotif";
import { displayStatus, dueSoon, followUpQueue, formatDate, needsAttention, needsFollowUp, type AttentionReason } from "@/lib/followup";
import { confirmWorkerArrival, useReferrals } from "@/lib/store";
import { useLang, useT, type TKey } from "@/lib/i18n";
import { facilityTypeLabel } from "@/lib/facilities/data";
import { patientBarrierLabel } from "@/lib/ivr";
import { STATUS_KEY } from "@/components/ReferralCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pahunchi — Every referral deserves an answer" },
      { name: "description", content: "Track referral follow-ups offline. Small AI on device suggests non-clinical barriers; health workers confirm." },
      { property: "og:title", content: "Pahunchi — Every referral deserves an answer" },
      { property: "og:description", content: "Offline referral follow-up with on-device Small AI. AI suggests. Health workers confirm." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const { loaded, referrals, error } = useReferrals();
  const [info, setInfo] = useState(false);
  const queue = followUpQueue(referrals);
  const t = useT();
  const lang = useLang();
  const attention = needsAttention(referrals);
  const REASON: Record<AttentionReason, TKey> = { barrier: "na_barrier", missed: "na_missed", unconfirmed: "na_unconfirmed" };

  const stats = [
    { label: t("needs_followup"), value: referrals.filter((r) => needsFollowUp(r)).length, icon: AlertCircle, tone: "text-attention-foreground bg-attention-soft" },
    { label: t("due_soon"), value: referrals.filter((r) => dueSoon(r)).length, icon: CalendarClock, tone: "text-accent-foreground bg-primary-soft" },
    { label: t("completed"), value: referrals.filter((r) => r.outcome === "completed").length, icon: CheckCircle2, tone: "text-success bg-success-soft" },
    { label: t("stored_offline"), value: referrals.length, icon: CloudUpload, tone: "text-muted-foreground bg-muted" },
  ];

  return (
    <div className="space-y-6">
      <section className="surface relative overflow-hidden p-5">
        <RouteLine className="pointer-events-none absolute inset-x-0 top-2 h-14 w-full opacity-80" />
        <div className="relative pt-12">
          <h1 className="text-3xl font-bold tracking-tight">Pahunchi</h1>
          <p className="mt-1 text-lg text-muted-foreground">{t("tagline")}</p>
          <Link to="/new" className="btn-primary mt-5 w-full sm:w-auto">
            <Plus className="h-5 w-5" aria-hidden /> {t("new_referral")}
          </Link>
        </div>
      </section>

      {error && <p role="alert" className="rounded-xl bg-destructive-soft p-3 text-destructive">{error}</p>}

      <section aria-label="Summary" className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="surface p-4">
            <span className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-3xl font-bold tabular-nums">{loaded ? value : "–"}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="na-h" className="surface space-y-3 p-4">
        <h2 id="na-h" className="text-xl font-bold">{t("needs_attention")} — {loaded ? attention.length : "–"}</h2>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {(["barrier", "missed", "unconfirmed"] as const).map((k) => (
            <div key={k} className="rounded-lg bg-secondary p-2">
              <p className="text-xl font-bold tabular-nums">{attention.filter((a) => a.reason === k).length}</p>
              <p>{t(REASON[k])}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("na_note")} Escalation: expected visit missed → IVR first → SMS after 24 hours → worker follow-up (IVR/SMS simulated).</p>
        {loaded && attention.length === 0 && <p className="text-sm text-muted-foreground">{t("na_empty")}</p>}
        <ul className="space-y-2">
          {attention.map(({ r, reason }) => {
            const b = r.patientReportedBarriers?.at(-1);
            return (
              <li key={r.id} className="rounded-xl border border-border p-3 text-sm">
                <Link to="/referral" search={{ id: r.id }} className="block">
                  <p className="flex flex-wrap items-center gap-2"><span className="font-mono font-bold">{r.referralCode}</span><span className="chip bg-attention-soft text-attention-foreground">{t(REASON[reason])}</span></p>
                  <p className="text-muted-foreground">{r.destination}{r.facilityType ? ` · ${facilityTypeLabel(r.facilityType, lang)}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{t("expected")}: {formatDate(r.followUpDate)} · {t(STATUS_KEY[displayStatus(r)])}</p>
                  {b && <p className="text-xs font-semibold">{t("na_barrier")}: {patientBarrierLabel(b.code, lang)}</p>}
                </Link>
                <button type="button" className="btn-ghost mt-1 min-h-9 px-2 text-xs" onClick={() => confirmWorkerArrival(r)}>
                  <UserCheck className="h-4 w-4" aria-hidden /> {t("confirm_manual")}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label={t("more_tools")} className="grid grid-cols-2 gap-3">
        <Link to="/basic-phone" className="surface flex items-center gap-2 p-3 text-sm font-semibold"><Smartphone className="h-5 w-5 text-primary" aria-hidden /> {t("basic_phone")}</Link>
        <Link to="/sync" className="surface flex items-center gap-2 p-3 text-sm font-semibold"><RefreshCw className="h-5 w-5 text-primary" aria-hidden /> {t("sim_sync")}</Link>
      </section>

      <section aria-labelledby="queue-h" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="queue-h" className="text-xl font-bold">{t("followup_queue")}</h2>
          <button
            type="button"
            onClick={() => setInfo(!info)}
            aria-expanded={info}
            aria-controls="priority-info"
            className="btn-ghost min-h-10 px-3 text-sm"
          >
            <Info className="h-4 w-4" aria-hidden /> Follow-up priority
          </button>
        </div>
        {info && (
          <p id="priority-info" className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
            Follow-up order is based on referral and follow-up dates. Confirmed barriers provide context; they do not determine medical urgency.
          </p>
        )}
        {!loaded ? (
          <p className="text-muted-foreground">Loading saved referrals…</p>
        ) : queue.length === 0 ? (
          <p className="surface p-6 text-center text-muted-foreground">No active follow-ups. Every referral has an answer.</p>
        ) : (
          <ul className="space-y-3">
            {queue.map((r) => (
              <li key={r.id}>
                <ReferralCard r={r} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="pb-2 text-center text-sm text-muted-foreground">Small AI. On device. Human in control.</p>
    </div>
  );
}
