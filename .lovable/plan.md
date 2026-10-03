# Find a referral facility — architecture proposal (no code yet)

Principle: **Pahunchi suggests. The health worker chooses.** Matching is a deterministic filter and sort, never presented as AI.

## 1. Current state
- Destination is a free-text `destination: string` plus `department: string` on `Referral`.
- `src/routes/new.tsx` has a hard-coded `FACILITIES` list of 3 generic names, offered as a datalist and quick-pick chips in Step 1, alongside patient ID, dates and context.
- Step 2 is the Hindi barrier note, classifier, human confirmation, save, referral code and follow-up support.
- Destination appears in the referral card, the referral detail page, arrival verification (`/arrival`) and the CSV export. Nothing structured about facilities exists yet.

## 2. Where it goes
Add an optional "Find a referral facility" panel inside Step 1, directly above the Destination field. Choosing a facility fills `destination` (and `department` with the service name). The free-text field stays, so the existing flow works unchanged if the panel isn't used. No new page or navigation item.

## 3. Can the barrier classifier help? No — not safely.
- It was trained on 160 synthetic post-referral barrier notes and has 5 labels (access_cost, household_constraint, fear_hesitancy, work_caregiving, understanding_information).
- It cannot read timing or day ("tomorrow morning"), accompaniment windows, "only one trip", or appointment constraints. It has no slots for these, and its features are word and character n-grams with no notion of time.
- Its thresholds were calibrated for "barrier present in a follow-up note". A pre-referral sentence is a different input distribution, so its suggestions would be uncalibrated.
- Mapping access_cost to "cost/travel constraint" would also be ambiguous: one label merges distance and money, and ranking needs them separate.
- Reusing it would quietly change what its labels mean and weaken the honesty of the existing barrier feature.
- Doing this properly would need a separate small slot-extraction model trained on a constraint dataset. Out of scope for the hackathon.

## 4. Recommended constraint approach (hackathon)
- **Primary:** worker-tapped constraint chips (time, cost and trips, travel, accompaniment, appointment). Nothing affects ranking until the worker selects it.
- **Optional:** the free-text box "Anything else that matters for this referral?" with a small **deterministic** Hindi/English keyword extractor (for example कल सुबह / tomorrow morning, एक ही बार / one trip, पति साथ / husband accompanies).
  - It only **pre-highlights chips as "Suggested — please confirm"**. Nothing counts until tapped.
  - It is clearly labelled as keyword matching, not AI.
- The classifier is not called here.

## 5. Data schema (bundled, read-only)
```text
Facility { facilityId, name, level, distanceKm, travelTimeMin, transportNote, dataSource }
FacilityService {
  facilityId, healthArea, serviceId,
  capability: "offered" | "not_offered" | "unknown",
  equipmentStatus?: "available" | "unavailable" | "unknown",
  providerStatus?:  "available" | "unavailable" | "unknown",
  schedule?: { day: Mon..Sun, sessions: ("morning"|"afternoon")[] }[],
  acceptingReferrals?: boolean | null,
  appointmentRequired?: boolean | null,
  expectedPatientCost?: "none" | "low" | "moderate" | "high" | null,
  lastUpdated: ISO date,
  sourceNote: string,        // "Illustrative synthetic facility data"
  rawUpdate?: string         // reserved for a future facility-update AI (section 11)
}
ServiceCatalogue { healthArea -> [{ serviceId, label }] }   // illustrative, not a protocol
```
Optional fields mean "unknown" when missing. They are never treated as available.

## 6. Illustrative dataset
5 facilities, all labelled **"Illustrative synthetic facility data"**: Illustrative CHC A (4 km), District Hospital B (14 km), Women's Centre C (22 km), Medical College Hospital D (45 km), Regional Specialist Centre E (80 km). The catalogue is exactly the four health areas and their services listed in the brief.

Records are seeded on purpose to show each case: a close facility with stale or unknown provider status; a mid-distance facility confirmed for a specific morning; one with equipment down; one not accepting referrals; and an appointment-required option. Dates are generated relative to today so freshness always shows.

## 7. Feasibility and ranking (deterministic)
1. **Hard filter on the service:** facilities with `capability = not_offered` are listed separately as "Does not offer this service". Practical constraints can never move these up.
2. **Availability state** for each remaining facility:
   - **Unavailable:** equipment or provider is unavailable, or the facility isn't accepting referrals.
   - **Confirmed available:** all the relevant fields are positive and recent.
   - **Not recently confirmed:** positive but older than the freshness limit.
   - **Unknown — confirm with facility:** anything else.
3. **Group order:** Confirmed, then Not recently confirmed, then Unknown, then Unavailable.
4. **Within a group, constraint rules** (each is a fixed rule with a reason string):
   - **Time chip:** schedule matches the chosen day and session, so the facility moves up.
   - **One trip / cost chip:** facilities with unknown availability or an appointment requirement move down, and lower expected cost wins ties.
   - **Travel chip:** shorter travel time moves up.
5. **Tie-breakers:** distance, then facility ID, so the order is stable.

## 8. Freshness rule (recommendation)
- Updated within 7 days: **recently confirmed**.
- 8–30 days: **not recently confirmed**.
- More than 30 days or no date: **unknown**.

Why 7 days: provider rosters in this setting typically change weekly. The limit is one named constant so it is easy to change. The last-updated date is always shown, as "Updated today" or "Updated 12 days ago".

## 9. Explanations without an LLM
Each rule that fires adds a fixed template line ("Required service: confirmed", "Trained provider: available tomorrow morning", "Updated today"). The **"Why not the closer facility?"** line comes from comparing the top option with any closer facility that offers the service, and naming the first rule where they differ (for example "provider availability is not recently confirmed"). No scores or percentages are shown.

## 10. Worker selection into referral creation
The worker taps "Use this facility". This fills `destination` and `department` and stores an optional `facilityRef { facilityId, serviceId, healthArea, constraints[], matchedAt }` on the referral, with a history entry "Facility chosen by worker". No referral is created automatically. The existing validation, Step 2 and save flow continue unchanged. Older records without `facilityRef` still work.

## 11. Avoiding duplicate information
Keep the two concepts separate:
- **Practical constraints** are logistics the worker states before referral.
- **Confirmed barriers** are the classifier-assisted, human-confirmed categories after referral.

In Step 2, confirmed constraints appear read-only as "Already noted before referral" next to the barrier note, so the worker needn't retype them. They are **never fed into the classifier or written into `confirmedBarriers`**. A worker can still confirm a related barrier themselves.

## 12. Onward referral later
The finder becomes a standalone component, `FacilityFinder`, taking `(healthArea?, serviceId?)` and returning a selection. A future "Refer onward" action on the receiving side reuses it and creates a new referral with `parentReferralId`, forming a chain. No changes to the current schema are needed now beyond keeping `facilityRef` optional.

## 13. Smallest convincing demo
- Health area, then a dependent service dropdown.
- 4 constraint chips (time, one trip, travel, accompaniment).
- An optional free-text box that pre-highlights chips.
- Ranked cards with availability badge, updated date, "Why this option?" and "Why not the closer facility?".
- "Use this facility" fills the existing form.
- One scripted scenario: Cervical health, Thermal ablation, "tomorrow morning" plus "one trip". District Hospital B ranks above the closer CHC A, with the explanation shown.

## 14. Risks
- Users could read the suggestions as clinical advice. Mitigations: the boundary text, "Illustrative synthetic facility data" labelling, and never wording anything as "recommended treatment".
- Making `destination` structured could break existing records, so it stays a plain string and `facilityRef` is optional.
- Step 1 gets longer. The panel is collapsible and collapsed by default.
- The bundled data adds a small amount to the offline cache. It is a few KB of JSON in the main bundle, so the offline setup needs no change.
- Facility arrival verification, referral codes, SMS and IVR, priority, the classifier, the model, explanations and Ask Next are all untouched.

## Technical details — files expected to change
- **New** `src/lib/facilities/data.ts`: catalogue and synthetic dataset.
- **New** `src/lib/facilities/match.ts`: feasibility, freshness, ranking and explanation templates.
- **New** `src/lib/facilities/constraints.ts`: chip definitions and deterministic keyword pre-highlighting.
- **New** `src/components/FacilityFinder.tsx`: the panel UI.
- `src/routes/new.tsx`: mount the finder above Destination, store `facilityRef`, show the constraints read-only in Step 2.
- `src/lib/types.ts`: optional `facilityRef` and a `facility_selected` history type.
- `src/routes/referral.tsx`: show the chosen service, constraints and the activity label.
- `AGENTS.md`: one architecture rule.
- Not changed: the classifier, model, explanation helper, audio, store logic beyond types, the offline service worker configuration, arrival, SMS and IVR.
