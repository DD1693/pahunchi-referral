import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { appointmentText, facilityById, facilityService, facilityTypeLabel, scheduleSummary, serviceBilingual } from "@/lib/facilities/data";
import { formatDate } from "@/lib/followup";
import { useT } from "@/lib/i18n";
import { useReferrals } from "@/lib/store";

export const Route = createFileRoute("/print")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s["id"] === "string" ? s["id"] : "" }),
  head: () => ({
    meta: [
      { title: "Printable referral — Pahunchi" },
      { name: "description", content: "Minimum-necessary printable referral slip with the referral code and facility details." },
      { property: "og:title", content: "Printable referral — Pahunchi" },
      { property: "og:description", content: "Print a referral slip offline using the device's own browser and printer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrintReferral,
});

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-3 border-b border-border py-2 text-sm">
      <dt className="font-semibold">{k}</dt>
      <dd>{v || "—"}</dd>
    </div>
  );
}

function PrintReferral() {
  const { id } = Route.useSearch();
  const { loaded, referrals } = useReferrals();
  const t = useT();
  const r = referrals.find((x) => x.id === id);
  if (!loaded) return <p className="text-muted-foreground">Loading…</p>;
  if (!r) return <p className="surface p-6 text-center">This referral was not found on this device.</p>;

  const ref = r.facilityRef;
  const fac = ref ? facilityById(ref.facilityId) : undefined;
  const svc = ref ? facilityService(ref.facilityId, ref.healthArea, ref.serviceId) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 print:hidden">
        <Link to="/referral" search={{ id: r.id }} className="btn-ghost min-h-10 px-3 text-sm"><ArrowLeft className="h-4 w-4" aria-hidden /> Back</Link>
        <button type="button" className="btn-primary flex-1" onClick={() => window.print()}><Printer className="h-5 w-5" aria-hidden /> {t("print_referral")}</button>
      </div>
      <p className="text-xs text-muted-foreground print:hidden">Works offline — uses this device's browser and printer. No printer? Write the referral code on the existing paper referral.</p>

      {/* Minimum necessary: no diagnosis, barrier notes or clinical notes. */}
      <article className="surface space-y-3 p-5 print:border-0 print:p-0 print:shadow-none">
        <h1 className="text-xl font-bold tracking-wide">PAHUNCHI REFERRAL</h1>
        <div className="rounded-xl border-2 border-foreground p-3 text-center">
          <p className="text-sm font-semibold">Referral code</p>
          <p className="font-mono text-3xl font-bold tracking-widest">{r.referralCode}</p>
        </div>
        <dl>
          <Line k="Referred to" v={r.destination} />
          <Line k="Facility type" v={facilityTypeLabel(r.facilityType)} />
          <Line k="Address" v={fac?.address ?? "Ask the health worker"} />
          <Line k="Service" v={ref ? serviceBilingual(ref.healthArea, ref.serviceId) : r.department} />
          <Line k="Department" v={r.department} />
          <Line k="Service availability" v={ref ? scheduleSummary(svc) : "Contact facility"} />
          <Line k="Last confirmed" v={svc?.lastUpdated ? formatDate(svc.lastUpdated) : "Not known"} />
          <Line k="Appointment" v={appointmentText(svc)} />
          <Line k="Facility contact" v={fac?.contact ?? "Not recorded"} />
          <Line k="Referral date" v={formatDate(r.referralDate)} />
        </dl>
        <p className="font-semibold">Please show this referral code at the referral facility.</p>
        <p lang="hi" className="hindi">कृपया रेफरल केंद्र पर यह रेफरल कोड दिखाएँ।</p>
        <p className="text-sm">Receiving Pahunchi facilities can use this referral code to confirm arrival.</p>
        {ref && <p className="text-xs text-muted-foreground">Facility details: illustrative synthetic data — always confirm with the facility.</p>}
      </article>
    </div>
  );
}
