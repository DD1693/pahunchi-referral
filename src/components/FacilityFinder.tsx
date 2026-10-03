import { Building2, ChevronDown, Info, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { DATA_LABEL, HEALTH_AREAS, SERVICE_CATALOGUE, serviceLabel, type HealthArea } from "@/lib/facilities/data";
import { OTHER_CHIPS, TIME_CHIPS, suggestConstraints, type ConstraintId } from "@/lib/facilities/constraints";
import { AVAILABILITY_LABEL, findFacilities, whyNotCloser, type Availability } from "@/lib/facilities/match";
import type { FacilityRef } from "@/lib/types";

const BADGE: Record<Availability, string> = {
  confirmed: "chip-human",
  not_recent: "chip-pending",
  unknown: "chip-demo",
  unavailable: "chip-demo line-through",
};

/** Reusable finder: health area → service → worker-confirmed constraints → ranked options. Worker chooses. */
export function FacilityFinder({ onChoose, chosenId }: { onChoose: (ref: FacilityRef, name: string, service: string) => void; chosenId?: string | undefined }) {
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState<HealthArea | "">("");
  const [serviceId, setServiceId] = useState("");
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<ConstraintId[]>([]);
  const suggested = useMemo(() => suggestConstraints(text), [text]);
  const result = area && serviceId ? findFacilities(area, serviceId, picked) : null;

  const toggle = (id: ConstraintId) => {
    const isTime = TIME_CHIPS.some((c) => c.id === id);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p.filter((x) => !(isTime && TIME_CHIPS.some((c) => c.id === x))), id]));
  };
  const Chip = ({ id, label }: { id: ConstraintId; label: string }) => {
    const on = picked.includes(id);
    const sug = !on && suggested.includes(id);
    return (
      <button type="button" aria-pressed={on} onClick={() => toggle(id)}
        className={`min-h-10 rounded-full border px-3 text-sm ${on ? "border-primary bg-primary-soft font-semibold text-accent-foreground" : sug ? "border-dashed border-attention bg-attention-soft" : "border-input bg-card"}`}>
        {label}{sug && <span className="ml-1 text-xs">· Suggested — please confirm</span>}
      </button>
    );
  };

  return (
    <div className="surface p-3">
      <button type="button" className="flex w-full items-center justify-between text-left font-semibold" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden /> Find a referral facility <span className="font-normal text-muted-foreground">(optional)</span></span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          <p className="rounded-lg bg-secondary p-2 text-xs text-secondary-foreground">
            Pahunchi suggests. The health worker chooses. You select the service needed — Pahunchi does not diagnose or decide treatment. Options are sorted with fixed rules, not AI. <strong>{DATA_LABEL}</strong> — not live availability.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ff-area" className="field-label">Health area</label>
              <select id="ff-area" className="field" value={area} onChange={(e) => { setArea(e.target.value as HealthArea); setServiceId(""); }}>
                <option value="">Choose…</option>
                {HEALTH_AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ff-svc" className="field-label">Service needed</label>
              <select id="ff-svc" className="field" value={serviceId} disabled={!area} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Choose…</option>
                {area && SERVICE_CATALOGUE[area].map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Illustrative prototype service list — not a clinical referral protocol.</p>

          {serviceId && (
            <>
              <div>
                <label htmlFor="ff-text" className="field-label">Anything else that matters for this referral? <span className="font-normal text-muted-foreground">(optional, logistics only)</span></label>
                <textarea id="ff-text" rows={2} className="field py-3" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. She can travel tomorrow morning but cannot afford repeated trips." />
                <p className="mt-1 text-xs text-muted-foreground">Keyword matching only highlights chips below. Nothing counts until you tap it.</p>
              </div>
              <div>
                <p className="field-label">Practical constraints (confirmed by you)</p>
                <div className="flex flex-wrap gap-2">
                  {TIME_CHIPS.map((c) => <Chip key={c.id} {...c} />)}
                  {OTHER_CHIPS.map((c) => <Chip key={c.id} {...c} />)}
                </div>
                {picked.includes("accompaniment") && <p className="mt-1 text-xs text-muted-foreground">Accompaniment is noted but does not change the order.</p>}
              </div>
            </>
          )}

          {result && area && (
            <div className="space-y-3">
              {result.matches.map((m, i) => {
                const why = i === 0 ? whyNotCloser(m, result.matches, result.timeLabel, picked) : null;
                const chosen = chosenId === m.facility.facilityId;
                return (
                  <div key={m.facility.facilityId} className={`rounded-xl border p-3 ${chosen ? "border-primary" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {i === 0 && m.availability !== "unavailable" && <p className="eyebrow">Suggested option</p>}
                        <p className="font-semibold">{m.facility.name} — {m.facility.distanceKm} km</p>
                        <p className="text-xs text-muted-foreground">{m.facility.level} · ~{m.facility.travelTimeMin} min · {m.facility.transportNote}</p>
                      </div>
                      <span className={BADGE[m.availability]}>{AVAILABILITY_LABEL[m.availability]}</span>
                    </div>
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer font-medium">Why this option?</summary>
                      <ul className="mt-1 list-disc pl-5 text-muted-foreground">{m.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                    </details>
                    {why && (
                      <p className="mt-2 flex gap-1.5 text-sm"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span><strong>Why not the closer facility?</strong> {why}</span></p>
                    )}
                    {m.availability === "unavailable" ? (
                      <p className="mt-2 rounded-lg bg-secondary px-3 py-2.5 text-center text-sm font-medium text-secondary-foreground">Currently unavailable — cannot be selected</p>
                    ) : (
                      <button type="button" className={`${chosen ? "btn-primary" : "btn-secondary"} mt-2 w-full text-sm`}
                        onClick={() => onChoose({ facilityId: m.facility.facilityId, healthArea: area, serviceId, constraints: picked, matchedAt: new Date().toISOString() }, m.facility.name, serviceLabel(area, serviceId))}>
                        <Building2 className="h-4 w-4" aria-hidden /> {chosen ? "Chosen — fills the form below" : "Use this facility"}
                      </button>
                    )}
                  </div>
                );
              })}
              {result.notOffered.length > 0 && (
                <p className="text-sm text-muted-foreground">Does not offer this service: {result.notOffered.map((f) => f.name).join(", ")}</p>
              )}
              <p className="text-xs text-muted-foreground">{DATA_LABEL}. Always confirm with the facility.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
