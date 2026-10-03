# Dataset Card: Sahaay Synthetic Referral Barrier Dataset v0.1

> **This dataset is synthetic. These are not patient records.** It is not clinically validated, not representative of all Indian frontline-worker language, and not validated for Chhattisgarhi.

## Purpose
To train and evaluate a very small, offline text classifier that helps a frontline health worker document **non-clinical** barriers a woman reports to completing a referral (for example, after cervical screening), so that a human can organise appropriate follow-up. It starts after a clinician has already made the referral.

## Problem context
Published Indian studies report that many women referred after community cervical screening do not reach the next step of care. In one Tamil Nadu programme, 74 of 807 referred women (9.2%) reached the referral centre (Vidhubala et al., 2019). Qualitative research in Tamil Nadu describes barriers such as poor understanding of the process, fear, and lack of financial and family support (Vidhubala et al., 2020); health workers at mission hospitals in Tamil Nadu, Madhya Pradesh and Chhattisgarh cited time off work, transport costs and lost wages (Bhatt et al., 2018). The same 2018 study found that a mobile tracking tool alone did not improve follow-up.

## Geography and languages
Intended context: rural India, motivated by programmes in Chhattisgarh. No Chhattisgarh-specific barrier evidence was found; the taxonomy draws on studies from Tamil Nadu and Madhya Pradesh/Chhattisgarh (pooled). Languages: Hindi in Devanagari (~65%), Roman Hindi (~19%), Hinglish and mixed-script notes (~16%). **Not Chhattisgarhi.**

## Size and split
200 records: 160 training (`TR001`–`TR160`), 40 held-out challenge test (`TE001`–`TE040`). The test set is deliberately harder (shorter notes, spelling variants, idioms, negation, adversarial mentions of family or money) and must not be used for training, vocabulary, thresholds or model selection.

## Labels (multi-label, binary)
| Label | Meaning |
|---|---|
| `access_cost` | Physical difficulty reaching the facility, or lack of money to attend (fares, test/care costs, stated money shortage) |
| `household_constraint` | A family member's permission, decision, support or accompaniment is needed and lacking |
| `fear_hesitancy` | Fear, anxiety, embarrassment, stigma, distrust or belief-based reluctance about the referral |
| `work_caregiving` | Her own paid/farm work, lost wages, or caregiving/household duties prevent attending |
| `understanding_information` | She does not understand why, when, where or how to go, or believes it is unnecessary |

A row may have several labels, or none. **All-zero rows mean "no supported barrier stated"**; there is intentionally no "none" class. In the app, all-zero output becomes "Not sure — ask the patient."

Train label counts: access_cost 42, household 38, fear 29, work 34, understanding 31; 35 multi-label rows; 22 all-zero rows.

## Columns
`id, text_hi, text_en, access_cost, household_constraint, fear_hesitancy, work_caregiving, understanding_information, split, difficulty, language_style, rationale`

**`text_en` and `rationale` exist only for transparency and human review. They MUST NOT be used as model input features.** The model reads `text_hi` only.

## How examples were generated
Written by an AI assistant (Claude) under a written annotation guide derived from the evidence review, then audited with scripts for duplicates, near-duplicates (character-trigram cosine, word Jaccard), train/test similarity, label-name leakage, clinical terms and personal identifiers, with fixes applied and the audit re-run. Hindi naturalness and labels require human review (see the project report's checklist).

## Evidence used for the taxonomy
- Vidhubala E et al. *J Epidemiol Glob Health* 2019;10(1):28–35. doi:10.2991/jegh.k.191111.001
- Vidhubala E et al. *Cancer Res Stat Treat* 2020;3(4):700–707. doi:10.4103/CRST.CRST_221_20
- Bhatt S et al. *J Glob Health* 2018;8(2):020421. doi:10.7189/jogh.08.020421

The original label `transport_cost` was renamed `access_cost` because the evidence does not separate travel costs from other money barriers. **Caregiving is a design assumption**: no verified Indian source in our review documented it as a referral barrier.

## Privacy
No real people, names, phone numbers, ID numbers or identifiable places. Fictional IDs only. No clinical information about any person.

## License
Recommended: **CC BY 4.0** for this synthetic dataset. The cited papers are not redistributed.

## Known limitations and potential biases
- Synthetic language written by one AI system; real notes will be shorter, messier and more varied.
- Label proportions are set for training balance, not real-world frequency.
- Barrier evidence is qualitative, small-sample and mostly from Tamil Nadu.
- Gendered household dynamics are represented through common scenarios (husband, in-laws) that may over-represent some family structures and under-represent others.
- Tribal, migrant, disabled and urban-poor contexts are under-represented.
- A reference model trained on it reached micro-F1 0.53 and macro-F1 0.54 on the 40-row synthetic test set (test set viewed twice; treat as slightly optimistic). **Performance on this synthetic dataset does NOT establish real-world clinical effectiveness.**

## Intended use
Prototype development and demonstration of an offline, human-in-the-loop barrier-documentation tool; teaching; as a seed for a properly governed, locally collected dataset.

## Out-of-scope uses
Not suitable for diagnosis, clinical triage, treatment recommendations, predicting disease severity, estimating medical risk, ranking patients by clinical need, or any automated decision about a person. Not suitable for training models for deployment without new, real, consented data.

## Required future validation
A real deployment would require locally collected data, appropriate consent and data governance, privacy safeguards, local-language validation (including Chhattisgarhi), co-design and testing with frontline health workers, prospective evaluation, bias assessment across subgroups, and ongoing monitoring.
