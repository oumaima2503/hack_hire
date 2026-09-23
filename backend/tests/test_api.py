"""End-to-end API tests on the in-memory store: `pytest -q` from backend/."""
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.pop("SUPABASE_URL", None)
os.environ.pop("SUPABASE_SERVICE_ROLE_KEY", None)
os.environ.pop("MEMORY_DB_PATH", None)
os.environ["GEMINI_API_KEY"] = ""

import config  # noqa: E402
from app import create_app  # noqa: E402
from middleware import rate_limit  # noqa: E402
from repository import MemoryRepository  # noqa: E402
from services import gemini_client  # noqa: E402

H = {"X-Requested-With": "fetch"}


@pytest.fixture()
def app():
    rate_limit.reset()
    config.GEMINI_API_KEY = ""
    return create_app(MemoryRepository())


class Client:
    def __init__(self, app):
        self.c = app.test_client()

    def get(self, url, **kw):
        return self.c.get(url, **kw)

    def post(self, url, json=None, headers=H):
        return self.c.post(url, json=json if json is not None else {}, headers=headers)

    def put(self, url, json):
        return self.c.put(url, json=json, headers=H)

    def patch(self, url, json):
        return self.c.patch(url, json=json, headers=H)

    def delete(self, url):
        return self.c.delete(url, headers=H)


def register(app, email="sara.parent@example.com", name="Sara Parent"):
    c = Client(app)
    r = c.post("/api/auth/register", {"name": name, "email": email, "password": "weave1234", "consent": True})
    assert r.status_code == 201, r.json
    return c


def make_child(c, **fields):
    r = c.post("/api/parents/children", {"name": "Adam", "avatar_key": "dino"})
    assert r.status_code == 201, r.json
    cid = r.json["id"]
    profile = {"age": 8, "interests": ["space", "art"], "selected_theme": "space", "favorite_color": "blue",
               "learning_style": "watch", "rug_style": "berber", "level": 1, "language": "en", **fields}
    assert c.patch(f"/api/children/{cid}", profile).status_code == 200
    return cid


# ───────── Auth ─────────

def test_register_login_me_logout(app):
    c = register(app)
    me = c.get("/api/auth/me").json
    assert me["parent"]["email"] == "sara.parent@example.com"
    assert "password_hash" not in str(me) and "weave1234" not in str(me)

    assert c.post("/api/auth/register", {"name": "X Y", "email": "sara.parent@example.com",
                                         "password": "weave1234", "consent": True}).status_code == 409
    assert c.post("/api/auth/logout").status_code == 200
    assert c.get("/api/auth/me").status_code == 401

    other = Client(app)
    assert other.post("/api/auth/login", {"email": "sara.parent@example.com", "password": "wrongpass1"}).status_code == 401
    r = other.post("/api/auth/login", {"email": "SARA.parent@example.com", "password": "weave1234"})
    assert r.status_code == 200 and "token" not in r.json
    assert other.get("/api/auth/me").status_code == 200


def test_password_rules_and_consent(app):
    c = Client(app)
    assert c.post("/api/auth/register", {"name": "Al", "email": "a@b.co", "password": "short", "consent": True}).status_code == 400
    assert c.post("/api/auth/register", {"name": "Al", "email": "a@b.co", "password": "longenough1", "consent": False}).status_code == 400


def test_revoked_token_is_rejected(app):
    c = register(app)
    token = c.c.get_cookie("mr_session", path="/api").value
    c.post("/api/auth/logout")
    r = app.test_client().get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_csrf_header_required_for_cookie_writes(app):
    c = register(app)
    r = c.c.post("/api/parents/children", json={"name": "Lina", "avatar_key": "fox"})  # no X-Requested-With
    assert r.status_code == 403


def test_login_rate_limit(app):
    c = Client(app)
    codes = [c.post("/api/auth/login", {"email": "x@y.co", "password": "nope12345"}).status_code for _ in range(11)]
    assert codes[-1] == 429


# ───────── Ownership ─────────

def test_parent_cannot_touch_another_parents_child(app):
    sara = register(app)
    child = make_child(sara)
    mallory = register(app, email="mallory@example.com", name="Mallory")
    for method, url, body in [
        ("get", f"/api/parents/children/{child}", None),
        ("put", f"/api/parents/children/{child}", {"name": "Hacked"}),
        ("delete", f"/api/parents/children/{child}", None),
        ("get", f"/api/children/{child}/experience", None),
        ("get", f"/api/children/{child}/progress", None),
        ("get", f"/api/children/{child}/rugs", None),
        ("post", "/api/chat", {"childId": child, "message": "hi"}),
        ("get", f"/api/chat/history?childId={child}", None),
        ("get", f"/api/children/{child}/proposal", None),
    ]:
        fn = getattr(mallory, method)
        r = fn(url) if body is None else fn(url, body)
        assert r.status_code == 404, (method, url, r.status_code)
    assert sara.get(f"/api/parents/children/{child}").json["name"] == "Adam"
    assert mallory.get("/api/parents/children").json == []
    assert app.test_client().get(f"/api/children/{child}/experience").status_code == 401


def test_parent_id_in_body_is_ignored(app):
    sara = register(app)
    mallory = register(app, email="mallory@example.com", name="Mallory")
    sara_id = sara.get("/api/auth/me").json["parent"]["id"]
    r = mallory.post("/api/parents/children", {"name": "Sneaky", "avatar_key": "fox", "parent_id": sara_id})
    assert r.status_code == 201
    assert sara.get("/api/parents/children").json == []


def test_parent_crud_and_delete(app):
    c = register(app)
    cid = make_child(c)
    assert c.put(f"/api/parents/children/{cid}", {"name": "Adam B", "selected_theme": "magic"}).status_code == 400  # locked
    assert c.put(f"/api/parents/children/{cid}", {"name": "Adam B", "selected_theme": "ocean"}).json["selected_theme"] == "ocean"
    assert c.delete(f"/api/parents/children/{cid}").status_code == 204
    assert c.get(f"/api/parents/children/{cid}").status_code == 404


# ───────── Personalisation ─────────

def test_experience_differs_by_profile(app):
    c = register(app)
    a = make_child(c, selected_theme="space", favorite_color="blue", age=5, level=3)
    b = make_child(c, selected_theme="dinosaurs", favorite_color="green", age=10, level=3, learning_style="do")
    ea, eb = c.get(f"/api/children/{a}/experience").json, c.get(f"/api/children/{b}/experience").json
    assert ea["theme"]["key"] == "space" and eb["theme"]["key"] == "dinosaurs"
    assert ea["theme"]["colors"]["primary"] != eb["theme"]["colors"]["primary"]
    assert ea["difficulty"]["level"] == 2 and ea["difficulty"]["speed_seconds"] is None  # 3-5: capped, no timer
    assert eb["difficulty"]["level"] == 3 and eb["difficulty"]["speed_seconds"] == 20
    la, lb = c.get(f"/api/children/{a}/lessons/discover").json, c.get(f"/api/children/{b}/lessons/discover").json
    assert len(la["explain"]) < len(lb["explain"])
    assert "astronaut" in la["analogy"] and "dino" in lb["analogy"]
    assert lb["sections"][0] == "cards"
    ga, gb = c.get(f"/api/children/{a}/games").json, c.get(f"/api/children/{b}/games").json
    assert ga == gb  # same catalogue, configs differ below once unlocked


def test_lessons_unlock_in_order_and_points_once(app):
    c = register(app)
    cid = make_child(c)
    assert c.get(f"/api/children/{cid}/lessons/materials").status_code == 403
    quiz = c.get(f"/api/children/{cid}/lessons/discover/quiz").json
    assert quiz and "answer" not in quiz[0]
    r = c.post(f"/api/children/{cid}/lessons/discover/video-watched").json
    assert r["award"]["points_awarded"] == 5
    assert c.post(f"/api/children/{cid}/lessons/discover/video-watched").json["award"] is None
    r = c.post(f"/api/children/{cid}/lessons/discover/complete").json
    assert r["award"]["points_awarded"] == 10 and r["next_lesson"]["key"] == "materials"
    assert r["award"]["new_achievements"][0]["key"] == "first_steps"
    assert c.post(f"/api/children/{cid}/lessons/discover/complete").json["award"] is None
    assert c.get(f"/api/children/{cid}/lessons/materials").status_code == 200


def test_answers_checked_server_side(app):
    c = register(app)
    cid = make_child(c)
    q = c.get(f"/api/children/{cid}/lessons/discover/quiz").json[0]
    wrong = next(o for o in q["options"] if o != "Covering the floor") if q["prompt"].startswith("What is a rug") else "nope"
    r1 = c.post(f"/api/children/{cid}/questions/{q['id']}/answer", {"choice": wrong}).json
    assert r1["correct"] is False and r1["hint"] and r1["correct_answer"] is None
    r2 = c.post(f"/api/children/{cid}/questions/{q['id']}/answer", {"choice": wrong}).json
    assert r2["correct_answer"]  # shown after the second miss
    r3 = c.post(f"/api/children/{cid}/questions/{q['id']}/answer", {"choice": r2["correct_answer"]}).json
    assert r3["correct"] and r3["award"]["points_awarded"] == 5
    r4 = c.post(f"/api/children/{cid}/questions/{q['id']}/answer", {"choice": r2["correct_answer"]}).json
    assert r4["award"] is None  # no farming


def _open_all_lessons(c, cid):
    for key in ["discover", "materials", "tools", "design", "weaving", "create", "challenges"]:
        assert c.post(f"/api/children/{cid}/lessons/{key}/complete").status_code == 200


def test_games_are_verified_and_rewarded(app):
    c = register(app)
    cid = make_child(c, level=2)
    assert c.get(f"/api/children/{cid}/games/match_tools").status_code == 403
    _open_all_lessons(c, cid)

    cfg = c.get(f"/api/children/{cid}/games/match_tools").json
    assert len(cfg["tools"]) == 4
    bad = {t: "Making the rug" for t in cfg["pairs"]}
    assert c.post(f"/api/children/{cid}/games/match_tools/complete", {"pairs": bad}).json["passed"] is False
    r = c.post(f"/api/children/{cid}/games/match_tools/complete", {"pairs": cfg["pairs"]}).json
    assert r["passed"] and r["award"]["points_awarded"] >= 20

    cfg = c.get(f"/api/children/{cid}/games/build_pattern").json
    assert len(cfg["target"]) == 6 and cfg["palette"][0] == "#1e7be0"  # favourite colour first
    r = c.post(f"/api/children/{cid}/games/build_pattern/complete", {"seed": cfg["seed"], "cells": cfg["target"][:-1]}).json
    assert r["passed"] is False and r["correct_positions"][-1] is False
    assert c.post(f"/api/children/{cid}/games/build_pattern/complete", {"seed": cfg["seed"], "cells": cfg["target"]}).json["passed"]

    cfg = c.get(f"/api/children/{cid}/games/order_steps").json
    assert "correct" not in cfg
    order = ["shear", "spin", "dye", "weave", "finish"]
    assert c.post(f"/api/children/{cid}/games/order_steps/complete", {"order": order[::-1]}).json["passed"] is False
    assert c.post(f"/api/children/{cid}/games/order_steps/complete", {"order": order}).json["passed"]

    cfg = c.get(f"/api/children/{cid}/games/choose_material").json
    assert len(cfg["questions"]) == 4 and "astronaut" in cfg["intro"]
    answers = {}
    for q in cfg["questions"]:
        res = None
        for opt in q["options"]:
            res = c.post(f"/api/children/{cid}/questions/{q['id']}/answer", {"choice": opt}).json
            if res["correct"]:
                answers[q["id"]] = opt
                break
    assert c.post(f"/api/children/{cid}/games/choose_material/complete", {"answers": answers}).json["passed"]

    cfg = c.get(f"/api/children/{cid}/games/challenge").json
    assert cfg["speed_seconds"] == 30
    r = c.post(f"/api/children/{cid}/games/challenge/complete", {"answers": {q["id"]: "x" for q in cfg["questions"]}}).json
    assert r["passed"] is False

    summary = c.get(f"/api/children/{cid}/progress").json
    assert summary["stats"]["games_completed"] == 4


def test_rug_studio_validation_points_and_unlocks(app):
    c = register(app)
    cid = make_child(c)
    _open_all_lessons(c, cid)
    studio = c.get(f"/api/children/{cid}/games/create_rug").json["studio"]
    rows, cols = studio["rows"], studio["cols"]
    cells = [studio["palette"][i % 3] for i in range(rows * cols)]
    bad = c.post(f"/api/children/{cid}/rugs", {"name": "<b>x</b>", "design": {"rows": rows, "cols": cols,
                                                                                "cells": ["#123456"] * rows * cols}})
    assert bad.status_code == 400
    r = c.post(f"/api/children/{cid}/rugs", {"name": "My space rug", "design": {
        "rows": rows, "cols": cols, "cells": cells, "motifs": [{"i": 0, "e": studio["motifs"][0]}], "texture": "silk"}})
    assert r.status_code == 201
    award = r.json["award"]
    assert award["points_awarded"] == 45  # rug 25 + first create_rug game 20
    # 7 lessons x10 + 45 = 115 points → Indigo Night (50) and Saffron Gold (100) unlocked
    rewards = c.get(f"/api/children/{cid}/rewards").json
    unlocked = {x["key"] for x in rewards["rewards"] if x["unlocked"]}
    assert {"indigo_night", "saffron_gold"} <= unlocked and "zigzag_river" not in unlocked
    studio2 = c.get(f"/api/children/{cid}/games/create_rug").json["studio"]
    assert "#283593" in studio2["palette"]
    earned = {a["key"] for a in rewards["achievements"] if a["earned"]}
    assert {"first_steps", "first_rug", "half_way"} <= earned

    for _ in range(2):  # daily cap: only 2 rugs per day earn points
        c.post(f"/api/children/{cid}/rugs", {"name": "again", "design": {"rows": rows, "cols": cols, "cells": cells}})
    ledger = [e for e in c.get(f"/api/children/{cid}/progress").json["recent_points"] if e["reason"] == "rug_created"]
    assert sum(e["points"] for e in ledger) == 50


def test_parent_dashboard_cards(app):
    c = register(app)
    a, b = make_child(c), make_child(c, selected_theme="ocean")
    c.post(f"/api/children/{a}/lessons/discover/complete")
    cards = c.get("/api/parents/dashboard").json["children"]
    assert [x["id"] for x in cards] == [a, b]
    assert cards[0]["stats"]["total_points"] == 10 and cards[0]["stats"]["lessons_completed"] == 1
    assert cards[1]["theme"]["key"] == "ocean"


# ───────── Chat ─────────

def test_chat_offline_quiz_hint_does_not_leak_answer(app):
    c = register(app)
    cid = make_child(c)
    q = c.get(f"/api/children/{cid}/lessons/discover/quiz").json[0]
    r = c.post("/api/chat", {"childId": cid, "message": "which one??", "lessonId": "discover", "questionId": q["id"]})
    assert r.status_code == 200 and r.json["source"] == "offline" and "hint" in r.json["reply"].lower()
    hist = c.get(f"/api/chat/history?childId={cid}&lessonId=discover").json
    assert [m["role"] for m in hist] == ["user", "assistant"]


def test_chat_prompt_is_personalised_private_and_rate_limited(app, monkeypatch):
    c = register(app)
    cid = make_child(c, selected_theme="dinosaurs", age=8)
    captured = {}

    def fake_generate(system_prompt, history, message):
        captured.update(system=system_prompt, message=message)
        return "Think about the **fluffy** animal! 🦕"

    monkeypatch.setattr(config, "GEMINI_API_KEY", "test-key-not-real")
    monkeypatch.setattr(gemini_client, "generate", fake_generate)
    r = c.post("/api/chat", {"childId": cid, "lessonId": "discover",
                             "message": "my email is adam@home.com and phone +212 600 112233, what is wool?"}).json
    assert r["source"] == "gemini" and "**" not in r["reply"]
    assert "Adam" not in captured["system"] and "adam@home.com" not in captured["message"]
    assert "+212" not in captured["message"] and "Dinosaurs" in captured["system"] and "aged 8" in captured["system"]
    assert "test-key-not-real" not in str(r)
    codes = [c.post("/api/chat", {"childId": cid, "message": "hi"}).status_code for _ in range(10)]
    assert 429 in codes


def test_companion_voice_chat_uses_animal_page_and_spoken_style(app, monkeypatch):
    c = register(app)
    cid = make_child(c, age=5)  # avatar: dino
    captured = {}

    def fake_generate(system_prompt, history, message):
        captured.update(system=system_prompt)
        return "Wool comes from sheep!"

    monkeypatch.setattr(config, "GEMINI_API_KEY", "test-key-not-real")
    monkeypatch.setattr(gemini_client, "generate", fake_generate)
    r = c.post("/api/chat", {"childId": cid, "message": "where does wool come from", "page": "rewards", "voice": True})
    assert r.status_code == 200
    assert "little dinosaur companion" in captured["system"] and "rewards" in captured["system"]
    assert "spoken aloud" in captured["system"] and "aged 5" in captured["system"]
    # unknown pages are ignored, text chat keeps the written style
    c.post("/api/chat", {"childId": cid, "message": "hi", "page": "<script>"})
    assert "<script>" not in captured["system"] and "spoken aloud" not in captured["system"]


# ───────── Funnel still works ─────────

def test_funnel_flow_still_works(app):
    c = register(app)
    cid = make_child(c)
    c.post("/api/events", {"session_id": "s1", "event_name": "landing_viewed"})
    c.post("/api/events", {"session_id": "s1", "event_name": "step_viewed", "step": 7, "child_id": cid})
    p = c.get(f"/api/children/{cid}/proposal?variant=personalised").json
    assert p["adventure"]["slug"] in ("desert-stars", "colour-souk")
    order = c.post("/api/orders", {"child_id": cid, "variant": "personalised", "full_name": "Sara Parent",
                                   "shipping_address": {"line1": "1 rue", "city": "Rabat", "country": "Maroc"}}).json
    assert c.post(f"/api/orders/{order['id']}/pay").json["order"]["status"] == "confirmed"
    mallory = register(app, email="m@example.com", name="Mallory")
    assert mallory.post(f"/api/orders/{order['id']}/pay").status_code == 404
    assert c.post("/api/ratings", {"child_id": cid, "ratings": [
        {"variant_shown": "personalised", "shown_order": 1, "score": 5},
        {"variant_shown": "generic", "shown_order": 2, "score": 3}]}).status_code == 201
    d = app.test_client().get("/api/dashboard").json
    assert d["relevance"]["gap"] == 2 and d["orders"]["confirmed"] == 1
    assert "sara" not in str(d).lower()


# ───────── Moroccan regional journey ─────────

ALL_REGIONS = {"tanger_tetouan_al_hoceima", "oriental", "fes_meknes", "rabat_sale_kenitra", "casablanca_settat",
               "beni_mellal_khenifra", "marrakech_safi", "draa_tafilalet", "souss_massa", "guelmim_oued_noun",
               "laayoune_sakia_el_hamra", "dakhla_oued_ed_dahab"}


def test_route_covers_all_regions_starting_from_home(app):
    c = register(app)
    fes = make_child(c, home_region="fes_meknes")
    none = make_child(c)
    j = c.get(f"/api/children/{fes}/experience").json["regions"]
    keys = [r["key"] for r in j["route"]]
    assert set(keys) == ALL_REGIONS and len(keys) == 12
    assert keys[0] == "fes_meknes" and j["route"][0]["home"] and j["home_region"] == "fes_meknes"
    assert j["visited"] == 0 and [r["key"] for r in j["current"]] == ["fes_meknes"]
    assert any(r["travel"] == "fly" for r in j["route"])  # one flight to the other side of Morocco
    assert c.get(f"/api/children/{none}/experience").json["regions"]["route"][0]["key"] == "marrakech_safi"
    assert c.patch(f"/api/children/{none}", {"home_region": "atlantis"}).status_code == 400
    assert c.patch(f"/api/children/{none}", {"home_region": None}).status_code == 200


def test_regional_stops_follow_the_lesson_topic(app):
    c = register(app)
    cid = make_child(c, home_region="dakhla_oued_ed_dahab")
    lessons = c.get(f"/api/children/{cid}/lessons").json
    assert [len(l["regions"]) for l in lessons] == [1, 2, 1, 2, 1, 2, 1, 2]
    assert lessons[0]["regions"][0]["key"] == "dakhla_oued_ed_dahab"
    stop = c.get(f"/api/children/{cid}/lessons/discover").json["regions"][0]
    assert stop["home"] and "Sahara meets the Atlantic" in stop["stop"]  # 'intro' text for Discover
    c.post(f"/api/children/{cid}/lessons/discover/complete")
    mats = c.get(f"/api/children/{cid}/lessons/materials").json["regions"]
    assert [r["key"] for r in mats] == ["laayoune_sakia_el_hamra", "guelmim_oued_noun"]
    assert "camel hair" in mats[0]["stop"]  # 'materials' text for Choose Materials


def test_region_questions_checked_and_locked_until_reached(app):
    c = register(app)
    cid = make_child(c, home_region="marrakech_safi")
    quiz = c.get(f"/api/children/{cid}/lessons/discover/quiz").json
    region_q = next(q for q in quiz if "Chichaoua" in q["prompt"])
    r = c.post(f"/api/children/{cid}/questions/{region_q['id']}/answer", {"choice": "Red"}).json
    assert r["correct"] and r["award"]["points_awarded"] == 5
    far = next(q for q in app.extensions["repo"].select("mk_questions", kind="region") if q["region_key"] == "tanger_tetouan_al_hoceima")
    assert c.post(f"/api/children/{cid}/questions/{far['id']}/answer", {"choice": "x"}).status_code == 403


def test_regions_visited_unlock_colours_and_achievement(app):
    c = register(app)
    cid = make_child(c, home_region="souss_massa")
    for key in ["discover", "materials", "tools", "design", "weaving", "create", "challenges", "unlock"]:
        assert c.post(f"/api/children/{cid}/lessons/{key}/complete").status_code == 200
    exp = c.get(f"/api/children/{cid}/experience").json
    assert exp["regions"]["visited"] == 12 and exp["progress"]["regions_visited"] == 12
    earned = {a["key"] for a in c.get(f"/api/children/{cid}/rewards").json["achievements"] if a["earned"]}
    assert {"region_hopper", "all_morocco"} <= earned
    studio = c.get(f"/api/children/{cid}/games/create_rug").json["studio"]
    assert "#6a994e" in studio["palette"] and "🌳" in studio["motifs"]  # Souss-Massa colour + emblem
    assert len(c.get(f"/api/parents/children/{cid}").json["progress"]["regions"]["route"]) == 12

# ───────── MyRugy Guide: learning profile, prefs, progressive hints ─────────

def test_learning_profile_and_guide_prefs(app):
    c = register(app)
    cid = make_child(c, learning_style="do", age=10)
    skills = {"pattern_recognition": "strong", "sequencing": "practice", "visual_matching": "medium", "material_recognition": "strong"}
    assert c.patch(f"/api/children/{cid}", {"learning_profile": {"skills": {"sequencing": "genius"}}}).status_code == 400
    assert c.patch(f"/api/children/{cid}", {"learning_profile": {"skills": skills}}).status_code == 200
    p = c.get(f"/api/children/{cid}/learning-profile").json
    assert p["skills"] == skills and p["learning_style"] == "Do" and p["assessed"] and p["adventure_level"] == "Beginner"
    assert "score" not in str(p).lower()
    exp = c.get(f"/api/children/{cid}/experience").json
    g = exp["guide"]
    assert g["name"] == "MyRugy" and g["intro_mode"] == "try_first" and g["verbosity"] == "detailed"
    assert g["support"]["order_steps"] == "extra" and g["support"]["build_pattern"] == "light"
    assert exp["learning_profile"]["skills"] == skills


def test_progressive_hints_never_reveal_answers(app):
    c = register(app)
    cid = make_child(c, level=2, language="fr")
    for key in ["discover", "materials", "tools", "design", "weaving", "create", "challenges"]:
        c.post(f"/api/children/{cid}/lessons/{key}/complete")
    hint = lambda key, level, **body: c.post(f"/api/children/{cid}/games/{key}/hint", {"level": level, **body}).json  # noqa: E731

    assert hint("order_steps", 1)["text"]  # encouragement, in French
    cfg = c.get(f"/api/children/{cid}/games/order_steps").json
    assert cfg["plays"] == 0
    h3 = hint("order_steps", 3, state={"order": [s["id"] for s in cfg["steps"]]})
    assert "place" in h3["text"] and h3["level"] == 3  # one placement, the child still orders the rest

    mat = c.get(f"/api/children/{cid}/games/choose_material").json["questions"][0]
    h2 = hint("choose_material", 2, questionId=mat["id"])
    h3 = hint("choose_material", 3, questionId=mat["id"])
    answer = next(q["answer"] for q in app.extensions["repo"].select("mk_questions", id=mat["id"]))
    assert h2["text"].startswith("Indice") and answer not in h3["text"].replace("Ce n'est pas", "")

    pat = c.get(f"/api/children/{cid}/games/build_pattern").json
    assert "case 1" in hint("build_pattern", 3, state={"seed": pat["seed"], "cells": []})["text"]
    assert c.post(f"/api/children/{cid}/games/build_pattern/complete", {"seed": pat["seed"], "cells": pat["target"]}).json["passed"]
    assert c.get(f"/api/children/{cid}/games/build_pattern").json["plays"] == 1

    other = make_child(c)
    assert c.post(f"/api/children/{other}/games/order_steps/hint", {"level": 2}).status_code == 403  # still locked


def test_onboarding_profile_step_and_chat_game_state(app):
    c = register(app)
    cid = make_child(c)
    assert c.post("/api/events", {"session_id": "s", "event_name": "step_viewed", "step": 8}).status_code == 201
    r = c.post("/api/chat", {"childId": cid, "message": "help", "gameKey": "order_steps",
                             "gameState": {"mistakes": 3, "hints": "x", "note": "<b>stuck</b>"}})
    assert r.status_code == 200 and r.json["guide"]["name"] == c.get(f"/api/children/{cid}/experience").json["theme"]["guide"]["name"]