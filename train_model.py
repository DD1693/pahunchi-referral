"""Sahaay reference classifier.
Features: word unigrams + character 2-4 grams of each word (padded with < >), binary, L2-normalised.
Model: one-vs-rest logistic regression (L2), plain gradient descent - easy to port to JavaScript.
Only the TRAIN csv is used for vocabulary, regularisation choice, model choice and thresholds.
The TEST csv is read exactly once, at the end, for reporting.
"""
import csv, json, re, unicodedata, math, random
import numpy as np

LABELS = ["access_cost", "household_constraint", "fear_hesitancy", "work_caregiving", "understanding_information"]

def normalise(t):
    t = unicodedata.normalize("NFC", t.lower())
    t = t.replace("\u093c", "").replace("\u0901", "\u0902")   # drop nukta; chandrabindu -> anusvara
    return re.sub(r"[^a-z0-9\u0900-\u097f]+", " ", t).strip()

def features(t):
    f = set()
    for w in normalise(t).split():
        f.add("w:" + w)
        p = "<" + w + ">"
        for n in (2, 3, 4):
            for i in range(len(p) - n + 1):
                f.add("c:" + p[i:i+n])
    return f

def read(path):
    return list(csv.DictReader(open(path, encoding="utf-8")))

def build_vocab(texts, min_df=2):
    df = {}
    for t in texts:
        for f in features(t):
            df[f] = df.get(f, 0) + 1
    return sorted(f for f, c in df.items() if c >= min_df)

def vectorise(texts, vocab):
    idx = {f: i for i, f in enumerate(vocab)}
    X = np.zeros((len(texts), len(vocab)))
    for r, t in enumerate(texts):
        hits = [idx[f] for f in features(t) if f in idx]
        if hits:
            X[r, hits] = 1.0 / math.sqrt(len(hits))
    return X

from scipy.optimize import minimize
def fit_lr(X, y, lam):
    """L2-regularised logistic regression solved to convergence with L-BFGS (training only; inference is a dot product)."""
    n, d = X.shape
    def obj(theta):
        w, b = theta[:-1], theta[-1]
        z = X @ w + b
        p = 1 / (1 + np.exp(-np.clip(z, -30, 30)))
        eps = 1e-12
        loss = -np.mean(y * np.log(p + eps) + (1 - y) * np.log(1 - p + eps)) + 0.5 * lam * (w @ w)
        g = p - y
        grad = np.concatenate([X.T @ g / n + lam * w, [g.mean()]])
        return loss, grad
    res = minimize(obj, np.zeros(d + 1), jac=True, method="L-BFGS-B", options={"maxiter": 2000})
    return res.x[:-1], float(res.x[-1])

def fit_nb(X, y, alpha=1.0):  # Bernoulli-style NB on binary presence, returned as linear weights
    Xb = (X > 0).astype(float)
    p1 = (Xb[y == 1].sum(0) + alpha) / ((y == 1).sum() + 2 * alpha)
    p0 = (Xb[y == 0].sum(0) + alpha) / ((y == 0).sum() + 2 * alpha)
    w = np.log(p1 / p0) - np.log((1 - p1) / (1 - p0))
    b = math.log(((y == 1).sum() + 1) / ((y == 0).sum() + 1)) + np.log((1 - p1) / (1 - p0)).sum()
    return w, b, True

def predict(X, w, b, binary=False):
    Z = (X > 0).astype(float) @ w + b if binary else X @ w + b
    return 1 / (1 + np.exp(-np.clip(Z, -30, 30)))

def prf(y, yhat):
    tp = int(((y == 1) & (yhat == 1)).sum()); fp = int(((y == 0) & (yhat == 1)).sum()); fn = int(((y == 1) & (yhat == 0)).sum())
    p = tp / (tp + fp) if tp + fp else 0.0; r = tp / (tp + fn) if tp + fn else 0.0
    f = 2 * p * r / (p + r) if p + r else 0.0
    return p, r, f, tp, fp, fn

train = read("sahaay_referral_train.csv")
Ytr = np.array([[int(r[l]) for l in LABELS] for r in train])
texts = [r["text_hi"] for r in train]

# ---------- 5-fold CV on TRAIN only ----------
random.seed(13)
order = list(range(len(train))); random.shuffle(order)
folds = [order[i::5] for i in range(5)]

def cv_probs(kind, lam=None):
    P = np.zeros(Ytr.shape, dtype=float)
    for k in range(5):
        te = folds[k]; tr = [i for i in order if i not in set(te)]
        vocab = build_vocab([texts[i] for i in tr])
        Xa = vectorise([texts[i] for i in tr], vocab); Xb = vectorise([texts[i] for i in te], vocab)
        for j in range(len(LABELS)):
            if kind == "lr":
                w, b = fit_lr(Xa, Ytr[tr, j], lam); P[te, j] = predict(Xb, w, b)
            else:
                w, b, _ = fit_nb(Xa, Ytr[tr, j]); P[te, j] = predict(Xb, w, b, binary=True)
    return P

def micro_f1(P, Y, t=0.5):
    yh = (P >= t).astype(int)
    tp = ((Y == 1) & (yh == 1)).sum(); fp = ((Y == 0) & (yh == 1)).sum(); fn = ((Y == 1) & (yh == 0)).sum()
    return 2 * tp / (2 * tp + fp + fn)

results = {}
for lam in [0.00001, 0.00003, 0.0001, 0.0003, 0.001]:
    P = cv_probs("lr", lam)
    results[f"lr_lambda_{lam}"] = round(float(micro_f1(P, Ytr, 0.5)), 3)
Pnb = cv_probs("nb")
results["naive_bayes"] = round(float(micro_f1(Pnb, Ytr, 0.5)), 3)
best = max((k for k in results if k.startswith("lr")), key=lambda k: results[k])
lam = float(best.split("_")[-1])
print("CV micro-F1 @0.5 (train only):", results, "-> chosen", best)

# thresholds per label from CV probabilities of the chosen model (train only)
Pcv = cv_probs("lr", lam)
thresholds = {}
grid = np.round(np.arange(0.2, 0.71, 0.05), 2)
import sys
STOP_BEFORE_TEST = "--cv-only" in sys.argv
for j, l in enumerate(LABELS):
    scores = [(prf(Ytr[:, j], (Pcv[:, j] >= t).astype(int))[2], -abs(t - 0.5), t) for t in grid]
    thresholds[l] = float(max(scores)[2])
print("CV-selected thresholds:", thresholds)
cv_report = {}
for j, l in enumerate(LABELS):
    p, r, f, *_ = prf(Ytr[:, j], (Pcv[:, j] >= thresholds[l]).astype(int))
    cv_report[l] = {"precision": round(p, 3), "recall": round(r, 3), "f1": round(f, 3)}

# ---------- final fit on all TRAIN ----------
vocab = build_vocab(texts)
Xtr = vectorise(texts, vocab)
W, B = [], []
for j in range(len(LABELS)):
    w, b = fit_lr(Xtr, Ytr[:, j], lam); W.append(w); B.append(b)
W = np.array(W)
# prune near-zero weights to shrink the bundle
keep = np.where(np.abs(W).max(0) > 1e-3)[0]
vocab_k = [vocab[i] for i in keep]; Wk = W[:, keep]
UNCERTAIN_MARGIN = 0.10
model = {
    "name": "sahaay-barrier-classifier", "version": "0.1",
    "trained_on": "sahaay_referral_train.csv (160 synthetic rows) only",
    "labels": LABELS,
    "normalisation": "NFC; lowercase; remove nukta U+093C; map chandrabindu U+0901 to anusvara U+0902; replace any char not in [a-z0-9\\u0900-\\u097f] with space",
    "features": "binary word unigrams 'w:'+word and char 2-4 grams of '<'+word+'>' prefixed 'c:'; value 1/sqrt(number of matched features)",
    "vocab": vocab_k,
    "weights": [[round(float(x), 5) for x in row] for row in Wk],
    "bias": [round(float(b), 5) for b in B],
    "thresholds": thresholds,
    "uncertain_margin": UNCERTAIN_MARGIN,
    "lambda_l2": lam,
}
json.dump(model, open("sahaay_model_v0.1.json", "w", encoding="utf-8"), ensure_ascii=False)

# ---------- ONE evaluation on the held-out TEST ----------
print("CV per-label (train only):", cv_report)
if STOP_BEFORE_TEST: raise SystemExit(0)
test = read("sahaay_referral_test.csv")
Yte = np.array([[int(r[l]) for l in LABELS] for r in test])
Xte = vectorise([r["text_hi"] for r in test], vocab_k)
Pte = np.column_stack([predict(Xte, Wk[j], B[j]) for j in range(len(LABELS))])
th = np.array([thresholds[l] for l in LABELS])
Yhat = (Pte >= th).astype(int)
per = {}
for j, l in enumerate(LABELS):
    p, r, f, tp, fp, fn = prf(Yte[:, j], Yhat[:, j])
    per[l] = {"support": int(Yte[:, j].sum()), "precision": round(p, 3), "recall": round(r, 3), "f1": round(f, 3), "tp": tp, "fp": fp, "fn": fn}
tp = sum(v["tp"] for v in per.values()); fp = sum(v["fp"] for v in per.values()); fn = sum(v["fn"] for v in per.values())
micro = 2 * tp / (2 * tp + fp + fn)
macro = float(np.mean([v["f1"] for v in per.values()]))
exact = float((Yhat == Yte).all(1).mean()); hamming = float((Yhat != Yte).mean())
zero_rows = np.where(Yte.sum(1) == 0)[0]
zero_correct = int((Yhat[zero_rows].sum(1) == 0).sum())
nonzero_rows = np.where(Yte.sum(1) > 0)[0]
nonzero_abstain = int((Yhat[nonzero_rows].sum(1) == 0).sum())
rows = []
for i, r in enumerate(test):
    rows.append({"id": r["id"], "text_hi": r["text_hi"], "difficulty": r["difficulty"], "style": r["language_style"],
                 "gold": [l for j, l in enumerate(LABELS) if Yte[i, j]],
                 "pred": [l for j, l in enumerate(LABELS) if Yhat[i, j]],
                 "probs": {l: round(float(Pte[i, j]), 2) for j, l in enumerate(LABELS)}})
by_style = {}
for s in sorted(set(r["language_style"] for r in test)):
    ix = [i for i, r in enumerate(test) if r["language_style"] == s]
    by_style[s] = {"n": len(ix), "exact_match": round(float((Yhat[ix] == Yte[ix]).all(1).mean()), 3)}
out = {"cv_model_comparison_train_only": results, "chosen": best, "thresholds": thresholds, "cv_per_label_train_only": cv_report,
       "test_per_label": per, "test_micro_f1": round(micro, 3), "test_macro_f1": round(macro, 3),
       "test_exact_match": round(exact, 3), "test_hamming_loss": round(hamming, 3),
       "test_all_zero_rows_correctly_abstained": f"{zero_correct}/{len(zero_rows)}",
       "test_barrier_rows_where_model_abstained(not sure)": f"{nonzero_abstain}/{len(nonzero_rows)}",
       "test_exact_match_by_language_style": by_style,
       "model_size": {"vocab_features": len(vocab_k), "json_bytes": len(json.dumps(model, ensure_ascii=False).encode())},
       "test_rows": rows}
json.dump(out, open("evaluation_report.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in out.items() if k != "test_rows"}, indent=1, ensure_ascii=False))
for r in rows:
    flag = "" if set(r["gold"]) == set(r["pred"]) else "  <-- MISMATCH"
    print(r["id"], r["text_hi"][:45], "| gold:", r["gold"], "| pred:", r["pred"], flag)
