import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Download, FileJson, FileSpreadsheet, Languages, ShieldCheck, Smartphone, Tags, UserCheck } from "lucide-react";
import { useState } from "react";
import { MODEL_INFO, modelReady } from "@/lib/sahaay";
import { useReferrals } from "@/lib/store";
import { BARRIERS, type Referral } from "@/lib/types";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Pahunchi" },
      { name: "description", content: "Operational referral follow-up counts and human-confirmed barriers, computed on this device." },
      { property: "og:title", content: "Referral follow-up insights — Pahunchi" },
      { property: "og:description", content: "Non-clinical, operational counts from locally stored referrals. Export JSON or CSV." },
    ],
  }),
  component: Insights,
});

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCSV(rs: Referral[]): string {
  const cols = ["patientId", "referralDate", "destination", "department", "followUpDate", "outcome", "confirmedBarriers", "noBarrierConfirmed", "syncState", "isDemo", "createdAt", "updatedAt", "notes"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = rs.map((r) =>
    [r.patientId, r.referralDate, r.destination, r.department, r.followUpDate, r.outcome, r.confirmedBarriers.join(";"), r.noBarrierConfirmed, r.syncState, r.isDemo, r.createdAt, r.updatedAt, r.notes.map((n) => n.text).join(" | ")].map(esc).join(","),
  );
  return "\uFEFF" + [cols.join(","), ...rows].join("\n");
}

function Insights() {
  const { loaded, referrals } = useReferrals();
  const [story, setStory] = useState(false);
  const completed = referrals.filter((r) => r.outcome === "completed").length;
  const counts = BARRIERS.map((b) => ({ ...b, n: referrals.filter((r) => r.confirmedBarriers.includes(b.label)).length }));
  const max = Math.max(1, ...counts.map((c) => c.n));
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Referral follow-up insights</h1>

      <section className="grid grid-cols-3 gap-3">
        {[["Total referrals", referrals.length], ["Completed referrals", completed], ["Outstanding referrals", referrals.length - completed]].map(([k, v]) => (
          <div key={k} className="surface p-3">
            <p className="text-2xl font-bold tabular-nums">{loaded ? v : "–"}</p>
            <p className="text-xs leading-tight text-muted-foreground">{k}</p>
          </div>
        ))}
      </section>

      <section className="surface space-y-3 p-4">
        <h2 className="text-lg font-bold">Confirmed barriers</h2>
        <ul className="space-y-3">
          {counts.map((c) => (
            <li key={c.label}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span><span className="font-semibold">{c.en}</span> <span lang="hi" className="hindi text-muted-foreground">· {c.hi}</span></span>
                <span className="font-bold tabular-nums">{c.n}</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(c.n / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          These counts reflect barriers confirmed by the health worker. They are not prevalence estimates.
        </p>
      </section>

      <section className="surface space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Download className="h-5 w-5" aria-hidden /> Export records</h2>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" disabled={!loaded} onClick={() => download(`pahunchi-referrals-${stamp}.json`, JSON.stringify(referrals, null, 2), "application/json")}>
            <FileJson className="h-5 w-5" aria-hidden /> JSON
          </button>
          <button type="button" className="btn-secondary" disabled={!loaded} onClick={() => download(`pahunchi-referrals-${stamp}.csv`, toCSV(referrals), "text/csv;charset=utf-8")}>
            <FileSpreadsheet className="h-5 w-5" aria-hidden /> CSV
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Files are created on this device. Structured export can support future health-information-system integration.
        </p>
      </section>

      <section className="surface space-y-4 p-4" aria-labelledby="about-ai">
        <h2 id="about-ai" className="text-lg font-bold">About the Small AI</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            [Cpu, "Offline text classifier"],
            [Tags, "5 non-clinical barrier categories"],
            [Languages, "Hindi, Roman Hindi & limited Hinglish prototype"],
            [Smartphone, "Runs on this device"],
            [UserCheck, "Human confirmation required"],
            [FileJson, "Model size: approximately 140 KB"],
          ].map(([Icon, t]) => {
            const I = Icon as typeof Cpu;
            return (
              <li key={t as string} className="flex items-center gap-3 rounded-xl bg-secondary p-3 text-sm font-medium">
                <I className="h-5 w-5 shrink-0 text-primary" aria-hidden /> {t as string}
              </li>
            );
          })}
        </ul>
        <p className="text-sm">
          Pahunchi uses a small on-device classifier to suggest non-clinical referral barriers from Hindi, Roman Hindi and
          limited Hinglish notes. Suggestions require health-worker confirmation. The model does not diagnose, recommend
          treatment or determine medical urgency.
        </p>
        <p className="text-sm text-muted-foreground">
          Inference happens on this device. The classifier helps structure non-clinical barrier information; its scores are
          not calibrated probabilities and are not shown.
        </p>
        <p className="rounded-xl bg-secondary p-3 text-sm">
          Referral records in this prototype are stored locally on this device. Pahunchi does not automatically send patient
          information to a server. Do not enter names, phone numbers, clinical results or other identifying information.
        </p>
        <p className="text-xs text-muted-foreground">
          Model: {MODEL_INFO.name} v{MODEL_INFO.version} · {modelReady() ? "loaded on this device" : "could not be loaded"}
        </p>
        <div className="rounded-xl border border-attention/40 bg-attention-soft p-3">
          <p className="font-semibold text-attention-foreground">Prototype limitation</p>
          <p className="mt-1 text-sm text-attention-foreground">
            This model was developed using a small synthetic dataset and has not been clinically or field validated. It is
            designed to demonstrate an offline referral-follow-up workflow. It identifies possible non-clinical barriers only and
            never diagnoses, triages or estimates medical risk.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> AI suggests. Health workers confirm.</p>
        <button type="button" className="btn-ghost -ml-3 min-h-10 px-3 text-sm" aria-expanded={story} onClick={() => setStory(!story)}>
          Why “Pahunchi”?
        </button>
        {story && (
          <p className="text-sm text-muted-foreground">
            Pahunchi means ‘Did she reach?’ — the question that can remain unanswered after a referral.
          </p>
        )}
      </section>
    </div>
  );
}
