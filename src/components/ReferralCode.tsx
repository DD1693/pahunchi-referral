import { Building2, Clock } from "lucide-react";
import { formatStamp } from "@/lib/followup";
import type { ArrivalType, Referral } from "@/lib/types";

export function ReferralCodeCard({ code }: { code?: string }) {
  if (!code) return null;
  return (
    <div className="rounded-xl border border-primary/30 bg-primary-soft p-3">
      <p className="eyebrow">Referral code</p>
      <p className="font-mono text-2xl font-bold tracking-widest">{code}</p>
      <p className="mt-1 text-xs text-muted-foreground">Use this code to track the referral without sharing clinical details.</p>
    </div>
  );
}

const ARRIVAL_LABEL: Record<ArrivalType, string> = {
  facility_verified_arrival: "Facility-verified arrival",
  patient_reported_arrival: "Patient-reported arrival",
};

/** Lists every arrival confirmation; both types may coexist. */
export function ArrivalStatus({ r }: { r: Referral }) {
  const arrivals = r.arrivals ?? [];
  if (arrivals.length === 0)
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" aria-hidden /> Awaiting arrival confirmation
      </p>
    );
  return (
    <ul className="space-y-1.5">
      {arrivals.map((a, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          <span>
            <span className="font-semibold text-success">{ARRIVAL_LABEL[a.type]}</span>
            <span className="block text-xs text-muted-foreground">{formatStamp(a.at)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
