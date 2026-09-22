"""Turns a child profile into the first adventure, first mission and Box contents.

personalised: adventure by interests, mission by age band + level, Box by interests + age band.
generic:      the is_generic adventure, a mid-level 6-8 mission and neutral Box items
              (same layout and offer, so only the relevance of the content differs).
"""
from content import BOX_PRICE, CURRENCY

GENERIC_AGE_BAND, GENERIC_LEVEL = "6-8", 2


def localize(row, lang, fields):
    out = dict(row)
    for f in fields:
        out[f] = (row.get("translations") or {}).get(lang, {}).get(f) or row.get(f)
    out.pop("translations", None)
    return out


def pick_adventure(adventures, interests):
    candidates = [a for a in adventures if a["is_active"] and not a["is_generic"]]

    def score(a):
        overlap = len(set(a["interest_tags"]) & set(interests))
        # Tie-break: the adventure whose primary theme is the child's first-chosen interest.
        primary_rank = interests.index(a["interest_tags"][0]) if a["interest_tags"][0] in interests else len(interests)
        return (overlap, -primary_rank)

    return max(candidates, key=score)


def pick_mission(missions, age_band, level):
    pool = [m for m in missions if m["age_band"] == age_band] or missions
    return min(pool, key=lambda m: abs(m["difficulty"] - level))


def build_proposal(repo, child, variant, lang):
    adventures = repo.select("mk_adventures")
    box_items = repo.select("mk_box_items")
    interests = child.get("interests") or []

    if variant == "personalised":
        adventure = pick_adventure(adventures, interests)
        age_band, level = child.get("age_band") or GENERIC_AGE_BAND, child.get("level") or GENERIC_LEVEL
        items = [i for tag in interests[:2] for i in box_items
                 if i["interest_tag"] == tag and i["age_band"] == age_band]
    else:
        adventure = next(a for a in adventures if a["is_generic"])
        age_band, level = GENERIC_AGE_BAND, GENERIC_LEVEL
        items = [i for i in box_items if i["interest_tag"] == "generic"]
    items += [i for i in box_items if i["interest_tag"] == "name_card"]

    mission = pick_mission(repo.select("mk_missions", adventure_id=adventure["id"]), age_band, level)

    return {
        "variant": variant,
        "language": lang,
        "child": {k: child.get(k) for k in ("id", "name", "avatar_key", "age_band", "level", "interests", "language")},
        "adventure": localize(adventure, lang, ("title", "description")),
        "mission": localize(mission, lang, ("title",)),
        "box": {
            "items": [localize(i, lang, ("name",)) for i in items],
            "price": BOX_PRICE,
            "currency": CURRENCY,
        },
    }
