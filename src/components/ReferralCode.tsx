import { Building2, Clock } from "lucide-react";
import { formatStamp } from "@/lib/followup";
import type { ArrivalType, Referral } from "@/lib/types";
import { useT, type TKey } from "@/lib/i18n";

export function ReferralCodeCard({ code }: { code?: string | undefined }) {
  if (!code) return null;
  return (
    <div className="rounded-xl border border-primary/30 bg-primary-soft p-3">
      <p className="eyebrow">Referral code</p>
      <p className="font-mono text-2xl font-bold tracking-widest">{code}</p>
      <p className="mt-1 text-xs text-muted-foreground">Use this code to track the referral without sharing clinical details.</p>
    </div>
  );
}

const ARRIVAL_LABEL: Record<ArrivalType, TKey> = {
  facility_verified_arrival: "arr_facility",
  patient_reported_arrival: "arr_patient",
  worker_confirmed_arrival: "arr_worker",
};
const SOURCE: Record<string, string> = { sms: "SMS", ivr: "IVR", worker: "worker" };

/** Lists every arrival confirmation; both types may coexist. */
export function ArrivalStatus({ r }: { r: Referral }) {
  const t = useT();
  const arrivals = r.arrivals ?? [];
  if (arrivals.length === 0)
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" aria-hidden /> {t("arr_awaiting")}
      </p>
    );
  return (
    <ul className="space-y-1.5">
      {arrivals.map((a, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          <span>
            <span className="font-semibold text-success">{t(ARRIVAL_LABEL[a.type])}</span>
            <span className="block text-xs text-muted-foreground">{formatStamp(a.at)}{a.source ? ` · ${SOURCE[a.source]}` : ""}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
