import csv, re, unicodedata, itertools, json, math
from collections import Counter

LABELS = ["access_cost", "household_constraint", "fear_hesitancy",
          "work_caregiving", "understanding_information"]
COLS = ["id", "text_hi", "text_en"] + LABELS + ["split", "difficulty", "language_style", "rationale"]

def load(path, split, prefix):
    rows = []
    for i, line in enumerate(open(path, encoding="utf-8").read().strip().split("\n"), 1):
        parts = line.split("|")
        assert len(parts) == 6, (path, i, line)
        hi, en, lab, diff, style, rat = [p.strip() for p in parts]
        assert len(lab) == 5 and set(lab) <= {"0", "1"}, line
        assert diff in {"easy", "medium", "hard"}, line
        assert style in {"hindi_devanagari", "roman_hindi", "hinglish", "mixed"}, line
        r = {"id": f"{prefix}{i:03d}", "text_hi": unicodedata.normalize("NFC", hi), "text_en": en,
             "split": split, "difficulty": diff, "language_style": style, "rationale": rat}
        for k, v in zip(LABELS, lab):
            r[k] = int(v)
        rows.append(r)
    return rows

train = load("train_rows.txt", "train", "TR")
test = load("test_rows.txt", "test", "TE")
assert len(train) == 160 and len(test) == 40

for name, rows in [("sahaay_referral_train.csv", train), ("sahaay_referral_test.csv", test)]:
    with open(name, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLS, quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        w.writerows(rows)

# ---------------- QA ----------------
def norm(t):
    t = unicodedata.normalize("NFC", t.lower())
    t = t.replace("\u093c", "").replace("\u0901", "\u0902")
    return re.sub(r"[^a-z0-9\u0900-\u097f]+", " ", t).strip()

def grams(t, n=3):
    t = " " + norm(t) + " "
    return Counter(t[i:i+n] for i in range(len(t) - n + 1))

def cos(a, b):
    num = sum(a[k] * b[k] for k in a if k in b)
    da = math.sqrt(sum(v*v for v in a.values())); db = math.sqrt(sum(v*v for v in b.values()))
    return num / (da * db) if da and db else 0.0

def wjac(a, b):
    A, B = set(norm(a).split()), set(norm(b).split())
    return len(A & B) / len(A | B) if A | B else 0

report = {}
def summary(rows):
    n = len(rows)
    out = {"n": n}
    for l in LABELS:
        c = sum(r[l] for r in rows); out[l] = f"{c} ({100*c/n:.1f}%)"
    k = [sum(r[l] for l in LABELS) for r in rows]
    out["multi_label"] = f"{sum(x>1 for x in k)} ({100*sum(x>1 for x in k)/n:.1f}%)"
    out["single_label"] = f"{sum(x==1 for x in k)} ({100*sum(x==1 for x in k)/n:.1f}%)"
    out["all_zero"] = f"{sum(x==0 for x in k)} ({100*sum(x==0 for x in k)/n:.1f}%)"
    out["max_labels_in_row"] = max(k)
    out["language_style"] = {s: f"{c} ({100*c/n:.1f}%)" for s, c in Counter(r["language_style"] for r in rows).most_common()}
    out["difficulty"] = {s: f"{c} ({100*c/n:.1f}%)" for s, c in Counter(r["difficulty"] for r in rows).most_common()}
    return out
report["train"] = summary(train); report["test"] = summary(test)

allrows = train + test
ids = [r["id"] for r in allrows]
report["unique_ids"] = len(set(ids)) == len(ids)
normed = [norm(r["text_hi"]) for r in allrows]
report["exact_duplicates_after_normalisation"] = [(a["id"], b["id"]) for a, b in itertools.combinations(allrows, 2) if norm(a["text_hi"]) == norm(b["text_hi"])]

G = {r["id"]: grams(r["text_hi"]) for r in allrows}
pairs = []
for a, b in itertools.combinations(allrows, 2):
    c = cos(G[a["id"]], G[b["id"]]); j = wjac(a["text_hi"], b["text_hi"])
    if c >= 0.55 or j >= 0.5:
        pairs.append((round(c, 3), round(j, 3), a["id"], b["id"], a["text_hi"], b["text_hi"]))
pairs.sort(reverse=True)
report["near_duplicate_pairs_flagged(char3_cos>=0.55 or word_jaccard>=0.5)"] = pairs

tt = []
for t in test:
    best = max(((cos(G[t["id"]], G[r["id"]]), r["id"], r["text_hi"]) for r in train))
    tt.append((round(best[0], 3), t["id"], t["text_hi"], best[1], best[2]))
tt.sort(reverse=True)
report["test_to_nearest_train_top10"] = tt[:10]
report["test_max_similarity_to_train_mean"] = round(sum(x[0] for x in tt) / len(tt), 3)
tr_nn = []
for a in train:
    best = max(cos(G[a["id"]], G[b["id"]]) for b in train if b["id"] != a["id"])
    tr_nn.append(best)
report["train_nearest_neighbour_similarity_mean"] = round(sum(tr_nn) / len(tr_nn), 3)

leak_terms = ["access", "cost", "household", "constraint", "fear_", "hesitancy", "caregiving", "understanding", "information", "label"]
report["label_name_leakage_in_text_hi"] = [(r["id"], r["text_hi"]) for r in allrows if any(t in r["text_hi"].lower() for t in leak_terms)]

clinical = ["कैंसर", "cancer", "via", "pap", "hpv", "biopsy", "बायोप्सी", "cin", "positive", "पॉजिटिव", "tumor", "ट्यूमर", "गांठ", "colposcopy", "कोल्पोस्कोपी", "रक्तस्राव", "bleeding", "दवा लेनी चाहिए", "इलाज करें"]
report["clinical_term_scan"] = [(r["id"], r["text_hi"], [c for c in clinical if re.search(r"(?<![a-z])" + re.escape(c) + r"(?![a-z])", r["text_hi"].lower())]) for r in allrows if any(re.search(r"(?<![a-z])" + re.escape(c) + r"(?![a-z])", r["text_hi"].lower()) for c in clinical)]
report["clinical_term_scan_text_en"] = [(r["id"], r["text_en"]) for r in allrows if any(re.search(r"\b" + re.escape(c) + r"\b", r["text_en"].lower()) for c in ["cancer", "via", "pap", "hpv", "biopsy", "tumour", "tumor", "positive", "diagnos"])]
report["pii_scan_digits_ge_6"] = [(r["id"], r["text_hi"]) for r in allrows if re.search(r"\d{6,}", r["text_hi"] + r["text_en"])]
report["pii_scan_at_or_url"] = [(r["id"], r["text_hi"]) for r in allrows if re.search(r"@|http|www", r["text_hi"])]

# keyword-shortcut audit: share of positives containing the most common token
def top_tokens(rows, label):
    pos = [set(norm(r["text_hi"]).split()) for r in rows if r[label]]
    c = Counter(t for s in pos for t in s)
    stop = {"है", "नहीं", "और", "से", "की", "का", "के", "भी", "में", "को", "hai", "nahi", "aur", "ko", "ka", "ki", "ke", "bhi", "to", "pe", "हैं", "तो", "वो", "उसे", "usko", "abhi", "अभी", "कि", "ही", "जाने", "jaane", "जाना", "jaana"}
    return [(t, n, f"{100*n/len(pos):.0f}%") for t, n in c.most_common(12) if t not in stop][:5]
report["most_common_content_tokens_among_positives(train)"] = {l: top_tokens(train, l) for l in LABELS}

# cue words appearing in rows where that label is 0 (anti-shortcut evidence)
cues = {"household_constraint": ["पति", "pati", "husband", "सास", "saas", "family", "घरवाले", "घर"],
        "access_cost": ["पैसे", "पैसा", "paise", "किराया", "खर्च", "बस", "गाड़ी", "transport", "अस्पताल"],
        "fear_hesitancy": ["डर", "darr", "dar", "fear", "डराते"],
        "work_caregiving": ["काम", "kaam", "खेत", "khet", "मजदूरी", "work"],
        "understanding_information": ["समझ", "samajh", "पता", "pata", "report", "रिपोर्ट"]}
anti = {}
for l, ws in cues.items():
    for w in ws:
        withw = [r for r in allrows if w in norm(r["text_hi"]).split() or w in norm(r["text_hi"])]
        if withw:
            neg = [r["id"] for r in withw if r[l] == 0]
            anti[f"{l}::{w}"] = f"{len(withw)} rows contain cue, {len(neg)} have label=0"
report["cue_word_counterexamples"] = anti

json.dump(report, open("qa_report.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in report.items() if k not in ("near_duplicate_pairs_flagged(char3_cos>=0.55 or word_jaccard>=0.5)",)}, ensure_ascii=False, indent=1))
print("\nNEAR-DUP FLAGS:")
for p in pairs: print(p)
