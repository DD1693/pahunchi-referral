# Sahaay Referral — Evidence Review, Dataset & Offline Classifier Report (v0.1)

Prepared for the Hack-Nation 7th Global AI Hackathon, World Bank "Small AI for Development" Health track, 3–4 October 2026.

**Status of everything in this report:** prototype. The dataset is synthetic. Nothing here is clinically validated, field-tested with health workers, or validated for Chhattisgarhi.

---

## 1. Research and evidence summary

**Bottom line.** Published Indian evidence clearly documents that many women referred after cervical screening never reach the next step of care, and qualitative studies name barriers that map well onto a small non-clinical taxonomy. The evidence base is thin in three specific places, and the project should say so openly:

1. **No Chhattisgarh-specific statistic or barrier finding was found.** One study included a Chhattisgarh site (Christian Hospital Mungeli) but reports cervical follow-up figures pooled across three sites, and its quoted barrier statements come from staff at the Madhya Pradesh site.
2. **Caregiving (childcare, elder care) as a barrier to referral completion was not supported by any verified Indian source in this review.** Work and lost wages are supported; caregiving is retained as a project design decision (see §3).
3. **Most barrier evidence is qualitative and small-sample**, mostly reported by health workers or a handful of women. It establishes that a barrier exists, not how common it is.

A further finding matters for how Sahaay is pitched: in the one study that tested a mobile tracking tool for referred women, the authors reported that better recording and tracking alone did **not** improve follow-up; they concluded that social, financial and cultural barriers must be addressed alongside it (Bhatt et al. 2018). Sahaay's design (documenting *why* a woman has not attended, so a human can respond to that reason) is consistent with that lesson, but Sahaay must not claim that tracking improves completion.

### Outcome categories (kept separate throughout)

| Code | Outcome | Used in this review |
|---|---|---|
| A | Referral non-completion (did not reach referral facility) | Vidhubala 2019 |
| B | Delayed referral | Not measured by any verified source |
| C | Failure to attend diagnostic follow-up (repeat VIA, colposcopy, biopsy) | Bhatt 2018; Vidhubala 2020 ("follow-up after initial screening") |
| D | Failure to initiate treatment | Not used |
| E | Failure to complete treatment | Not used |

---

## 2. Verified source table

All three sources below were opened and read (full text for S1 and S3; full abstract for S2, whose full text was not accessible). Statistics are reported only where the denominator was checked.

| | S1 | S2 | S3 |
|---|---|---|---|
| **Title** | Cervical Cancer Care Continuum in South India: Evidence from a Community-based Screening Program | Loss to follow-up after initial screening for cervical cancer: A qualitative exploration of barriers in Southern India | Mobile technology and cancer screening: Lessons from rural India |
| **Authors** | Vidhubala E, Niraimathi K, Shewade HD, Mahadevan S | Vidhubala E, Shewade HD, Niraimathi K, Dongre AR, Gomathi R, Ramkumar S, Sankar MB | Bhatt S, Isaac R, Finkel M, Evans J, Grant L, Paul B, Weller D |
| **Journal, year** | J Epidemiol Glob Health 10(1):28–35, 2019 (online Nov 2019) | Cancer Res Stat Treat 3(4):700–707, 2020 | J Glob Health 8(2):020421, 2018 |
| **DOI** | 10.2991/jegh.k.191111.001 | 10.4103/CRST.CRST_221_20 | 10.7189/jogh.08.020421 |
| **Stable URL** | https://www.atlantis-press.com/journals/jegh/125923232 | https://doaj.org/article/aa42e2893d9342b280ae7ac5583b5d70 | https://jogha.org/documents/issue201802/jogh-08-020421.htm |
| **Geography** | Tirunelveli and Tuticorin districts, Tamil Nadu | Tirunelveli district, Tamil Nadu | RUHSA (Vellore, Tamil Nadu); Padhar Hospital (Madhya Pradesh); Christian Hospital Mungeli (Chhattisgarh) |
| **Design / population** | Retrospective review of case records; 2,192 women screened at 154 NGO-run camps in 100 villages, Mar 2015–May 2016 | Qualitative interviews, Dec 2017–Jan 2018; 11 community women and 5 service providers, interviews in Tamil | Mixed methods; mHealth tool used by CHWs and nurses, Apr 2016–Mar 2018; 170 women had cervical (VIA) screening; 2 focus groups and 8 key-informant interviews at Padhar and Mungeli only |
| **Key verified statistic** | 807 women were eligible for referral; 74 (9.2%) visited the referral centre by 31 Dec 2016. Of 597 who tested positive on Pap or VIA, 56 (9.4%) attended. (Outcome A) | None (qualitative) | 49 of 170 (28%) were VIA-positive; 18 of 49 (36.7%) attended follow-up testing and/or biopsy despite continuous follow-up by health workers. **Pooled across sites, not Chhattisgarh-specific.** (Outcome C) |
| **Barriers reported** | Not measured. Authors suggest distance "could have been" a major deterrent (half the camps were ~40 km from facilities). Follow-up attendance was low despite free services, repeated house visits and phone calls. | Unawareness and poor understanding of the screening process; fear of procedures and the disease; no financial and family support; sociocultural beliefs | Time off work, cost of transportation, losing a day's wages (CHWs/nurses); "money is controlled by husbands" (supervisor, Padhar); no money for biopsy or treatment (nurse, Padhar) |
| **What it supports** | Referral non-completion after community screening can be very high in a rural Indian programme. | The existence and nature of non-clinical barriers to follow-up, from both women and providers. | Work, lost wages, transport cost, care cost and husband's control of money as provider-reported barriers; that tracking tools alone did not improve follow-up. |
| **What it does NOT establish** | Reasons for non-completion; any figure for other states, government programmes, or recent years. Note an internal inconsistency: the discussion section mentions 15.7% attending, while the abstract and results report 9.2%. Use 9.2% with its stated denominator. | How common any barrier is; anything outside one Tamil Nadu district; referral completion rates. | Any Chhattisgarh-specific rate or barrier; that the quoted barriers apply to Mungeli (the quotes come from Padhar staff); barrier prevalence. |

### Sources found but NOT used (and why)

| Source | Reason not used |
|---|---|
| Sriram et al., F1000Research 2025 (Pondicherry, HPV screening costs) | Only search-result summaries were seen, not the full paper; and it concerns screening access, not referral completion. |
| Srinivas et al., Asian Pac J Cancer Prev 2021 (Mysore mobile screening) | The follow-up statistic in the abstract has an unclear denominator ("49 (59.0%)"); could not be verified. |
| Sakthivel, UICC fellowship abstract (Tamil Nadu, "about 42% non-compliant to colposcopy") | Secondary citation of an earlier study that was not located. |
| News reports on a Tamil Nadu care-cascade study | Secondary journalism; original paper not retrieved. |
| Liang et al., BMC Women's Health 2022 (colposcopy non-attendance, childcare) | Not Indian (German cohort). Cannot support an Indian taxonomy. |
| Isaac et al., Asian Pac J Cancer Prev 2012 (RUHSA; fear of treatment and cost) | Only seen as cited inside S3; original not opened. |

---

## 3. Final barrier taxonomy and evidence justification

### One change from the proposed taxonomy

**`transport_cost` → `access_cost`.** The evidence does not separate travel cost from other money barriers. S3 reports transport cost *and* inability to pay for biopsy and treatment; S2 reports "no financial support" without specifying what for. A travel-only label would leave very common notes such as "पैसे की तंगी है" (money is tight) unlabelled, teaching the classifier that a stated money barrier is "no barrier." The renamed label covers physical access (distance, no transport, impassable roads) **and** money needed to attend (fares, test and care costs, general money shortage stated as a reason). Lost wages are coded under `work_caregiving`, because the barrier is the work obligation.

The other four labels are unchanged in name.

| Label | Operational definition (short) | Supporting source(s) | Geography | Strength | Main ambiguity |
|---|---|---|---|---|---|
| `access_cost` | Physical difficulty reaching the facility, or lack of money to attend (fares, test/care costs, stated money shortage) | S3 (transport cost; money for biopsy/treatment); S2 (no financial support); S1 (distance hypothesised only) | TN; MP (quotes) | Moderate (qualitative, provider-reported) | Lost wages (→ work); "worry" about cost (→ access, not fear) |
| `household_constraint` | A family member's permission, decision, support or accompaniment is needed and lacking, or the family is blocking/postponing | S2 (no family support); S3 (money controlled by husbands, one quote) | TN; MP | Moderate–weak | Husband's opinion that care is unnecessary (→ household, not understanding) |
| `fear_hesitancy` | Fear, anxiety, embarrassment, stigma, distrust of care, or belief-based reluctance about the referral | S2 (fear of procedures and disease; sociocultural beliefs) | TN | Moderate | Fear of losing job (→ work); fear of asking husband (→ household) |
| `work_caregiving` | The woman's own paid work, farm work, lost wages, or caregiving/household duties prevent attending | S3 (time off work; lost day's wages). **Caregiving: no verified Indian source in this review** | MP / CG sites (quotes from MP) | Work: moderate. Caregiving: unsupported in this review | Other people's work mentioned in the note (→ 0) |
| `understanding_information` | She does not understand why, when, where or how to go, or believes follow-up is unnecessary | S2 (unawareness, poor understanding of the screening process) | TN | Moderate | Belief-driven reluctance (→ fear_hesitancy) vs. misunderstanding |

All five labels pass the safety tests: they are non-clinical, actionable by a frontline worker (arrange transport support, talk to the family, counsel, reschedule, re-explain), reasonably distinguishable in short text, and say nothing about disease, urgency or treatment.

**Recommendation on caregiving:** keep it merged with work as "competing obligations" for the hackathon, describe it as a design assumption, and list it under future validation. If you want to be strictly evidence-bound, relabel the caregiving-only rows as a future category, at the cost of fewer training examples.

---

## 4. Annotation guide

**General rules**

1. Label only what the note states. Do not infer barriers from stereotypes (for example, a husband being mentioned does not imply a constraint).
2. A row may have several labels. A row may have **no** labels: if no supported barrier is stated, every label is 0. There is deliberately no "none" class.
3. Negated or resolved barriers are 0 ("डर नहीं है", "पैसों का इंतज़ाम हो गया").
4. Vague hints are 0 ("घर में थोड़ी बात है"). These are the cases where the app should say "Not sure — ask the patient."
5. A barrier the woman expresses still counts even if she says she will go ("dar to hai par jayegi" → fear_hesitancy = 1).
6. Barriers belong to the referred woman. Work or plans of other people (son, husband, daughter-in-law) do not trigger `work_caregiving`.
7. Never label anything clinical. Notes contain no diagnoses, symptoms of the patient, results or treatment advice.

**`access_cost`**
- Positive: distance; no vehicle or bus; route closed or impassable; cannot afford fare; cannot afford tests or care; general money shortage stated as a reason; perceived high cost.
- Negative: lost wages only (→ work); money mentioned as arranged; "expenses" mentioned as a family member's opinion without inability to pay (→ household).
- Boundary: "जांच का खर्च सुना तो डर गई" is money worry → access_cost = 1, fear_hesitancy = 0.
- Boundary: not knowing *where* the hospital is → understanding_information, not access_cost.

**`household_constraint`**
- Positive: permission refused or pending; family postponing; no one to accompany her; dependence on a relative to take her; family opposition; husband controls the money (also access_cost).
- Negative: family mentioned as support ("पति खुद ले जाएंगे"); family member merely absent with no stated effect; caregiving for a relative (→ work).
- Boundary: the husband says it is unnecessary → household (his decision), not understanding (her belief).
- Boundary: afraid to ask the husband → household, not fear_hesitancy.

**`fear_hesitancy`**
- Positive: fear of procedure, pain, needles, admission, what will be found; embarrassment (e.g., male doctor); stigma or gossip; distrust of the facility; faith-healing preference; fatalism; not having the courage yet.
- Negative: fear explicitly denied; fear about job loss (→ work) or money (→ access); neutral deferral ("सोचकर बताएगी").

**`work_caregiving`**
- Positive: cannot get leave; daily wage would be lost; farm or seasonal work (harvest, transplanting, tendu leaf); own shop; shift work; childcare, breastfeeding infant, caring for sick or elderly relatives, livestock and heavy household duties.
- Negative: someone else's work; fields mentioned in passing.

**`understanding_information`**
- Positive: does not understand why she must go; does not know date, department, location or what to do there; lost the slip; thinks medicine or the first test was enough; thinks follow-up is optional; did not get or follow the explanation.
- Negative: deferral with no stated reason; correct understanding.
- Boundary: "जब तकलीफ़ होगी तब देख लेंगे" was coded as understanding (low perceived need); it could also be read as hesitancy (flagged for review).

**Multi-label:** set every label whose definition is independently met in the text. The most common real overlaps were money + household, work + money, fear + family opposition, and understanding + another barrier.

---

## 5. Files and schema

- `sahaay_referral_train.csv`: 160 rows, TR001–TR160
- `sahaay_referral_test.csv`: 40 rows, TE001–TE040

Columns: `id, text_hi, text_en, access_cost, household_constraint, fear_hesitancy, work_caregiving, understanding_information, split, difficulty, language_style, rationale`

`language_style`: `hindi_devanagari`, `roman_hindi`, `hinglish` (Roman script with English words), `mixed` (Devanagari with English words in Latin script).

**`text_en` and `rationale` are for human review only and must never be model inputs.** The model reads `text_hi` only.

---

## 6. Dataset QA report

Results from `build_and_qa.py` (full output in `qa_report.json`), after one fix cycle.

| Check | Train (160) | Test (40) |
|---|---|---|
| access_cost | 42 (26.2%) | 11 (27.5%) |
| household_constraint | 38 (23.8%) | 7 (17.5%) |
| fear_hesitancy | 29 (18.1%) | 7 (17.5%) |
| work_caregiving | 34 (21.2%) | 9 (22.5%) |
| understanding_information | 31 (19.4%) | 6 (15.0%) |
| Multi-label rows | 35 (21.9%) | 7 (17.5%) |
| All-zero rows | 22 (13.8%) | 7 (17.5%) |
| Devanagari / Roman / Hinglish / mixed | 67.5% / 17.5% / 10.0% / 5.0% | 50% / 25% / 17.5% / 7.5% |
| Easy / medium / hard | 33.8% / 43.8% / 22.5% | 12.5% / 52.5% / 35.0% |

- **IDs unique:** yes. **Exact duplicates (after normalisation):** none.
- **Near-duplicates:** character-trigram cosine and word-Jaccard computed for all 19,900 pairs; flags at cosine ≥ 0.55 or Jaccard ≥ 0.5. First pass flagged four pairs; two were fixed (TR134 and TR154 rewritten). Two remaining flags are deliberate contrast pairs: TR108/TR113 (both all-zero, one with a vague household hint) and TR058/TR152 (shared phrase "sharam aati hai", different label sets).
- **Train/test leakage:** mean nearest-train similarity of test rows is 0.345 (lower than the 0.365 mean nearest-neighbour similarity *within* train). Highest test-train pair is 0.52 (TE008 vs TR025), driven by the function words "कोई नहीं". TE026 was rewritten after first pass (was 0.58).
- **Label-name leakage:** first pass found "cost" in TR156; fixed. Now none.
- **Keyword shortcuts:** no single content word covers more than 26% of a label's positives. Counterexamples exist for most cue words (e.g., पति appears in 14 rows, 3 with household = 0; डर in 14 rows, 6 with fear = 0; अस्पताल in 16 rows, 10 with access_cost = 0).
- **Clinical content scan** (cancer, VIA, Pap, HPV, biopsy, colposcopy, positive, bleeding, tumour, etc., Hindi and English): none found. Notes mention "report", "test" and "medicine" only as things the woman has, not as findings.
- **PII scan:** no numbers of 6+ digits, emails or URLs. Only fictional IDs. Place names are limited to Raipur (a state capital) and generic "block/district".
- **Caveat:** QA scripts check form, not meaning. Label correctness rests on the annotation guide plus human review (§11).

---

## 7. Hindi and translation QA

- Every `text_en` was written as a translation of `text_hi`, preserving vagueness (e.g., TR113 "There is a bit of a matter at home"), negation and fragments. One fix: TE002's idiom "हाथ तंग है" was rendered literally with an explanatory note rather than silently converted.
- No `rationale` adds a fact absent from `text_hi`; rationales explain the coding rule applied.
- Labels were checked against both columns; no row depends on information present only in the English.
- **Language claim:** this is Hindi, Roman Hindi and limited Hinglish. It is **not** Chhattisgarhi. A few rows use Chhattisgarh-relevant context (tendu-leaf season, Raipur), which is not the same as Chhattisgarhi language.
- **Rows whose Hindi I am least sure sounds natural as frontline documentation:** TR145 ("लोकलाज से हिचक", somewhat literary), TR012 ("किसी से मिला नहीं", colloquial gender agreement with an implied subject), TR071 ("तेंदूपत्ता तोड़ाई"), TR015 (long for a field note), TR134 ("गैरहाज़िर", formal). Roman Hindi spellings are intentionally inconsistent (nahi/nai, kr/kar), as real notes are.

---

## 8. Recommended offline classifier

| Approach | Verdict |
|---|---|
| Keyword/rule matching | Not machine learning; brittle on spelling variation and negation; easy to game. Rejected. |
| Naive Bayes | Simplest genuine ML; trainable in-browser in milliseconds. Train-only CV micro-F1 0.30 at 0.5 threshold. Acceptable fallback. |
| **One-vs-rest logistic regression on word + character n-grams** | **Recommended.** Character 2–4 grams absorb spelling variants in Devanagari and Roman Hindi; weights are inspectable; inference is a dot product. Train-only CV micro-F1 0.47 at 0.5. |
| Tiny neural model / embeddings | Not justified with 160 rows; adds size and opacity. |
| LLM | Excluded by design for the offline path. |

**Implementation (provided):**
- `sahaay_model_v0.1.json`: precomputed weights, 2,372 features, ~140 KB (≈39 KB gzipped). Trained on the train CSV only.
- `sahaay_classifier.js`: dependency-free inference. Python and JavaScript outputs were checked on all 200 rows: maximum difference 0.00.
- **Precompute and bundle, rather than train when the app loads.** It is deterministic, the test file never needs to ship with the app, and Lovable only has to load a JSON file and call `classify()`.

**Text processing:** NFC normalisation, lowercase, nukta removed and chandrabindu mapped to anusvara (so ज़/ज and ँ/ं spellings match), punctuation stripped, then binary word and character 2–4-gram features, L2-normalised.

**Confidence and uncertainty:** each label gets a sigmoid probability. With 160 synthetic rows these are rough scores, not calibrated probabilities; the UI should show bands, not percentages as facts. Per-label thresholds (0.20–0.30) were chosen by 5-fold cross-validation **on the training set only**.
- No label above threshold → "Not sure — ask the patient for more information."
- No recognised features at all → same message, explicitly.
- Within 0.10 below threshold → shown as "possible", greyed, for the worker to consider.
- Every result requires the health worker to confirm or correct before saving (`needs_human_review: true` is always set).

---

## 9. Evaluation methodology and results

**Metrics:** per-label precision, recall and F1; micro-F1 (overall) and macro-F1 (treats rare labels equally); exact-match accuracy; Hamming loss; and an outcome breakdown separating *safe* failures (model says "not sure", worker asks) from *unsafe-looking* failures (model suggests a wrong barrier). For this use case macro-F1 and the false-alarm rate on no-barrier notes matter most, because every output is reviewed by a human and a confident wrong suggestion costs more trust than an honest "not sure."

**Held-out test results (40 synthetic challenge rows):**

| Label | Support | Precision | Recall | F1 |
|---|---|---|---|---|
| access_cost | 11 | 0.50 | 0.45 | 0.48 |
| household_constraint | 7 | 0.67 | 0.57 | 0.62 |
| fear_hesitancy | 7 | 0.33 | 0.29 | 0.31 |
| work_caregiving | 9 | 0.63 | 0.56 | 0.59 |
| understanding_information | 6 | 0.80 | 0.67 | 0.73 |

Micro-F1 **0.53** · Macro-F1 **0.54** · Exact match **0.30** · Hamming loss **0.175**

| Outcome on 40 test rows | Count |
|---|---|
| Exactly correct barrier set | 8 |
| Correct "no barrier" (abstained) | 4 |
| Said "not sure" on a barrier row (safe: routed to human) | 11 |
| Partly correct (some right, some missed or extra) | 8 |
| Wrong labels only | 6 |
| False alarm on a no-barrier row | 3 |

**How to read this:** with 6–11 positive examples per label, one example moves a label's F1 by roughly ten points; these are indicative only. Fear and hesitancy is the weakest label, which is expected: it is expressed most indirectly ("कांपने लगती है", "भगवान की मर्जी"). Negation traps and idioms (TE002, TE021, TE028, TE039) caused several errors. These are the honest limits of a 160-row synthetic model, and they are exactly why the human confirms every result.

**Evaluation history (disclosed):** the test set was scored twice. The first run used a weaker regularisation setting whose underfitting was already visible in train-only cross-validation (CV micro-F1 0.24). The setting was changed using train-only CV evidence and the test set was scored a second, final time (first run micro-F1 0.565; final 0.533). Because the test set was seen twice, treat the numbers as slightly optimistic.

**Demo caution:** notes copied from the training set will show inflated confidence (e.g., "किराया नहीं है और पति मना कर रहे" scores 0.92/0.98 because it nearly matches TR125). Demo with unseen notes and include one vague note to show "Not sure."

---

## 10. Claims

### A. Claims we can safely make

- "In a community cervical-screening programme in two districts of Tamil Nadu (2015–16), only 74 of 807 referred women (9.2%) reached the referral centre." (S1)
- "A qualitative study in Tirunelveli, Tamil Nadu identified poor understanding of the screening process, fear of procedures and the disease, lack of financial and family support, and sociocultural beliefs as barriers to follow-up." (S2)
- "In a study at three mission hospitals in Tamil Nadu, Madhya Pradesh and Chhattisgarh, 18 of 49 VIA-positive women (36.7%) attended follow-up testing; health workers cited time off work, transport costs and lost wages." (S3; say "pooled across three sites")
- "The same study found that a mobile tracking tool alone did not improve follow-up, and that social, financial and cultural barriers also had to be addressed." (S3)
- "Sahaay's five barrier categories are derived from published Indian qualitative evidence, with one category (caregiving) added as a design assumption needing validation."
- "The classifier is a ~140 KB model that runs entirely in the browser with no internet connection."
- "On a held-out synthetic test set of 40 challenge notes, it reached a micro-F1 of 0.53; when uncertain it says 'not sure' instead of guessing, and a health worker confirms every result."
- "The dataset is synthetic: 200 notes in Hindi, Roman Hindi and Hinglish, written to reflect published barriers. It contains no patient data."
- (Personal observation, category D) "In my work on cervical-cancer programmes in India, I saw women leave remote facilities with paper referrals, and follow-up often meant phoning patients individually."

### B. Claims we must NOT make

- That synthetic-test performance reflects real-world or clinical performance, or that the model is "53% accurate" (exact-match is 30%; F1 is not accuracy).
- That Tamil Nadu figures describe India as a whole, or any study figure describes Chhattisgarh.
- That 36.7% (S3) is a Chhattisgarh figure.
- That the model predicts medical risk, cancer, urgency, who will drop out, or who needs treatment.
- That Sahaay prevents cancer, improves survival, or improves referral completion (no evidence; S3 found tracking alone did not).
- That it has been validated or co-designed with frontline health workers, or tested in the field.
- That it understands Chhattisgarhi, or "understands Hindi" in general.
- That it is clinically validated, approved, or integrated with DHIS2, NCD portals or any government system.
- That care at referral facilities is free, or any statement about entitlements, without a cited source.
- That the barrier taxonomy is "validated" or complete; caregiving in particular lacks verified Indian evidence here.
- That the personal observation is a published finding.

### C. Source-traceability table

| Claim | Source | Type | Geography | Year | How we use it | What it does not prove | URL / DOI |
|---|---|---|---|---|---|---|---|
| 74/807 (9.2%) referred women reached referral centre | S1 | A. Published (record review) | Tirunelveli & Tuticorin, TN | 2019 (data 2015–16) | Problem is real | Reasons; other states; govt programmes | 10.2991/jegh.k.191111.001 |
| Barriers: understanding, fear, financial & family support, beliefs | S2 | A. Published (qualitative) | Tirunelveli, TN | 2020 | Taxonomy | Prevalence; generalisability | 10.4103/CRST.CRST_221_20 |
| 18/49 (36.7%) attended follow-up; work, transport, wages, husband controls money | S3 | A. Published (mixed methods) | TN, MP, CG (pooled) | 2018 | Taxonomy; humility on tracking | Chhattisgarh-specific figures | 10.7189/jogh.08.020421 |
| Tracking tool alone did not improve follow-up | S3 | A. Published | As above | 2018 | Design framing | That barrier-documentation works | 10.7189/jogh.08.020421 |
| `access_cost` merges travel and care cost | — | B. Design decision | — | — | Label definition | — | — |
| Caregiving included in `work_caregiving` | — | B. Design decision / E. needs validation | — | — | Label definition | That caregiving is a documented Indian referral barrier | — |
| 200 notes, their wording and label mix | — | C. Synthetic data assumption | — | — | Training/testing | Real CHW language | — |
| Paper referrals and phone follow-up | Project lead | D. Firsthand observation | India | — | Motivation | Prevalence or generality | — |
| Model performance on real notes; Chhattisgarhi; worker acceptance | — | E. Future validation | — | — | — | — | — |

---

## 11. Human review checklist

Spend about 30 minutes on this before relying on the dataset.

1. **Read every test row (all 40)** and ask: would a health worker actually write this, and do you agree with the label?
2. **Review these specific rows**, which carry deliberate judgement calls:
   - Coding boundaries: TR029, TR035, TR054, TR055, TR093, TR140, TR142, TR134, TR031, TR034, TR147, TE014, TE015, TE019, TE020, TE030
   - Vague / all-zero: TR113, TR122, TE027
   - Sensitive content: TR030 (short-tempered husband), TR056 (stigma around a daughter's marriage)
   - Hindi naturalness: TR145, TR012, TR071, TR015, TR134
3. **Spot-check 20 random training rows** for translation fidelity (does `text_en` add or remove anything?).
4. **Look for strange AI-sounding phrasing** — overly complete sentences, textbook Hindi, perfect punctuation.
5. **Confirm no clinical content crept in**: no diagnoses, results, symptoms of the woman, or treatment advice.
6. **Confirm privacy**: no real names, phone numbers, villages that could identify someone.
7. **Check taxonomy consistency**: pick one boundary rule from §4 and check three rows that test it.
8. **Check test difficulty**: the test set should feel harder than training (shorter, messier, more negation).
9. **If you change any label, re-run** `build_and_qa.py` and `train_model.py`, and note the change in the README.

---

## 12. What this dataset does NOT cover

- Real health-worker notes, handwriting, voice transcripts or SMS-length abbreviations beyond a few examples.
- Chhattisgarhi, Gondi, Halbi or any other regional language; regional dialect spellings of Hindi.
- Barriers outside the five labels: supply-side problems (staff absence, stock-outs, closed facilities), health-system referral failures, documentation errors, safety concerns, disability, migration, seasonal displacement, or distrust of a specific provider.
- Notes longer than a few sentences, notes describing several visits, or notes mixing patient and worker commentary.
- Severity or ranking of barriers, and anything about the clinical reason for referral.
- Caregiving barriers grounded in Indian referral evidence.
- Representative frequencies: label proportions were chosen for training balance, not to reflect how often each barrier occurs.
- Any demographic subgroup analysis (age, caste, tribe, religion, literacy).

---

## Appendix: files

| File | Purpose |
|---|---|
| `sahaay_referral_train.csv` | 160 synthetic training rows |
| `sahaay_referral_test.csv` | 40 held-out challenge rows (never ship in the app) |
| `sahaay_model_v0.1.json` | Precomputed classifier weights and thresholds |
| `sahaay_classifier.js` | Offline inference function for the app |
| `evaluation_report.json` | Full test metrics and per-row predictions |
| `qa_report.json` | Full QA audit output |
| `DATASET_CARD.md` | Dataset card for the GitHub README |
| `build_and_qa.py`, `train_model.py` | Reproducible build, audit and training scripts |
