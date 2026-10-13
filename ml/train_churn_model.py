"""Orbit churn-risk model (demo).

Everything here is synthetic: accounts are sampled from a made-up generative process, churn labels are drawn from a
hidden logistic function plus noise, and a model is trained to recover it. No real customer data is used.

Outputs (consumed by the front end):
  src/modules/orbit/accounts.json  fictional accounts, with the raw signals the model reads
  src/modules/orbit/model.json     standardisation + logistic-regression weights, band cut-offs, metrics

Run:    python3 ml/train_churn_model.py
Tests:  python3 -m pytest
"""
import json
from pathlib import Path

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

SEED = 7
SEV_W = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
FEATURES = ["usageYoY", "lastTouchDays", "flagScore", "owingK", "renewalPressure", "tenureMonths", "tickets90", "championLeft", "integrations", "workItems"]
BANDS = dict(watch=0.08, atRisk=0.20, critical=0.38)
N_TRAIN, N_LIVE, N_ONB, N_CHURN = 8000, 168, 27, 38
OUT = Path(__file__).resolve().parent.parent / "src" / "modules" / "orbit"

NAME_A = ["Northgate", "Redwood", "Lakeshore", "Foothills", "Prairie", "Summit", "Ironbridge", "Clearwater", "Stonehaven", "Maple Ridge", "Bluffton", "Cascade",
          "Highline", "Pinecrest", "Granite", "Harbourview", "Silverton", "Copperfield", "Westbank", "Eastgate", "Kingsway", "Rivermead", "Thornhill", "Oakridge",
          "Fairmont", "Glenwood", "Ashford", "Brightwater", "Cedarline", "Driftwood"]
NAME_B = ["Mechanical", "Electric", "Civil", "Roofing", "Excavating", "Builders", "Contracting", "Industrial", "Mechanical Services", "Pipeline", "Concrete", "Paving",
          "Energy Services", "Controls", "Fabrication", "Landscaping", "Developments", "Utilities"]
INDUSTRIES = ["Commercial construction", "Oil & gas services", "Civil & infrastructure", "Trades & mechanical", "Utilities", "Residential building"]
TIERS = ["Core", "Plus", "Performance"]


def flag_score(flags):
    return sum(SEV_W[s] for s in flags)


def renewal_pressure(renew_in):
    return np.clip(1 - np.asarray(renew_in) / 180, 0, 1)


def sample(rng, n, onboarding=False):
    """Draw n accounts. A latent 'engagement' variable makes the signals realistically correlated."""
    eng = rng.normal(0, 1, n)
    tenure = rng.integers(0, 6, n) if onboarding else rng.integers(4, 121, n)
    usage = np.clip(0.05 + 0.28 * eng + rng.normal(0, 0.18, n), -0.9, 0.8)
    touch = np.clip(rng.gamma(2.2, 16, n) * np.exp(-0.28 * eng), 1, 240).round()
    tickets = rng.poisson(np.clip(2.0 - 0.8 * eng, 0.2, 6))
    champ = (rng.random(n) < np.clip(0.08 - 0.05 * eng, 0.01, 0.4)).astype(int)
    integ = np.clip(rng.poisson(np.clip(2.2 + 0.7 * eng, 0.3, 6)), 0, 8)
    work = rng.poisson(np.clip(1.3 - 0.4 * eng, 0.1, 5))
    owing = np.where(rng.random(n) < np.clip(0.05 - 0.03 * eng, 0.005, 0.2), rng.gamma(2, 2200, n), 0).round(-1)
    renew_in = rng.integers(10, 400, n)  # days until renewal
    flags = []
    for i in range(n):
        k = rng.poisson(np.clip(0.28 - 0.3 * eng[i], 0.02, 2.2))
        flags.append([str(rng.choice(list(SEV_W), p=[0.4, 0.3, 0.2, 0.1])) for _ in range(k)])
    return dict(eng=eng, tenure=tenure, usage=usage, touch=touch, tickets=tickets, champ=champ, integ=integ, work=work,
                owing=owing, renew_in=renew_in, flags=flags)


def features(d, usage_obs):
    """Feature matrix in FEATURES order."""
    fs = np.array([flag_score(f) for f in d["flags"]])
    return np.column_stack([usage_obs, d["touch"], fs, d["owing"] / 1000, renewal_pressure(d["renew_in"]), d["tenure"], d["tickets"], d["champ"], d["integ"], d["work"]])


def true_churn_prob(rng, d):
    """Hidden ground truth used only to label the synthetic training data."""
    fs = np.array([flag_score(f) for f in d["flags"]])
    pressure = renewal_pressure(d["renew_in"])
    z = (-3.1 + 2.6 * np.clip(-d["usage"], 0, 1) + 0.011 * np.maximum(0, d["touch"] - 30) + 0.30 * fs
         + 0.05 * np.minimum(d["owing"] / 1000, 12) + 1.0 * pressure * (d["touch"] > 45) - 0.010 * np.minimum(d["tenure"], 60)
         + 0.11 * d["tickets"] + 0.9 * d["champ"] - 0.14 * d["integ"] + 0.03 * d["work"] + rng.normal(0, 0.45, len(fs)))
    return 1 / (1 + np.exp(-z))


def train(rng, n=N_TRAIN):
    """Sample a synthetic training set and fit the logistic regression (deployed) and gradient boosting (comparison)."""
    tr = sample(rng, n)
    miss = rng.random(n) < 0.08  # usage not visible for some accounts
    usage_mean = float(tr["usage"][~miss].mean())
    X = features(tr, np.where(miss, usage_mean, tr["usage"]))
    y = (rng.random(n) < true_churn_prob(rng, tr)).astype(int)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=1, stratify=y)
    sc = StandardScaler().fit(Xtr)
    lr = LogisticRegression(C=1.0, max_iter=1000).fit(sc.transform(Xtr), ytr)
    gb = GradientBoostingClassifier(random_state=1).fit(Xtr, ytr)
    p_lr = lr.predict_proba(sc.transform(Xte))[:, 1]
    metrics = {
        "trainRows": int(len(ytr)), "testRows": int(len(yte)), "churnRate": round(float(y.mean()), 3),
        "aucLogistic": round(roc_auc_score(yte, p_lr), 3), "aucGradientBoosting": round(roc_auc_score(yte, gb.predict_proba(Xte)[:, 1]), 3),
        "brierLogistic": round(brier_score_loss(yte, p_lr), 3),
    }
    return dict(sc=sc, lr=lr, gb=gb, usage_mean=usage_mean, metrics=metrics, Xte=Xte, yte=yte, p_lr=p_lr)


def export_model(t):
    """The JSON the front end applies: standardisation, weights, band cut-offs and metrics."""
    return dict(
        version="demo-1", features=FEATURES, mean=[round(float(v), 6) for v in t["sc"].mean_], scale=[round(float(v), 6) for v in t["sc"].scale_],
        coef=[round(float(v), 6) for v in t["lr"].coef_[0]], intercept=round(float(t["lr"].intercept_[0]), 6), usageImpute=round(t["usage_mean"], 4),
        bands=dict(BANDS), metrics=t["metrics"],
    )


def score_account(model, a):
    """Python twin of score() in src/modules/orbit/score.ts: churn probability for one account dict."""
    x = [
        model["usageImpute"] if a["usageYoY"] is None else a["usageYoY"], a["lastTouchDays"], flag_score(a["flags"]), a["owing"] / 1000,
        0 if a["renewalIn"] is None else float(renewal_pressure(a["renewalIn"])), a["tenureMonths"], a["tickets90"], int(a["championLeft"]), a["integrations"], a["workItems"],
    ]
    z = model["intercept"] + sum(c * (v - m) / s for c, v, m, s in zip(model["coef"], x, model["mean"], model["scale"]))
    return 1 / (1 + np.exp(-z))


def band(p, bands=BANDS):
    return "critical" if p >= bands["critical"] else "at_risk" if p >= bands["atRisk"] else "watch" if p >= bands["watch"] else "healthy"


def make_accounts(rng):
    """Fictional accounts: live, onboarding and churned. Same draw order as the original script so the output is stable."""
    names = [f"{a} {b}" for a in NAME_A for b in NAME_B]
    rng.shuffle(names)
    rows = []

    def add(kind, d, usage_obs, i):
        n = len(rows)
        hub = None if rng.random() < 0.09 else f"{int(rng.integers(10**9, 10**10 - 1))}"
        chb = None if hub is None or rng.random() < 0.05 else f"cb_{int(rng.integers(10**7, 10**8 - 1))}"
        tier = str(rng.choice(TIERS, p=[0.35, 0.4, 0.25]))
        arr = None if rng.random() < 0.1 else int(round(float(rng.lognormal(10.6, 0.7)) * {"Core": 0.7, "Plus": 1.0, "Performance": 1.6}[tier], -2))
        rows.append(dict(
            id=f"a{n + 1}", name=names[n], kind=kind, industry=str(rng.choice(INDUSTRIES)), tier=tier,
            ownerId=str(rng.choice(["u1", "u2", "u3", None], p=[0.3, 0.3, 0.3, 0.1])), hubspotId=hub, chargebeeId=chb, arr=arr,
            employees=int(rng.integers(25, 900)), tenureMonths=int(d["tenure"][i]), renewalIn=None if kind == "ONBOARDING" else int(d["renew_in"][i]),
            lastTouchDays=int(d["touch"][i]), usageYoY=None if usage_obs is None else round(float(usage_obs), 2), flags=d["flags"][i], owing=int(d["owing"][i]),
            overdueDays=int(rng.integers(5, 75)) if d["owing"][i] else 0, workItems=int(d["work"][i]), tickets90=int(d["tickets"][i]),
            championLeft=bool(d["champ"][i]), integrations=int(d["integ"][i]),
        ))

    live = sample(rng, N_LIVE)
    for i in range(N_LIVE):
        add("LIVE", live, None if rng.random() < 0.08 else live["usage"][i], i)
    onb = sample(rng, N_ONB, onboarding=True)
    for i in range(N_ONB):
        add("ONBOARDING", onb, None, i)
    ch = sample(rng, N_CHURN * 4)
    for i in np.argsort(-true_churn_prob(rng, ch))[:N_CHURN]:  # churned accounts look like the ones the process says should churn
        add("CHURNED", ch, ch["usage"][i], i)
    return rows


def build(seed=SEED):
    """Run the whole pipeline in memory. Returns (accounts, model_json, training_artifacts)."""
    rng = np.random.default_rng(seed)
    t = train(rng)
    return make_accounts(rng), export_model(t), t


def main():
    accounts, model, t = build()
    print(model["metrics"])
    (OUT / "accounts.json").write_text(json.dumps(accounts, indent=0))
    (OUT / "model.json").write_text(json.dumps(model, indent=1))
    for f, c in zip(FEATURES, model["coef"]):
        print(f"{f:16s}{c:+.3f}")


if __name__ == "__main__":
    main()
