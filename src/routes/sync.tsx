import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, RefreshCw, WifiOff } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { simulateSync, useReferrals } from "@/lib/store";

export const Route = createFileRoute("/sync")({
  head: () => ({
    meta: [
      { title: "Simulated sync — Pahunchi" },
      { name: "description", content: "Demonstration of how local referral changes would synchronise when connectivity returns. No server is contacted." },
      { property: "og:title", content: "Simulated sync — Pahunchi" },
      { property: "og:description", content: "Offline changes, minimum-necessary sync fields and a clearly labelled reconnect simulation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SyncDemo,
});

const SYNC_FIELDS = ["Journey ID", "Referral ID / code", "Origin facility + type", "Destination facility + type", "Referral date", "Service", "Arrival status", "Operational referral outcome", "Onward referral link", "Timestamps", "Sync metadata"];
const NEVER = ["Diagnosis", "Treatment details", "Full clinical notes", "Unrelated barrier history"];

function SyncDemo() {
  const t = useT();
  const { referrals } = useReferrals();
  const [done, setDone] = useState(false);
  const pending = referrals.filter((r) => r.syncState === "pending");
  const journeys = new Set(pending.map((r) => r.journeyId).filter(Boolean));

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">SIMULATION</p>
        <h1 className="text-2xl font-bold">{t("sim_sync")}</h1>
        <p className="font-semibold text-attention-foreground">{t("sim_sync_sub")}</p>
        <p className="mt-1 text-sm text-muted-foreground">This prototype has no central server. In deployment, each facility keeps working locally; when connectivity returns, local changes upload and journey updates from other facilities download. Until then a facility's view may be temporarily out of date.</p>
      </div>

      <section className="surface space-y-3 p-4">
        <h2 className="font-bold">Offline changes: {pending.length}</h2>
        <ul className="space-y-1 text-sm">
          {pending.slice(0, 12).map((r) => (
            <li key={r.id}>• {r.referralCode} {r.parentReferralId ? "created (onward)" : "updated"}{r.journeyId ? ` · Journey ${r.journeyId}` : ""}</li>
          ))}
          {journeys.size > 0 && <li className="text-muted-foreground">{journeys.size} journey(s) affected</li>}
        </ul>
        {!done ? (
          <>
            <p className="flex items-center gap-2 text-sm"><WifiOff className="h-4 w-4" aria-hidden /> Status: Waiting for connection (simulated)</p>
            <button type="button" className="btn-primary w-full" disabled={pending.length === 0} onClick={async () => { await simulateSync(referrals); setDone(true); }}>
              <RefreshCw className="h-5 w-5" aria-hidden /> Simulate reconnect
            </button>
          </>
        ) : (
          <div role="status" className="rounded-xl bg-success-soft p-3 text-sm text-success">
            <p className="font-bold">SYNC SIMULATED</p>
            <p className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" aria-hidden /> Local changes prepared for upload</p>
            <p className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" aria-hidden /> Latest journey updates received (simulated — no other facility data exists in this prototype)</p>
            <p className="mt-1 text-xs">No network request was made. No central server was contacted.</p>
          </div>
        )}
      </section>

      <section className="surface p-4 text-sm">
        <h2 className="font-bold">Intended architecture</h2>
        <p className="mt-2 font-mono text-xs leading-6">Facility A local Pahunchi → local event storage → connectivity returns → central Pahunchi server → other facility updates → Facility A pulls updates → local view reflects latest journey state</p>
        <h3 className="mt-3 font-semibold">Would sync (minimum necessary)</h3>
        <p className="text-muted-foreground">{SYNC_FIELDS.join(" · ")}</p>
        <h3 className="mt-3 font-semibold">Would never sync</h3>
        <p className="text-muted-foreground">{NEVER.join(" · ")}</p>
      </section>
    </div>
  );
}
