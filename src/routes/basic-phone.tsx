import { createFileRoute } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { useState } from "react";
import { HEALTH_AREAS, SERVICE_CATALOGUE, facilityById, type HealthArea } from "@/lib/facilities/data";
import { findFacilities, type Match } from "@/lib/facilities/match";
import { addDays, arrivalState, formatDate, todayISO } from "@/lib/followup";
import { useT } from "@/lib/i18n";
import { confirmWorkerArrival, findByCode, saveReferral, uid } from "@/lib/store";
import type { HistoryEvent, Referral } from "@/lib/types";

export const Route = createFileRoute("/basic-phone")({
  head: () => ({
    meta: [
      { title: "Basic Phone Access — Pahunchi" },
      { name: "description", content: "Simulation of a future SMS gateway workflow for workers with ordinary basic phones. No real SMS is sent." },
      { property: "og:title", content: "Basic Phone Access — Pahunchi" },
      { property: "og:description", content: "Create referral, check referral and confirm arrival by SMS-style menu. Simulation only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BasicPhone,
});

type Msg = { dir: "in" | "out"; text: string };
type Stage =
  | { s: "menu" }
  | { s: "area" }
  | { s: "service"; area: HealthArea }
  | { s: "facility"; area: HealthArea; serviceId: string; options: Match[] }
  | { s: "check" }
  | { s: "arrive" };

const MENU = "PAHUNCHI\n1 Create referral\n2 Check referral\n3 Confirm arrival";
const numbered = (xs: string[]) => xs.map((x, i) => `${i + 1} ${x}`).join("\n");

/** Minimal operational status only — no condition, service, barriers or notes. */
function statusText(r: Referral): string {
  const as = arrivalState(r);
  const status = as === "verified" ? "Arrival verified by facility" : as === "worker_confirmed" ? "Arrival confirmed by worker" : as === "patient_reported" ? "Patient reported arrival" : "Awaiting arrival";
  return `${r.referralCode}\nTo: ${r.destination}\nStatus: ${status}\nExpected visit: ${formatDate(r.followUpDate)}`;
}

function BasicPhone() {
  const t = useT();
  const [msgs, setMsgs] = useState<Msg[]>([{ dir: "in", text: MENU }]);
  const [stage, setStage] = useState<Stage>({ s: "menu" });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const reply = (out: string, inn: string, next: Stage) => {
    setMsgs((m) => [...m, { dir: "out", text: out }, { dir: "in", text: inn }]);
    setStage(next);
  };

  async function createReferral(area: HealthArea, serviceId: string, m: Match): Promise<Referral> {
    const now = new Date().toISOString();
    const service = SERVICE_CATALOGUE[area].find((x) => x.id === serviceId)?.label ?? serviceId;
    const history: HistoryEvent[] = [
      { type: "created", at: now, detail: "Basic phone SMS (simulated)" },
      { type: "facility_selected", at: now, detail: m.facility.name },
    ];
    return saveReferral({
      id: uid(),
      patientId: "",
      referralDate: todayISO(),
      destination: m.facility.name,
      department: service,
      followUpDate: addDays(todayISO(), 7),
      context: "",
      notes: [],
      confirmedBarriers: [],
      noBarrierConfirmed: false,
      facilityRef: { facilityId: m.facility.facilityId, healthArea: area, serviceId, constraints: [], matchedAt: now },
      facilityType: facilityById(m.facility.facilityId)?.facilityType,
      outcome: "open",
      syncState: "pending",
      isDemo: false,
      history,
      createdAt: now,
      updatedAt: now,
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const raw = input.trim();
    if (!raw || busy) return;
    setInput("");
    setBusy(true);
    try {
      if (raw === "0") return reply(raw, MENU, { s: "menu" });
      const n = Number(raw) - 1;
      switch (stage.s) {
        case "menu":
          if (raw === "1") return reply(raw, `Health area:\n${numbered(HEALTH_AREAS.map((a) => a.label))}\n0 Menu`, { s: "area" });
          if (raw === "2") return reply(raw, "Reply with referral code (PH-XXXX)\n0 Menu", { s: "check" });
          if (raw === "3") return reply(raw, "Reply with referral code to confirm arrival\n0 Menu", { s: "arrive" });
          return reply(raw, `Not recognised.\n${MENU}`, stage);
        case "area": {
          const a = HEALTH_AREAS[n];
          if (!a) return reply(raw, "Not recognised. Reply with a number.", stage);
          return reply(raw, `Service needed:\n${numbered(SERVICE_CATALOGUE[a.id].map((s) => s.label))}\n0 Menu`, { s: "service", area: a.id });
        }
        case "service": {
          const svc = SERVICE_CATALOGUE[stage.area][n];
          if (!svc) return reply(raw, "Not recognised. Reply with a number.", stage);
          const options = findFacilities(stage.area, svc.id, []).matches.filter((m) => m.availability !== "unavailable").slice(0, 3);
          if (!options.length) return reply(raw, "No available facility found for this service. Contact supervisor.\n0 Menu", { s: "menu" });
          return reply(raw, `Facilities (illustrative data):\n${numbered(options.map((m) => `${m.facility.name} ${m.facility.distanceKm}km`))}\n0 Menu`, { s: "facility", area: stage.area, serviceId: svc.id, options });
        }
        case "facility": {
          const m = stage.options[n];
          if (!m) return reply(raw, "Not recognised. Reply with a number.", stage);
          const r = await createReferral(stage.area, stage.serviceId, m);
          return reply(raw, `Referral ${r.referralCode} created.\nJourney ${r.journeyId}\nTo: ${r.destination}\nWrite code on patient's referral paper.\n0 Menu`, { s: "menu" });
        }
        case "check": {
          const r = await findByCode(raw);
          return reply(raw, r ? `${statusText(r)}\n0 Menu` : "Code not found on this device.\n0 Menu", r ? { s: "menu" } : stage);
        }
        case "arrive": {
          const r = await findByCode(raw);
          if (!r) return reply(raw, "Code not found on this device.\n0 Menu", stage);
          const as = arrivalState(r);
          if (as === "worker_confirmed" || as === "verified") return reply(raw, `${r.referralCode}\nArrival already confirmed. No change.\n0 Menu`, { s: "menu" });
          await confirmWorkerArrival(r);
          return reply(raw, `${r.referralCode}\nArrival confirmed by worker.\n0 Menu`, { s: "menu" });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="chip-demo">Simulation</span>
        <h1 className="mt-1 text-2xl font-bold">{t("basic_phone")}</h1>
        <p className="font-semibold text-attention-foreground">Simulation — future SMS gateway workflow</p>
        <p className="mt-1 text-sm text-muted-foreground">Designed for ordinary basic phones using cellular SMS. No mobile data or smartphone would be required on the worker’s phone. This prototype simulates the SMS gateway; no real SMS is sent.</p>
        <p className="mt-1 text-sm text-muted-foreground">The basic phone does not run the Facility Finder. In a real deployment, an SMS gateway and server would apply the same fixed-rule facility matching and send the menu back. Requires cellular coverage.</p>
      </div>

      <div className="mx-auto max-w-xs rounded-[2rem] border-4 border-foreground/80 bg-card p-3">
        <p className="mb-2 flex items-center justify-center gap-1 text-xs text-muted-foreground"><Smartphone className="h-3.5 w-3.5" aria-hidden /> Simulated basic phone — SMS</p>
        <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl bg-secondary p-2" aria-live="polite">
          {msgs.map((m, i) => (
            <pre key={i} className={`whitespace-pre-wrap rounded-lg p-2 font-mono text-xs ${m.dir === "in" ? "mr-6 bg-card" : "ml-6 bg-primary-soft text-right"}`}>{m.text}</pre>
          ))}
        </div>
        <form onSubmit={submit} className="mt-2 flex gap-2">
          <label htmlFor="bp-input" className="sr-only">SMS reply</label>
          <input id="bp-input" className="field flex-1 font-mono" autoComplete="off" value={input} onChange={(e) => setInput(e.target.value)} placeholder="1" />
          <button type="submit" className="btn-primary" disabled={!input.trim() || busy}>Send</button>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Simulation — no real SMS was sent or received.</p>
      </div>

      <p className="text-sm text-muted-foreground">No printer? The worker can write the referral code and destination on the patient’s existing paper referral.</p>

      <section className="surface space-y-2 p-4 text-sm">
        <h2 className="font-bold">Voice pathway</h2>
        <p className="text-muted-foreground">A future deployment could let a frontline worker call an ordinary telephone number over the cellular voice network — no mobile data or smartphone needed.</p>
        <p className="font-mono text-xs">ordinary cellular call → telephony gateway → Pahunchi server-side voice processing → Pahunchi workflow</p>
        <p className="font-semibold">Live telephony integration is not implemented in this prototype.</p>
      </section>
    </div>
  );
}
