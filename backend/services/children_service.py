"""Child profiles: validation of onboarding/edit fields, public shape, parent views, deletion."""
from content import AGE_BANDS, AVATARS, INTERESTS, LANGUAGES
from learning_content import COLORS, LEARNING_STYLES, REGION_ORDER, RUG_STYLES, THEMES
from middleware import get_repo
from services import games_service, learning_service as ls
from services.guide_service import learning_profile, validate_learning_profile
from validators import clean_text, require

PUBLIC_FIELDS = ("id", "name", "avatar_key", "age", "age_band", "level", "interests", "language", "selected_theme",
                 "favorite_color", "learning_style", "rug_style", "home_region", "learning_profile", "total_points",
                 "created_at")

# Tables holding one child's data (Supabase also cascades; the memory store needs this list).
CHILD_TABLES = ("mk_chat_messages", "mk_chat_sessions", "mk_child_answers", "mk_child_progress",
                "mk_child_game_progress", "mk_points_ledger", "mk_child_rewards", "mk_child_achievements",
                "mk_created_rugs", "mk_relevance_ratings", "mk_orders")


def validate_child_fields(d, child_id=None):
    """Whitelist + validate every editable profile field. Unknown keys are ignored."""
    patch = {}
    if "name" in d:
        name = clean_text(d["name"], 30)
        require(1 <= len(name) <= 30, "Name must be 1-30 characters")
        patch["name"] = name
    if "avatar_key" in d:
        require(d["avatar_key"] in AVATARS, "Unknown buddy")
        patch["avatar_key"] = d["avatar_key"]
    if "age" in d:
        require(isinstance(d["age"], int) and 3 <= d["age"] <= 11, "Age must be 3-11")
        patch["age"], patch["age_band"] = d["age"], ls.age_band_for(d["age"])
    elif "age_band" in d:
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
    if "favorite_color" in d:
        require(d["favorite_color"] in COLORS, "Unknown colour")
        patch["favorite_color"] = d["favorite_color"]
    if "learning_style" in d:
        require(d["learning_style"] in LEARNING_STYLES, "Unknown learning style")
        patch["learning_style"] = d["learning_style"]
    if "rug_style" in d:
        require(d["rug_style"] in RUG_STYLES, "Unknown rug style")
        patch["rug_style"] = d["rug_style"]
    if "home_region" in d:  # optional: null / "" = outside Morocco or not sure (journey starts in Marrakech-Safi)
        region = d["home_region"] or None
        require(region is None or region in REGION_ORDER, "Unknown region")
        patch["home_region"] = region
    if "learning_profile" in d:  # skills observed by the onboarding mini-challenges
        patch["learning_profile"] = validate_learning_profile(d["learning_profile"])
    if "selected_theme" in d:
        theme = d["selected_theme"]
        allowed = ls.available_themes(child_id) if child_id else [k for k in THEMES if k != "magic"]
        require(theme in allowed, "This world is still locked")
        patch["selected_theme"] = theme
    return patch


def child_public(child):
    return {k: child.get(k) for k in PUBLIC_FIELDS}


def create_child(parent_id, data):
    patch = validate_child_fields(data)
    require("name" in patch, "Name is required")
    child = get_repo().insert("mk_children", {"parent_id": parent_id, "interests": [], "total_points": 0, **patch})
    return child_public(child)


def delete_child(child_id):
    repo = get_repo()
    for table in CHILD_TABLES:
        repo.delete(table, child_id=child_id)
    repo.delete("mk_children", id=child_id)


def child_card(child):
    """Compact progress card for the parent dashboard."""
    repo = get_repo()
    s = ls.stats(child["id"])
    earned = {a["achievement_id"] for a in repo.select("mk_child_achievements", child_id=child["id"])}
    rugs = games_service.list_rugs(child["id"])
    ledger = repo.select("mk_points_ledger", child_id=child["id"])
    theme = ls.theme_for(child)
    return {
        **child_public(child),
        "theme": {"key": theme["key"], "name": theme["name"], "emoji": theme["emoji"], "primary": theme["colors"]["primary"]},
        "stats": s,
        "achievements": [ls.public_achievement(a) for a in repo.select("mk_achievements") if a["id"] in earned],
        "latest_rug": rugs[0] if rugs else None,
        "last_active": max((e["created_at"] for e in ledger), default=None),
    }


def child_detail_for_parent(child):
    repo = get_repo()
    messages = sorted(repo.select("mk_chat_messages", child_id=child["id"]), key=lambda m: m["created_at"])[-30:]
    return {
        **child_card(child),
        "progress": ls.progress_summary(child),
        "learning_profile": learning_profile(child),
        "rewards": ls.rewards_overview(child),
        "rugs": games_service.list_rugs(child["id"]),
        # Parents can review what their child asked the assistant.
        "chat": [{"role": m["role"], "content": m["content"], "created_at": m["created_at"]} for m in messages],
    }


def parent_dashboard(parent):
    children = sorted(get_repo().select("mk_children", parent_id=parent["id"]), key=lambda c: c["created_at"])
    return [child_card(c) for c in children]
