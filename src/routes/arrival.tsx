import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Info, Search } from "lucide-react";
import { useState } from "react";
import { ArrivalStatus } from "@/components/ReferralCode";
import { formatDate } from "@/lib/followup";
import { confirmFacilityArrival, findByCode, useReferrals } from "@/lib/store";
import type { Referral } from "@/lib/types";

export const Route = createFileRoute("/arrival")({
  head: () => ({
    meta: [
      { title: "Confirm arrival — Pahunchi" },
      { name: "description", content: "Receiving facility confirms a patient's arrival using a referral code, on this device." },
      { property: "og:title", content: "Confirm arrival — Pahunchi" },
      { property: "og:description", content: "Enter a referral code to confirm arrival at the referred facility." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfirmArrival,
});

function ConfirmArrival() {
  const { referrals } = useReferrals(); // keeps the store loaded/backfilled
  const [code, setCode] = useState("");
  const [foundId, setFoundId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const r: Referral | undefined = foundId ? referrals.find((x) => x.id === foundId) : undefined;
  const verified = r?.arrivals?.some((a) => a.type === "facility_verified_arrival");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    const hit = await findByCode(code);
    setFoundId(hit?.id ?? null);
    setNotFound(!hit);
  }

  async function confirm() {
    if (!r) return;
    setBusy(true);
    await confirmFacilityArrival(r);
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Receiving facility</p>
        <h1 className="text-2xl font-bold">Confirm arrival</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the referral code from the paper referral.</p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="code" className="sr-only">Referral code</label>
          <input id="code" className="field font-mono uppercase tracking-widest" placeholder="PH-7F3K" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" disabled={!code.trim()}>
          <Search className="h-5 w-5" aria-hidden /> Search
        </button>
      </form>

      {notFound && (
        <div role="status" className="surface space-y-2 p-4">
          <p className="font-semibold">Referral not found on this device.</p>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Only referrals stored on this device can be found. Looking up referrals from another device will need synchronisation or the future SMS link, which are not available yet.
          </p>
        </div>
      )}

      {r && (
        <section className="surface space-y-4 p-4" aria-live="polite">
          <div>
            <p className="eyebrow">Referral code</p>
            <p className="font-mono text-2xl font-bold tracking-widest">{r.referralCode}</p>
          </div>
          {/* Minimum needed to verify: ID, destination, referral date. No notes, barriers or context. */}
          <dl className="divide-y divide-border text-sm">
            <div className="flex justify-between py-2"><dt className="text-muted-foreground">Patient ID</dt><dd className="font-mono font-medium">{r.patientId}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-muted-foreground">Referred to</dt><dd className="font-medium">{r.destination}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-muted-foreground">Referral date</dt><dd className="font-medium">{formatDate(r.referralDate)}</dd></div>
          </dl>
          <ArrivalStatus r={r} />
          {!verified && (
            <>
              <p className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
                Confirms arrival at the referred facility only. It does not record diagnosis or treatment completion.
              </p>
              <button type="button" className="btn-primary w-full" disabled={busy} onClick={confirm}>
                <Building2 className="h-5 w-5" aria-hidden /> Confirm arrival at facility
              </button>
            </>
          )}
          <Link to="/referral" search={{ id: r.id }} className="btn-ghost w-full text-sm">Open referral</Link>
        </section>
      )}
    </div>
  );
}
