"""Day 1 pre-launch funnel: events, adventure proposal, simulated Payzone checkout,
blind relevance ratings and the team dashboard (aggregates only)."""
import secrets
from collections import defaultdict

from flask import Blueprint, g, jsonify, request

from content import BOX_PRICE
from middleware import get_repo
from middleware.auth import child_route, optional_parent, parent_route
from recommend import build_proposal
from validators import clean_text, is_uuid, json_body, require

bp = Blueprint("funnel", __name__, url_prefix="/api")

VARIANTS = ("personalised", "generic")
EVENTS = {
    "landing_viewed", "step_viewed", "onboarding_started", "consent_declined", "onboarding_completed",
    "result_viewed", "checkout_started", "order_confirmed", "rating_submitted",
}
MAX_STEP = 8
# D1.2 thresholds [to confirm with My Rugy]
THRESHOLDS = {"relevance_gap": 1.0, "completion_rate": 0.70, "min_testers": 5, "min_runs": 10}
FUNNEL = [
    ("landing_viewed", None, "Landing viewed"),
    ("step_viewed", 0, "Step 0 · parent account + consent"),
    ("onboarding_started", None, "Account ready"),
    ("step_viewed", 1, "Step 1 · name + buddy"),
    ("step_viewed", 2, "Step 2 · age"),
    ("step_viewed", 3, "Step 3 · islands"),
    ("step_viewed", 4, "Step 4 · world + colour"),
    ("step_viewed", 5, "Step 5 · learning + rug style"),
    ("step_viewed", 6, "Step 6 · language"),
    ("step_viewed", 7, "Step 7 · mini-challenges"),
    ("step_viewed", 8, "Step 8 · learning profile"),
    ("onboarding_completed", None, "Onboarding completed"),
    ("result_viewed", None, "Adventure proposal viewed"),
    ("checkout_started", None, "Checkout started"),
    ("order_confirmed", None, "Order confirmed"),
]


@bp.get("/health")
def health():
    return jsonify(ok=True, storage=get_repo().name)


@bp.post("/events")
def track_event():
    d = json_body()
    require(d.get("event_name") in EVENTS, "Unknown event")
    require(isinstance(d.get("session_id"), str) and 0 < len(d["session_id"]) <= 64, "session_id required")
    step = d.get("step")
    require(step is None or (isinstance(step, int) and 0 <= step <= MAX_STEP), "Invalid step")
    # Only link the event to a child the caller actually owns.
    child_id, parent = d.get("child_id"), optional_parent()
    if child_id:
        child = get_repo().get("mk_children", child_id) if is_uuid(child_id) and parent else None
        child_id = child["id"] if child and child["parent_id"] == parent["id"] else None
    metadata = d.get("metadata") if isinstance(d.get("metadata"), dict) else {}
    metadata = {clean_text(k, 40): v for k, v in list(metadata.items())[:10]
                if isinstance(v, (str, int, float, bool)) and len(str(v)) <= 120}
    get_repo().insert("mk_funnel_events", {"session_id": clean_text(d["session_id"], 64), "child_id": child_id,
                                           "event_name": d["event_name"], "step": step, "metadata": metadata})
    return jsonify(ok=True), 201


@bp.get("/children/<child_id>/proposal")
@child_route
def proposal(child_id):
    variant = request.args.get("variant", "personalised")
    require(variant in VARIANTS, "Unknown variant")
    lang = request.args.get("lang") or g.child.get("language") or "en"
    require(lang in ("en", "fr", "ar"), "Unknown language")
    return jsonify(build_proposal(get_repo(), g.child, variant, lang))


@bp.post("/orders")
@child_route  # child_id in the body must belong to the logged-in parent
def create_order():
    d = json_body()
    variant = d.get("variant")
    require(variant in VARIANTS, "Unknown variant")
    full_name = clean_text(d.get("full_name"), 80)
    require(len(full_name) >= 2, "Full name is required for the shipping label")
    addr = d.get("shipping_address") or {}
    address = {k: clean_text(addr.get(k), 120) for k in ("line1", "city", "postal_code", "country")}
    require(address["line1"] and address["city"] and address["country"], "Shipping address is incomplete")

    repo = get_repo()
    prop = build_proposal(repo, g.child, variant, g.child.get("language") or "en")
    order = repo.insert("mk_orders", {
        "parent_id": g.parent["id"], "child_id": g.child["id"], "adventure_id": prop["adventure"]["id"],
        "variant": variant, "amount": BOX_PRICE, "shipping_address": address, "status": "pending",
    })
    return jsonify({k: order[k] for k in ("id", "status", "amount", "variant")}), 201


@bp.post("/orders/<order_id>/pay")
@parent_route
def pay_order(order_id):
    order = get_repo().get("mk_orders", order_id) if is_uuid(order_id) else None
    require(order is not None and order["parent_id"] == g.parent["id"], "Order not found", 404)
    require(order["status"] == "pending", "Order already paid", 409)
    order = get_repo().update("mk_orders", order_id, {"status": "confirmed"})
    # Demo mode: no payment provider is called.
    return jsonify(order={k: order[k] for k in ("id", "status", "amount", "variant")},
                   transaction_ref=f"PZ-DEMO-{secrets.token_hex(4).upper()}")


@bp.post("/ratings")
@child_route
def create_ratings():
    d = json_body()
    ratings = d.get("ratings")
    require(isinstance(ratings, list) and len(ratings) == 2, "Two ratings required")
    require({r.get("variant_shown") for r in ratings} == set(VARIANTS), "Rate both versions")
    require({r.get("shown_order") for r in ratings} == {1, 2}, "Invalid order")
    require(all(r.get("score") in (1, 2, 3, 4, 5) for r in ratings), "Scores must be 1-5")
    for r in ratings:
        get_repo().insert("mk_relevance_ratings", {"child_id": g.child["id"], "variant_shown": r["variant_shown"],
                                                   "shown_order": r["shown_order"], "score": r["score"]})
    return jsonify(ok=True), 201


@bp.get("/dashboard")
def dashboard():
    """Team funnel dashboard: aggregate counts only, no personal data."""
    repo = get_repo()
    sessions = defaultdict(set)  # keyed by (event, step) and by (event, None) = any step
    by_variant = defaultdict(lambda: defaultdict(set))
    for e in repo.select("mk_funnel_events"):
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
        funnel.append({"event": name, "step": step, "label": label, "sessions": n,
                       "of_landing": n / first if first else None, "of_previous": n / prev if prev else None})
        prev = n

    started = len(sessions[("onboarding_started", None)])
    completed = len(sessions[("onboarding_completed", None)])

    per_child, scores = defaultdict(dict), defaultdict(list)
    for r in sorted(repo.select("mk_relevance_ratings"), key=lambda r: r["created_at"]):
        per_child[r["child_id"]][r["variant_shown"]] = r["score"]  # latest rating wins
    for pair in per_child.values():
        for v, s in pair.items():
            scores[v].append(s)
    gaps = [p["personalised"] - p["generic"] for p in per_child.values() if len(p) == 2]

    def avg(xs):
        return sum(xs) / len(xs) if xs else None

    orders = repo.select("mk_orders", status="confirmed")
    return jsonify(
        storage=repo.name, thresholds=THRESHOLDS, funnel=funnel,
        completion={"started": started, "completed": completed, "rate": completed / started if started else None},
        relevance={"testers": len(gaps), "avg": {v: avg(scores[v]) for v in VARIANTS}, "gap": avg(gaps)},
        variants={ev: {v: len(s) for v, s in vs.items()} for ev, vs in by_variant.items()},
        orders={"confirmed": len(orders), "revenue": sum(float(o["amount"]) for o in orders),
                "by_variant": {v: sum(1 for o in orders if o["variant"] == v) for v in VARIANTS}},
    )
