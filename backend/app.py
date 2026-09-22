import os
import re
import secrets
from collections import defaultdict

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

load_dotenv()

from content import AGE_BANDS, AVATARS, BOX_PRICE, INTERESTS, LANGUAGES  # noqa: E402
from recommend import build_proposal  # noqa: E402
from repository import get_repository, now_iso  # noqa: E402

CONSENT_VERSION = "2026-09-v1"
VARIANTS = ("personalised", "generic")
EVENTS = {
    "landing_viewed", "step_viewed", "onboarding_started", "consent_declined", "onboarding_completed",
    "result_viewed", "checkout_started", "order_confirmed", "rating_submitted",
}
# D1.2 thresholds [to confirm with My Rugy]
THRESHOLDS = {"relevance_gap": 1.0, "completion_rate": 0.70, "min_testers": 5, "min_runs": 10}
FUNNEL = [
    ("landing_viewed", None, "Landing viewed"),
    ("step_viewed", 0, "Step 0 · grown-up + consent"),
    ("onboarding_started", None, "Consent given"),
    ("step_viewed", 1, "Step 1 · explorer name"),
    ("step_viewed", 2, "Step 2 · age"),
    ("step_viewed", 3, "Step 3 · islands"),
    ("step_viewed", 4, "Step 4 · mini-challenges"),
    ("step_viewed", 5, "Step 5 · language"),
    ("onboarding_completed", None, "Onboarding completed"),
    ("result_viewed", None, "Adventure proposal viewed"),
    ("checkout_started", None, "Checkout started"),
    ("order_confirmed", None, "Order confirmed"),
]
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ApiError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message, self.status = message, status


def require(cond, message, status=400):
    if not cond:
        raise ApiError(message, status)


def create_app():
    app = Flask(__name__)
    CORS(app, origins=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(","))
    repo = get_repository()
    app.logger.info("Storage: %s", repo.name)

    def body():
        data = request.get_json(silent=True)
        require(isinstance(data, dict), "JSON body required")
        return data

    def get_or_404(table, row_id):
        row = repo.get(table, row_id)
        require(row is not None, "Not found", 404)
        return row

    @app.errorhandler(ApiError)
    def api_error(e):
        return jsonify(error=e.message), e.status

    @app.errorhandler(HTTPException)
    def http_error(e):
        return jsonify(error=e.description), e.code

    @app.get("/api/health")
    def health():
        return jsonify(ok=True, storage=repo.name)

    # ───────────── Funnel events ─────────────
    @app.post("/api/events")
    def track_event():
        d = body()
        require(d.get("event_name") in EVENTS, "Unknown event")
        require(isinstance(d.get("session_id"), str) and 0 < len(d["session_id"]) <= 64, "session_id required")
        step = d.get("step")
        require(step is None or (isinstance(step, int) and 0 <= step <= 5), "Invalid step")
        repo.insert("mk_funnel_events", {
            "session_id": d["session_id"],
            "child_id": d.get("child_id") or None,
            "event_name": d["event_name"],
            "step": step,
            "metadata": d.get("metadata") if isinstance(d.get("metadata"), dict) else {},
        })
        return jsonify(ok=True), 201

    # ───────────── Step 0: parent + consent ─────────────
    @app.post("/api/parents")
    def create_parent():
        d = body()
        email = str(d.get("email", "")).strip().lower()
        require(EMAIL_RE.match(email) and len(email) <= 254, "A valid email is required")
        require(d.get("consent") is True, "Parental consent is required before any child data is stored")
        parent = repo.insert("mk_parents", {
            "email": email,
            "consent_given": True,
            "consent_at": now_iso(),
            "consent_version": CONSENT_VERSION,
        })
        return jsonify(id=parent["id"]), 201

    # ───────────── Steps 1-5: child profile ─────────────
    def validate_child_fields(d):
        patch = {}
        if "name" in d:
            name = str(d["name"]).strip()
            require(1 <= len(name) <= 30, "Name must be 1-30 characters")
            patch["name"] = name
        if "avatar_key" in d:
            require(d["avatar_key"] in AVATARS, "Unknown avatar")
            patch["avatar_key"] = d["avatar_key"]
        if "age_band" in d:
            require(d["age_band"] in AGE_BANDS, "Unknown age band")
            patch["age_band"] = d["age_band"]
        if "interests" in d:
            ints = d["interests"]
            require(isinstance(ints, list) and 1 <= len(ints) <= 2 and len(set(ints)) == len(ints)
                    and all(i in INTERESTS for i in ints), "Pick 1 or 2 islands")
            patch["interests"] = ints
        if "level" in d:
            require(d["level"] in (1, 2, 3), "Level must be 1-3")
            patch["level"] = d["level"]
        if "language" in d:
            require(d["language"] in LANGUAGES, "Unknown language")
            patch["language"] = d["language"]
        return patch

    @app.post("/api/children")
    def create_child():
        d = body()
        parent = get_or_404("mk_parents", d.get("parent_id"))
        require(parent["consent_given"], "Consent missing", 403)
        patch = validate_child_fields(d)
        require("name" in patch, "Name is required")
        child = repo.insert("mk_children", {"parent_id": parent["id"], "interests": [], **patch})
        return jsonify(child), 201

    @app.patch("/api/children/<child_id>")
    def update_child(child_id):
        get_or_404("mk_children", child_id)
        patch = validate_child_fields(body())
        require(patch, "Nothing to update")
        return jsonify(repo.update("mk_children", child_id, patch))

    @app.get("/api/children/<child_id>")
    def get_child(child_id):
        return jsonify(get_or_404("mk_children", child_id))

    @app.get("/api/children/<child_id>/proposal")
    def proposal(child_id):
        child = get_or_404("mk_children", child_id)
        variant = request.args.get("variant", "personalised")
        require(variant in VARIANTS, "Unknown variant")
        lang = request.args.get("lang") or child.get("language") or "en"
        require(lang in LANGUAGES, "Unknown language")
        return jsonify(build_proposal(repo, child, variant, lang))

    # ───────────── Checkout (simulated Payzone) ─────────────
    @app.post("/api/orders")
    def create_order():
        d = body()
        child = get_or_404("mk_children", d.get("child_id"))
        variant = d.get("variant")
        require(variant in VARIANTS, "Unknown variant")
        full_name = str(d.get("full_name", "")).strip()
        require(2 <= len(full_name) <= 80, "Full name is required for the shipping label")
        addr = d.get("shipping_address") or {}
        address = {k: str(addr.get(k, "")).strip()[:120] for k in ("line1", "city", "postal_code", "country")}
        require(address["line1"] and address["city"] and address["country"], "Shipping address is incomplete")

        prop = build_proposal(repo, child, variant, child.get("language") or "en")
        repo.update("mk_parents", child["parent_id"], {"full_name": full_name})
        order = repo.insert("mk_orders", {
            "parent_id": child["parent_id"],
            "child_id": child["id"],
            "adventure_id": prop["adventure"]["id"],
            "variant": variant,
            "amount": BOX_PRICE,
            "shipping_address": address,
            "status": "pending",
        })
        return jsonify(order), 201

    @app.post("/api/orders/<order_id>/pay")
    def pay_order(order_id):
        order = get_or_404("mk_orders", order_id)
        require(order["status"] == "pending", "Order already paid", 409)
        order = repo.update("mk_orders", order_id, {"status": "confirmed"})
        # Demo mode: no payment provider is called.
        return jsonify(order=order, transaction_ref=f"PZ-DEMO-{secrets.token_hex(4).upper()}")

    # ───────────── Parent relevance test ─────────────
    @app.post("/api/ratings")
    def create_ratings():
        d = body()
        child = get_or_404("mk_children", d.get("child_id"))
        ratings = d.get("ratings")
        require(isinstance(ratings, list) and len(ratings) == 2, "Two ratings required")
        require({r.get("variant_shown") for r in ratings} == set(VARIANTS), "Rate both versions")
        require({r.get("shown_order") for r in ratings} == {1, 2}, "Invalid order")
        require(all(r.get("score") in (1, 2, 3, 4, 5) for r in ratings), "Scores must be 1-5")
        for r in ratings:
            repo.insert("mk_relevance_ratings", {
                "child_id": child["id"], "variant_shown": r["variant_shown"],
                "shown_order": r["shown_order"], "score": r["score"],
            })
        return jsonify(ok=True), 201

    # ───────────── Dashboard ─────────────
    @app.get("/api/dashboard")
    def dashboard():
        events = repo.select("mk_funnel_events")
        sessions = defaultdict(set)  # keyed by (event, step) and by (event, None) = any step
        by_variant = defaultdict(lambda: defaultdict(set))
        for e in events:
            sessions[(e["event_name"], None)].add(e["session_id"])
            if e.get("step") is not None:
                sessions[(e["event_name"], e["step"])].add(e["session_id"])
            v = (e.get("metadata") or {}).get("variant")
            if v:
                by_variant[e["event_name"]][v].add(e["session_id"])

        funnel, first, prev = [], None, None
        for name, step, label in FUNNEL:
            n = len(sessions[(name, step)])
            first = n if first is None else first
            funnel.append({
                "event": name, "step": step, "label": label, "sessions": n,
                "of_landing": n / first if first else None,
                "of_previous": n / prev if prev else None,
            })
            prev = n

        started = len(sessions[("onboarding_started", None)])
        completed = len(sessions[("onboarding_completed", None)])

        ratings = repo.select("mk_relevance_ratings")
        per_child = defaultdict(dict)
        scores = defaultdict(list)
        for r in sorted(ratings, key=lambda r: r["created_at"]):
            per_child[r["child_id"]][r["variant_shown"]] = r["score"]  # latest rating wins
        for pair in per_child.values():
            for v, s in pair.items():
                scores[v].append(s)
        gaps = [p["personalised"] - p["generic"] for p in per_child.values() if len(p) == 2]

        def avg(xs):
            return sum(xs) / len(xs) if xs else None

        orders = repo.select("mk_orders", status="confirmed")
        return jsonify(
            storage=repo.name,
            thresholds=THRESHOLDS,
            funnel=funnel,
            completion={"started": started, "completed": completed,
                        "rate": completed / started if started else None},
            relevance={
                "testers": len(gaps),
                "avg": {v: avg(scores[v]) for v in VARIANTS},
                "gap": avg(gaps),
            },
            variants={ev: {v: len(s) for v, s in vs.items()} for ev, vs in by_variant.items()},
            orders={"confirmed": len(orders), "revenue": sum(float(o["amount"]) for o in orders),
                    "by_variant": {v: sum(1 for o in orders if o["variant"] == v) for v in VARIANTS}},
        )

    return app


app = create_app()

if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", 5000)), debug=True)
