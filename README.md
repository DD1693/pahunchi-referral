# Pahunchi

### Every referral deserves an answer.

**Pahunchi** is an offline-first Small AI prototype that helps frontline health workers create and follow referrals, structure non-clinical barriers, and close the loop on whether a patient reached the next facility.

Its core AI runs directly on the device. When connectivity is available, an optional voice workflow uses speech-to-text and constrained structured extraction to reduce data-entry burden.

The AI suggests. The health worker decides.

**Live prototype:** https://pahunchi-referral.lovable.app/

**Connected voice demo:** Open **Talk to Pahunchi** on the New Referral screen and allow microphone access when prompted.

**Demo passcode:** `@Mustang1234`

> The passcode protects only the optional connected voice demo from public API abuse. The offline core does not require a passcode.

> Built for the Hack-Nation 7th Global AI Hackathon — World Bank **Small AI for Development: Health** track, October 2026.

---

## The problem

A referral does not guarantee that a patient reaches the next facility.

In low-resource settings, a woman may leave a screening facility carrying a paper referral, while the referring health worker has limited visibility into whether she reached the next step of care or why she did not.

Published Indian studies describe barriers including transport and financial constraints, work and lost wages, fear and hesitancy, limited family support, and poor understanding of the referral process.

Pahunchi focuses on two bounded questions:

**Can a small offline model help a health worker structure what a patient says is getting in the way of completing a referral?**

**Can the referral journey make it clearer whether the patient reached the next facility?**

Pahunchi does not diagnose disease, determine clinical urgency, recommend treatment, or decide what care a patient should receive.

---

## What Pahunchi does

A frontline health worker can:

1. Find an illustrative facility based on a worker-selected required service and practical constraints.
2. Create a referral record with a referral code and Journey ID.
3. Enter a short follow-up note in Hindi, Roman Hindi or limited Hinglish.
4. Optionally play a fixed, pre-generated Hindi voice prompt to support the conversation.
5. Run a small text classifier entirely on the device.
6. Review suggested non-clinical barriers.
7. Confirm, reject or correct the AI suggestion.
8. Choose from fixed, non-clinical follow-up prompts.
9. Record patient-reported, worker-confirmed or facility-verified arrival.
10. Record a receiving-facility outcome or create an onward referral.
11. Continue the core workflow without an internet connection after the app has been loaded.

The AI never makes the final decision.

---

## Three access pathways

Pahunchi is designed around three ways of working across different connectivity and device conditions.

### 1. Smartphone — offline core

The core Pahunchi PWA is offline-first.

After the application has been loaded, referral records and the core workflow remain locally available, while the bundled barrier classifier runs directly in JavaScript without a network call.

The offline core includes:

- local referral records and activity history;
- referral codes and Journey IDs;
- the on-device non-clinical barrier classifier;
- human confirmation or correction of AI suggestions;
- fixed follow-up support; and
- bundled, pre-generated Hindi voice prompts.

### 2. Smartphone — optional connected AI

When connectivity is available, **Talk to Pahunchi** lets a health worker speak a referral description instead of entering all structured fields manually.

The connected flow is:

**Worker speech → ElevenLabs API speech-to-text → transcript → Anthropic Claude API constrained structured extraction → server validation → health-worker review**

The worker can accept, edit or reject the structured draft before using it in the referral workflow.

Extracted fields are constrained to allowed values and checked against supporting text in the transcript before being presented to the worker.

Claude does **not** receive the facility list for recommendation and does not choose or rank a facility. Facility matching remains a separate deterministic process.

Talk to Pahunchi requires internet connectivity and is an optional enhancement rather than a dependency of the offline core.

### 3. Basic phone — cellular pathway simulation

The prototype also explores access for frontline workers without smartphones or mobile data.

A future deployment could use:

**Basic phone → ordinary cellular SMS/voice → telecom gateway → Pahunchi**

The current Basic Phone Access workflow is a **prototype simulation**. Live SMS and telephony gateway integrations are not implemented.

This pathway is not offline: the worker would not require smartphone mobile data, but ordinary cellular network coverage would still be required.

---

## Barrier taxonomy

The prototype uses five multi-label categories:

| Barrier | Meaning |
|---|---|
| `access_cost` | Distance, transport difficulty, or lack of money needed to attend |
| `household_constraint` | Family permission, support, accompaniment or household decision constraints |
| `fear_hesitancy` | Fear, anxiety, embarrassment, stigma, distrust or other reluctance |
| `work_caregiving` | Work, lost wages, caregiving or household responsibilities |
| `understanding_information` | Uncertainty about why, where, when or how to complete the referral |

A note may contain multiple barriers or none.

If the model is uncertain, the appropriate response is **“Not sure — ask the patient.”**

---

## Why Small AI?

Pahunchi deliberately does not depend on a cloud LLM for its **core intelligence**.

The deployed classifier is a small one-vs-rest logistic-regression model using word unigrams and character 2–4 grams. The model bundle contains **2,372 features** and is approximately **143 KB as JSON**.

Inference runs locally in JavaScript with no network call.

This makes the core AI capability compatible with intermittent connectivity and keeps the model small enough to bundle directly with the application.

The optional connected voice workflow uses cloud services when connectivity is available, but the core classifier does not depend on them.

Localization here therefore means more than translating a cloud chatbot into Hindi. It means deciding:

- what intelligence actually needs to live on the device;
- what decision must remain with the health worker;
- what can benefit from connectivity when available; and
- what can wait for connectivity.

---

## Human-in-the-loop design

Pahunchi separates **AI extraction** from **human action**.

The local model only suggests which non-clinical barriers may be present in the worker's note.

The health worker must confirm or correct those suggestions before they become part of the referral record.

In the optional connected voice workflow, structured fields extracted from a transcript are also presented as a draft for worker review rather than being acted on autonomously.

Follow-up support is selected from a fixed list of non-clinical prompts. These actions are **not generated by the AI**, and the worker decides whether any is appropriate after speaking with the patient.

Confirmed barriers do not determine medical urgency.

Referral ordering in the prototype is operational and based on status and dates.

---

## Referral continuity

Pahunchi demonstrates a closed-loop referral workflow.

Each referral receives its own referral code. Related onward referrals can share a **Journey ID** across the same referral episode while retaining separate referral codes.

The prototype distinguishes between:

- referral created;
- patient-reported arrival;
- worker-confirmed arrival;
- facility-verified arrival;
- receiving-facility outcome; and
- onward referral.

Patient-reported arrival does not automatically become facility-verified.

Likewise, **arrival confirmation does not mean that treatment or a clinical procedure was completed**.

### Facility Finder

Facility matching is **deterministic, not generative AI**.

The health worker selects the required service or capability and can confirm relevant practical constraints. Pahunchi then uses structured facility capability and availability information to present suitable options.

The health worker makes the final facility choice.

Facility names, capabilities and availability in the prototype are **illustrative data** and should not be interpreted as current information about real health facilities.

### Needs Attention

Pahunchi can surface referrals requiring operational follow-up, including missed expected visits, patient-reported practical barriers and unresolved arrival status.

This is an operational workflow based on status and dates. It is **not clinical triage or medical-risk scoring**.

---

## Responsible AI boundaries

Pahunchi does **not**:

- diagnose a condition;
- interpret clinical test results;
- recommend treatment;
- estimate disease severity or medical risk;
- determine clinical urgency;
- automatically select a receiving facility;
- automatically contact a patient; or
- make an autonomous referral decision.

The prototype is designed to fail safely toward human review.

The interface explicitly communicates that AI suggestions may be wrong and must be confirmed or corrected by a health worker.

For household-related barriers, the follow-up interface also reminds the worker to speak with the woman privately first and not discuss her referral with family members without her consent.

---

## Offline-first architecture

```text
Frontline health worker
        |
        v
Offline-capable PWA
        |
        +--> Referral / journey record stored locally
        |
        +--> Hindi / Roman Hindi / Hinglish note
                  |
                  v
          Tiny bundled classifier
          (local JavaScript inference)
                  |
                  v
          Suggested barrier labels
                  |
                  v
          Human confirmation / correction
                  |
                  v
          Fixed follow-up support
                  |
                  v
          Local activity record
```

There is no cloud AI dependency in the **core classification workflow**.

Six fixed Hindi voice prompts are bundled with the application and explicitly cached by the service worker. They can be played by the health worker without connectivity.

The prompts are pre-generated audio assets rather than runtime AI generation; Pahunchi does not record, transcribe or upload patient speech as part of these fixed offline prompts.

The published prototype was manually tested with connectivity disabled: the application remained accessible after initial loading, the bundled classifier ran, and newly saved referral data remained available locally.

---

## Connected AI architecture

Talk to Pahunchi is an optional connected feature:

```text
Health worker speaks
        |
        v
ElevenLabs API
Speech-to-Text
        |
        v
Transcript
        |
        v
Anthropic Claude API
Constrained structured extraction
        |
        v
Server-side validation
        |
        v
Health-worker review
        |
        v
Existing referral workflow
```

Audio is sent to ElevenLabs for transcription.

The resulting transcript is sent to Anthropic Claude for constrained structured extraction.

Claude does not receive the facility list for recommendation.

Extracted fields are checked server-side against allowed values and supporting transcript text before being presented to the worker.

The worker remains responsible for accepting, editing or rejecting the draft and selecting a facility.

---

## Data

The repository includes a **synthetic dataset of 200 examples**:

- 160 training examples
- 40 held-out challenge examples

The notes include Hindi in Devanagari, Roman Hindi, Hinglish and mixed-script examples.

The dataset is synthetic and contains no real patient records.

It was generated with Claude using an evidence-informed annotation guide and audited programmatically for issues including duplicates, train/test similarity, label-name leakage, clinical terms and obvious personal identifiers.

The English glosses and annotation rationales are provided for transparency and review; the classifier uses only the original note text as input.

See:

- `pahuchi_referral_train.csv`
- `pahuchi_referral_test.csv`
- `DATASET_CARD.md`
- `pahuchi_DATASET_REPORT.md`
- `qa_report.json`

---

## Model and evaluation

The reference classifier uses:

- binary word unigrams;
- character 2–4 grams within words;
- L2-normalised feature vectors;
- one-vs-rest logistic regression;
- per-label thresholds selected using training-set cross-validation.

Model selection and threshold selection were performed on the training data.

On the 40-row synthetic challenge set, the reference model produced:

| Metric | Result |
|---|---:|
| Micro-F1 | 0.533 |
| Macro-F1 | 0.543 |
| Exact-match ratio | 0.300 |
| Hamming loss | 0.175 |

These results are **prototype evaluation metrics on synthetic data, not clinical accuracy**.

The test set was inspected during development after an earlier model iteration, so the reported test performance should be treated as somewhat optimistic rather than as a pristine independent validation result.

Performance on this dataset does not establish effectiveness with real health-worker notes or real patients.

Full results are available in `evaluation_report.json`.

---

## Reproducibility

The repository includes the scripts used to build, audit and train the reference model:

- `build_and_qa.py`
- `train_model.py`
- `evaluation_report.json`
- `qa_report.json`

The deployed application bundles the resulting model and JavaScript inference implementation so that classification can run locally in the browser.

---

## Evidence grounding

The barrier taxonomy was informed by published research on cervical-screening referral and follow-up in India.

Key sources reviewed include:

1. **Vidhubala E et al. (2019)** — *Cervical Cancer Care Continuum in South India: Evidence from a Community-based Screening Program.* Journal of Epidemiology and Global Health. DOI: `10.2991/jegh.k.191111.001`

2. **Vidhubala E et al. (2020)** — *Loss to follow-up after initial screening for cervical cancer: A qualitative exploration of barriers in Southern India.* Cancer Research, Statistics, and Treatment. DOI: `10.4103/CRST.CRST_221_20`

3. **Bhatt S et al. (2018)** — *Mobile technology and cancer screening: Lessons from rural India.* Journal of Global Health. DOI: `10.7189/jogh.08.020421`

The evidence does **not** establish a Chhattisgarh-specific referral-completion rate or Chhattisgarh-specific barrier prevalence.

The evidence review also found that tracking alone did not improve follow-up in one studied programme, which is why Pahunchi is framed as a tool for documenting barriers and supporting human follow-up — not as evidence that digitisation itself improves referral completion.

See `pahuchi_DATASET_REPORT.md` for the evidence review and claim boundaries.

---

## Known limitations

This is a hackathon prototype.

Important limitations include:

- The dataset is synthetic.
- The classifier has not been clinically validated.
- The prototype has not been field-tested or co-designed with frontline health workers.
- The language data is Hindi, Roman Hindi and limited Hinglish — **not Chhattisgarhi**.
- Real frontline notes may differ substantially from the synthetic examples.
- `fear_hesitancy` is currently the weakest-performing model category.
- Caregiving is included as a design assumption; the evidence review did not identify verified Indian evidence for it as a referral-completion barrier.
- Facility capability and availability information is illustrative rather than live health-system data.
- The optional Talk to Pahunchi feature requires internet connectivity and external AI APIs.
- Speech-to-text and connected extraction were demonstrated with English and Hinglish test inputs but have not been formally evaluated for accuracy in real frontline settings or over telephone-quality audio.
- Basic Phone Access, SMS/IVR gateway workflows and cross-device synchronization are prototype simulations rather than production integrations.
- Live telecom and SMS gateway integrations are not implemented.
- Data are stored locally in the prototype; production deployment would require appropriate authentication, device security, consent, governance and data-protection controls.
- There is no live integration with DHIS2 or a government health information system.
- The prototype does not demonstrate improved referral completion or health outcomes.

A real deployment would require locally collected and appropriately governed data, language validation, co-design with frontline workers, prospective evaluation and monitoring for bias and failure modes.

---

## Future direction

Pahunchi is intended as a **small intelligence layer**, not a replacement for existing referral or health-information systems.

A future deployment could use store-and-forward synchronization to send human-confirmed structured data into an authorised health system when connectivity becomes available.

For frontline workers using basic phones, a conventional cellular SMS or voice channel could connect to a telecom gateway and backend while preserving the same principles: bounded extraction, explicit uncertainty and a human final decision.

The same bounded workflow could also be adapted to other referral pathways and languages after local validation.

---

## Technology

### Offline core

- React
- TypeScript
- Vite
- Progressive Web App / service worker
- Local browser storage
- Dependency-free JavaScript model inference
- Small one-vs-rest logistic-regression text classifier
- Pre-generated Hindi voice prompts bundled and cached for offline playback

### Optional connected AI

- ElevenLabs API for speech-to-text
- Anthropic Claude API for constrained structured extraction
- Server-side validation of extracted fields before worker review
- Server-side API secrets; credentials are not exposed to the browser

### Referral workflow

- Deterministic facility capability and availability matching
- Referral codes and Journey IDs
- Patient-reported, worker-confirmed and facility-verified arrival states
- Onward-referral workflow
- Simulated SMS, IVR, Basic Phone Access and cross-device synchronization

### Development and reproducibility

- Lovable for application development
- GitHub for source control and reproducibility

---

## Privacy

The demonstration dataset contains no real patient data.

Prototype referral records are stored locally on the user's device and are not automatically sent to a production health-information server.

For the optional Talk to Pahunchi feature, recorded audio is sent to ElevenLabs for transcription and the resulting transcript is sent to Anthropic Claude for constrained structured extraction. Audio is processed in memory by the prototype and is not stored by Pahunchi.

Only worker-reviewed information enters the referral workflow.

A production deployment involving real patient information would require substantially stronger security, access control, consent, retention and device-loss safeguards.

---

## Project status

**Prototype — not a medical device and not for clinical deployment.**

Pahunchi demonstrates a bounded Small AI approach to referral continuity:

**local-language note → tiny on-device classifier → human-confirmed barrier → fixed follow-up support**

with optional connected assistance for faster structured data entry and simulated pathways for basic-phone access.

**Small AI. On device. Human in control.**
