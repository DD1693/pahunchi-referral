import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { ReferralCard } from "@/components/ReferralCard";
import { followUpQueue, needsFollowUp, todayISO } from "@/lib/followup";
import { useReferrals } from "@/lib/store";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — Pahunchi" },
      { name: "description", content: "All referrals stored on this device, with follow-up status and confirmed barriers." },
      { property: "og:title", content: "Referrals — Pahunchi" },
      { property: "og:description", content: "Search and filter locally stored referrals by follow-up status." },
    ],
  }),
  component: Referrals,
});

const FILTERS = ["Needs follow-up", "Upcoming", "Completed", "All"] as const;
type Filter = (typeof FILTERS)[number];

function Referrals() {
  const { loaded, referrals } = useReferrals();
  const [filter, setFilter] = useState<Filter>("Needs follow-up");
  const [q, setQ] = useState("");
  const t = todayISO();

  let list = referrals;
  if (filter === "Needs follow-up") list = followUpQueue(referrals.filter((r) => needsFollowUp(r, t)));
  else if (filter === "Upcoming") list = followUpQueue(referrals.filter((r) => r.outcome !== "completed" && r.followUpDate > t));
  else if (filter === "Completed") list = referrals.filter((r) => r.outcome === "completed");
  if (q.trim()) list = list.filter((r) => r.patientId.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Referrals</h1>
      <div className="relative">
        <label htmlFor="search" className="sr-only">Search by Patient ID</label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input id="search" className="field pl-12" placeholder="Search by Patient ID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div role="tablist" aria-label="Filter referrals" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${filter === f ? "bg-primary text-primary-foreground" : "border border-input bg-card text-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>
      {!loaded ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <p className="surface p-6 text-center text-muted-foreground">No referrals here.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id}>
              <ReferralCard r={r} showSync />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
