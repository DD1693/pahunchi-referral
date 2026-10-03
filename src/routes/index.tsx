import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, CheckCircle2, CloudUpload, Info, Plus } from "lucide-react";
import { useState } from "react";
import { ReferralCard } from "@/components/ReferralCard";
import { RouteLine } from "@/components/RouteMotif";
import { dueSoon, followUpQueue, needsFollowUp } from "@/lib/followup";
import { useReferrals } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pahunchi — Every referral deserves an answer" },
      { name: "description", content: "Track referral follow-ups offline. Small AI on device suggests non-clinical barriers; health workers confirm." },
      { property: "og:title", content: "Pahunchi — Every referral deserves an answer" },
      { property: "og:description", content: "Offline referral follow-up with on-device Small AI. AI suggests. Health workers confirm." },
    ],
  }),
  component: Home,
});

function Home() {
  const { loaded, referrals, error } = useReferrals();
  const [info, setInfo] = useState(false);
  const queue = followUpQueue(referrals);

  const stats = [
    { label: "Needs follow-up", value: referrals.filter((r) => needsFollowUp(r)).length, icon: AlertCircle, tone: "text-attention-foreground bg-attention-soft" },
    { label: "Due soon", value: referrals.filter((r) => dueSoon(r)).length, icon: CalendarClock, tone: "text-accent-foreground bg-primary-soft" },
    { label: "Completed", value: referrals.filter((r) => r.outcome === "completed").length, icon: CheckCircle2, tone: "text-success bg-success-soft" },
    { label: "Stored offline", value: referrals.length, icon: CloudUpload, tone: "text-muted-foreground bg-muted" },
  ];

  return (
    <div className="space-y-6">
      <section className="surface relative overflow-hidden p-5">
        <RouteLine className="pointer-events-none absolute inset-x-0 top-2 h-14 w-full opacity-80" />
        <div className="relative pt-12">
          <h1 className="text-3xl font-bold tracking-tight">Pahunchi</h1>
          <p className="mt-1 text-lg text-muted-foreground">Every referral deserves an answer.</p>
          <Link to="/new" className="btn-primary mt-5 w-full sm:w-auto">
            <Plus className="h-5 w-5" aria-hidden /> New referral
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

      <section aria-labelledby="queue-h" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="queue-h" className="text-xl font-bold">Follow-up queue</h2>
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
