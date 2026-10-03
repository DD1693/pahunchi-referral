import { Link } from "@tanstack/react-router";
import { ArrowDown, CheckCircle2, Clock } from "lucide-react";
import { facilityTypeLabel } from "@/lib/facilities/data";
import { arrivalState } from "@/lib/followup";
import { useLang, useT } from "@/lib/i18n";
import type { Referral } from "@/lib/types";

/** Compact, privacy-conscious journey: facility, type, code, arrival status only — no notes or barriers. */
export function JourneyView({ r, all }: { r: Referral; all: Referral[] }) {
  const t = useT();
  const lang = useLang();
  const legs = all.filter((x) => x.journeyId === r.journeyId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const first = legs[0];
  if (!first) return null;
  const arrivalLabel = (x: Referral) => {
    const s = arrivalState(x);
    return s === "verified" ? t("st_verified") : s === "worker_confirmed" ? t("st_worker") : s === "patient_reported" ? t("st_patient") : t("arr_awaiting");
  };

  return (
    <section className="surface p-4">
      <h2 className="text-lg font-bold">{t("referral_journey")}</h2>
      <p className="text-xs text-muted-foreground">{t("journey_id")} <span className="font-mono font-semibold">{r.journeyId}</span> · {t("journey_note")}</p>
      <ol className="mt-3 space-y-1">
        {first.origin && (
          <li className="rounded-lg bg-secondary p-2 text-sm">
            <span className="font-semibold">{first.origin}</span>
            {first.originType && <span className="text-muted-foreground"> · {facilityTypeLabel(first.originType, lang)}</span>}
          </li>
        )}
        {legs.map((x, i) => {
          const arrived = arrivalState(x) !== "none";
          return (
            <li key={x.id}>
              {(i > 0 || first.origin) && <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden />}
              <div className={`rounded-lg border p-2 text-sm ${x.id === r.id ? "border-primary" : "border-border"}`}>
                <p className="font-semibold">{x.destination}{x.facilityType && <span className="font-normal text-muted-foreground"> · {facilityTypeLabel(x.facilityType, lang)}</span>}</p>
                <p className="flex items-center gap-1.5 text-xs">
                  {arrived ? <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden /> : <Clock className="h-3.5 w-3.5" aria-hidden />}
                  {arrivalLabel(x)}
                  {x.referralOutcome && <span className="text-muted-foreground"> · {t(`oc_${x.referralOutcome}` as "oc_other")}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {x.id === r.id ? <span className="font-mono">{x.referralCode}</span> : <Link to="/referral" search={{ id: x.id }} className="font-mono underline">{x.referralCode}</Link>}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
