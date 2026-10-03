import { createFileRoute } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { useState } from "react";
import { appointmentText, facilityById, facilityService, facilityTypeLabel, scheduleSummary, serviceLabel } from "@/lib/facilities/data";
import { arrivalState, formatDate } from "@/lib/followup";
import { useT } from "@/lib/i18n";
import { confirmWorkerArrival, useReferrals } from "@/lib/store";
import type { Referral } from "@/lib/types";

export const Route = createFileRoute("/basic-phone")({
  head: () => ({
    meta: [
      { title: "Basic Phone Worker Mode — Pahunchi" },
      { name: "description", content: "Simulated SMS workflow showing how a worker with a keypad phone could use Pahunchi. No real messages are sent." },
      { property: "og:title", content: "Basic Phone Worker Mode — Pahunchi" },
      { property: "og:description", content: "Demonstration of the SMS/USSD/IVR-style worker workflow. Simulation only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BasicPhone,
});

type Msg = { dir: "in" | "out"; text: string };

function createdMessage(r: Referral): string {
  const ref = r.facilityRef;
  const svc = ref ? facilityService(ref.facilityId, ref.healthArea, ref.serviceId) : undefined;
  const fac = ref ? facilityById(ref.facilityId) : undefined;
  return [
    "PAHUNCHI",
    `Referral ${r.referralCode} created.`,
    `Destination: ${r.destination}`,
    `Facility type: ${facilityTypeLabel(r.facilityType) || "Not recorded"}`,
    `Service: ${ref ? serviceLabel(ref.healthArea, ref.serviceId) : r.department || "—"}`,
    `Availability: ${ref ? scheduleSummary(svc) : "Contact facility"}`,
    `Appointment: ${appointmentText(svc)}`,
    `Contact: ${fac?.contact ?? "XXXXXXXXXX"}`,
    `Show referral code ${r.referralCode} at the facility.`,
  ].join("\n");
}

function statusMessage(r: Referral): string {
  const as = arrivalState(r);
  const status = as === "verified" ? "Arrival verified by facility" : as === "worker_confirmed" ? "Worker-confirmed arrival" : as === "patient_reported" ? "Patient reported arrival" : "Awaiting arrival";
  const ivrTried = (r.ivrEvents?.length ?? 0) > 0;
  const lines = [`${r.referralCode} update:`, `Status: ${status}`, `Expected visit: ${formatDate(r.followUpDate)}`];
  if (as === "none") {
    lines.push("Patient has not yet reported arrival.");
    lines.push(ivrTried ? "IVR follow-up attempted." : "Next follow-up: IVR");
    if (ivrTried || r.patientReportedBarriers?.length) lines.push("Worker follow-up recommended.");
  }
  return lines.join("\n");
}

function BasicPhone() {
  const t = useT();
  const { loaded, referrals } = useReferrals();
  const [id, setId] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const r = referrals.find((x) => x.id === id);

  const pick = (nid: string) => {
    setId(nid);
    const nr = referrals.find((x) => x.id === nid);
    setMsgs(nr ? [{ dir: "in", text: createdMessage(nr) }] : []);
  };

  async function confirm() {
    if (!r) return;
    const already = arrivalState(r) === "worker_confirmed" || arrivalState(r) === "verified";
    if (!already) await confirmWorkerArrival(r);
    setMsgs((m) => [...m, { dir: "out", text: `ARRIVED ${r.referralCode}` }, { dir: "in", text: already ? `${r.referralCode}\nArrival already confirmed. No change.` : `${r.referralCode}\nWorker-confirmed arrival recorded.` }]);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Demonstration</p>
        <h1 className="text-2xl font-bold uppercase">{t("basic_phone")}</h1>
        <p className="font-semibold text-attention-foreground">{t("basic_phone_sub")}</p>
        <p className="mt-1 text-sm text-muted-foreground">A keypad phone cannot run the full app. In deployment, a worker could receive structured SMS and reply with short commands. Facility selection stays a smartphone/supervisor task. No SMS gateway is contacted here.</p>
      </div>

      <div>
        <label htmlFor="bp-ref" className="field-label">Referral on this device</label>
        <select id="bp-ref" className="field" value={id} onChange={(e) => pick(e.target.value)} disabled={!loaded}>
          <option value="">{t("choose")}</option>
          {referrals.map((x) => <option key={x.id} value={x.id}>{x.referralCode} · {x.destination}</option>)}
        </select>
      </div>

      {r && (
        <div className="mx-auto max-w-xs rounded-[2rem] border-4 border-foreground/80 bg-card p-3">
          <p className="mb-2 flex items-center justify-center gap-1 text-xs text-muted-foreground"><Smartphone className="h-3.5 w-3.5" aria-hidden /> Simulated keypad phone</p>
          <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl bg-secondary p-2" aria-live="polite">
            {msgs.map((m, i) => (
              <pre key={i} className={`whitespace-pre-wrap rounded-lg p-2 font-mono text-xs ${m.dir === "in" ? "mr-6 bg-card" : "ml-6 bg-primary-soft text-right"}`}>{m.text}</pre>
            ))}
          </div>
          <div className="mt-2 grid gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={() => setMsgs((m) => [...m, { dir: "out", text: `STATUS ${r.referralCode}` }, { dir: "in", text: statusMessage(r) }])}>Check referral status</button>
            <button type="button" className="btn-secondary text-sm" onClick={confirm}>Confirm manual arrival</button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Simulation — no real SMS was sent or received.</p>
        </div>
      )}

      <section className="surface p-4 text-sm">
        <h2 className="font-bold">Works for every phone</h2>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>Smartphone worker → full Pahunchi</li>
          <li>Basic-phone worker → SMS/USSD/IVR-style interaction</li>
          <li>Patient with smartphone → SMS/IVR + optional smartphone access</li>
          <li>Patient with basic phone → SMS/IVR</li>
          <li>Patient with no phone → printed/written referral</li>
          <li>No internet → local Pahunchi keeps working</li>
          <li>Connectivity returns → data synchronises (simulated in this prototype)</li>
        </ul>
      </section>
    </div>
  );
}
