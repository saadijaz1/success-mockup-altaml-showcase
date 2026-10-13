"""Tests for the Orbit churn model: data generation, training, the exported weights and the scoring twin."""
import copy
import json

import numpy as np
import pytest

import train_churn_model as m

ORBIT = m.OUT
SEVERITIES = set(m.SEV_W)


@pytest.fixture(scope="module")
def built():
    accounts, model, t = m.build()
    return accounts, model, t


@pytest.fixture(scope="module")
def committed():
    return json.loads((ORBIT / "accounts.json").read_text()), json.loads((ORBIT / "model.json").read_text())


def healthy_account(**over):
    base = dict(usageYoY=0.1, lastTouchDays=20, flags=[], owing=0, renewalIn=300, tenureMonths=36, tickets90=1, championLeft=False, integrations=3, workItems=0)
    return {**base, **over}


# ---------- helpers ----------

def test_flag_score_weights_severities():
    assert m.flag_score([]) == 0
    assert m.flag_score(["LOW", "CRITICAL"]) == 5
    assert m.flag_score(["MEDIUM", "HIGH", "HIGH"]) == 8


def test_renewal_pressure_rises_as_renewal_nears():
    assert m.renewal_pressure(0) == 1
    assert m.renewal_pressure(90) == pytest.approx(0.5)
    assert m.renewal_pressure(180) == 0
    assert m.renewal_pressure(400) == 0  # far-off renewals add no pressure


@pytest.mark.parametrize("p,expected", [(0.0, "healthy"), (0.079, "healthy"), (0.08, "watch"), (0.199, "watch"), (0.20, "at_risk"), (0.379, "at_risk"), (0.38, "critical"), (0.99, "critical")])
def test_band_cutoffs(p, expected):
    assert m.band(p) == expected


def test_band_cutoffs_are_ordered():
    b = m.BANDS
    assert 0 < b["watch"] < b["atRisk"] < b["critical"] < 1


# ---------- synthetic data ----------

def test_sample_is_valid_and_reproducible():
    a = m.sample(np.random.default_rng(1), 60)
    b = m.sample(np.random.default_rng(1), 60)
    assert a["flags"] == b["flags"] and np.array_equal(a["usage"], b["usage"])
    assert len(a["flags"]) == 60
    assert all(s in SEVERITIES for f in a["flags"] for s in f)
    assert a["usage"].min() >= -0.9 and a["usage"].max() <= 0.8
    assert a["touch"].min() >= 1 and a["touch"].max() <= 240
    assert (a["owing"] >= 0).all() and (a["tickets"] >= 0).all()


def test_onboarding_sample_is_new_customers():
    d = m.sample(np.random.default_rng(2), 40, onboarding=True)
    assert d["tenure"].max() < 6


def test_true_churn_prob_is_a_probability_and_responds_to_risk():
    rng = np.random.default_rng(3)
    d = m.sample(rng, 2000)
    p = m.true_churn_prob(rng, d)
    assert ((p > 0) & (p < 1)).all()
    quiet = d["touch"] > np.median(d["touch"])
    assert p[quiet].mean() > p[~quiet].mean()  # long silence means higher churn on average


# ---------- training ----------

def test_training_is_deterministic(built):
    _, model, _ = built
    again = m.export_model(m.train(np.random.default_rng(m.SEED)))
    assert again["coef"] == model["coef"]
    assert again["intercept"] == model["intercept"]


def test_model_beats_chance_by_a_clear_margin(built):
    assert built[1]["metrics"]["aucLogistic"] >= 0.75


def test_logistic_regression_is_close_to_gradient_boosting(built):
    # The explainable model is deployed on the strength of this: it should give up almost nothing.
    mt = built[1]["metrics"]
    assert mt["aucLogistic"] >= mt["aucGradientBoosting"] - 0.02


def test_probabilities_are_calibrated_on_held_out_data(built):
    t = built[2]
    assert abs(t["p_lr"].mean() - t["yte"].mean()) < 0.02


def test_coefficient_signs_make_business_sense(built):
    coef = dict(zip(m.FEATURES, built[1]["coef"]))
    for f in ["lastTouchDays", "flagScore", "owingK", "renewalPressure", "tickets90", "championLeft"]:
        assert coef[f] > 0, f"{f} should raise churn risk"
    for f in ["usageYoY", "tenureMonths", "integrations"]:
        assert coef[f] < 0, f"{f} should lower churn risk"


def test_export_has_every_feature_and_finite_weights(built):
    model = built[1]
    n = len(m.FEATURES)
    assert model["features"] == m.FEATURES
    assert len(model["coef"]) == len(model["mean"]) == len(model["scale"]) == n
    assert all(np.isfinite(model["coef"] + model["mean"] + model["scale"] + [model["intercept"]]))
    assert all(s > 0 for s in model["scale"])


def test_exported_weights_reproduce_sklearn_predictions(built):
    # The front end only sees model.json, so applying it by hand must match the trained model.
    _, model, t = built
    X = t["Xte"][:300]
    z = model["intercept"] + ((X - np.array(model["mean"])) / np.array(model["scale"])) @ np.array(model["coef"])
    manual = 1 / (1 + np.exp(-z))
    assert np.allclose(manual, t["lr"].predict_proba(t["sc"].transform(X))[:, 1], atol=1e-4)


# ---------- scoring twin ----------

def test_score_is_a_probability(built):
    p = m.score_account(built[1], healthy_account())
    assert 0 < p < 1


@pytest.mark.parametrize("worse", [
    dict(flags=["HIGH", "HIGH"]), dict(usageYoY=-0.5), dict(lastTouchDays=150), dict(championLeft=True),
    dict(owing=20000), dict(tickets90=8), dict(renewalIn=30, lastTouchDays=80), dict(integrations=0), dict(tenureMonths=4),
])
def test_worse_signals_raise_risk(built, worse):
    model = built[1]
    assert m.score_account(model, healthy_account(**worse)) > m.score_account(model, healthy_account())


def test_more_severe_flags_raise_risk_in_order(built):
    model = built[1]
    ps = [m.score_account(model, healthy_account(flags=f)) for f in ([], ["LOW"], ["HIGH"], ["HIGH", "CRITICAL"])]
    assert ps == sorted(ps) and len(set(ps)) == 4


def test_missing_usage_is_scored_as_the_average_account(built):
    model = built[1]
    assert m.score_account(model, healthy_account(usageYoY=None)) == pytest.approx(m.score_account(model, healthy_account(usageYoY=model["usageImpute"])))


def test_onboarding_account_without_renewal_is_scored(built):
    p = m.score_account(built[1], healthy_account(renewalIn=None, tenureMonths=1, usageYoY=None))
    assert 0 < p < 1


def test_scoring_does_not_mutate_the_account(built):
    a = healthy_account(flags=["LOW"])
    snapshot = copy.deepcopy(a)
    m.score_account(built[1], a)
    assert a == snapshot


# ---------- generated accounts ----------

def test_account_counts_and_identity(built):
    accounts = built[0]
    kinds = [a["kind"] for a in accounts]
    assert (kinds.count("LIVE"), kinds.count("ONBOARDING"), kinds.count("CHURNED")) == (m.N_LIVE, m.N_ONB, m.N_CHURN)
    assert len({a["id"] for a in accounts}) == len(accounts)
    assert len({a["name"] for a in accounts}) == len(accounts)


def test_account_fields_are_valid(built):
    for a in built[0]:
        assert a["tier"] in m.TIERS and a["industry"] in m.INDUSTRIES
        assert all(s in SEVERITIES for s in a["flags"])
        assert a["lastTouchDays"] >= 1 and a["tenureMonths"] >= 0 and a["employees"] >= 25
        assert (a["owing"] > 0) == (a["overdueDays"] > 0)  # overdue days only exist when something is owed
        if a["usageYoY"] is not None:
            assert -0.9 <= a["usageYoY"] <= 0.8
        if a["arr"] is not None:
            assert a["arr"] > 0
        if a["chargebeeId"]:
            assert a["hubspotId"], "a billing id without a CRM id would be an orphan"


def test_onboarding_accounts_have_no_renewal_and_no_usage_history(built):
    onb = [a for a in built[0] if a["kind"] == "ONBOARDING"]
    assert onb and all(a["renewalIn"] is None and a["usageYoY"] is None and a["tenureMonths"] < 6 for a in onb)


def test_some_accounts_lack_data_to_exercise_the_not_enough_data_path(built):
    shown = [a for a in built[0] if a["kind"] != "CHURNED"]
    assert any(a["hubspotId"] is None for a in shown)
    assert any(a["usageYoY"] is None for a in shown)


def test_scored_distribution_is_not_degenerate(built):
    accounts, model, _ = built
    counts = {}
    for a in accounts:
        if a["kind"] == "CHURNED":
            continue
        p = m.score_account(model, a)
        assert np.isfinite(p) and 0 < p < 1
        counts[m.band(p)] = counts.get(m.band(p), 0) + 1
    assert all(counts.get(b, 0) > 0 for b in ["healthy", "watch", "at_risk"])
    shown = sum(counts.values())
    assert 0.02 <= (counts.get("at_risk", 0) + counts.get("critical", 0)) / shown <= 0.25  # a useful demo, not everything red


# ---------- committed artifacts ----------

def test_committed_accounts_match_the_pipeline(built, committed):
    # If this fails, the generator changed: rerun `python3 ml/train_churn_model.py` and commit the new JSON.
    assert json.loads(json.dumps(built[0])) == committed[0]


def test_committed_model_matches_the_pipeline(built, committed):
    fresh, saved = built[1], committed[1]
    assert fresh["features"] == saved["features"] and fresh["bands"] == saved["bands"]
    assert fresh["coef"] == pytest.approx(saved["coef"], abs=1e-3)
    assert fresh["intercept"] == pytest.approx(saved["intercept"], abs=1e-3)
    assert fresh["metrics"]["aucLogistic"] == pytest.approx(saved["metrics"]["aucLogistic"], abs=0.01)
