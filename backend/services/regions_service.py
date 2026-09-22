"""The Moroccan regional journey, woven into the existing 8-lesson path.

The child's route visits all 12 regions, starting from their home region and
travelling outward (north→south order, shorter side first, then a flight to the
other side). Each lesson is hosted by 1-2 consecutive regions of that route, so
completing lessons = travelling across Morocco. Nothing here changes lesson
unlocking: a region is visited when its hosting lesson is completed."""
from learning_content import (DEFAULT_START_REGION, LESSON_REGION_COUNTS, REGION_ORDER, REGION_TOPIC)
from middleware import get_repo


def _ls():
    from services import learning_service  # lazy: learning_service also imports this module
    return learning_service


def regions_by_key():
    return {r["key"]: r for r in get_repo().select("mk_regions")}


def home_region(child):
    home = child.get("home_region")
    return home if home in REGION_ORDER else None


def route_for(child):
    order = list(REGION_ORDER)
    start = home_region(child) or DEFAULT_START_REGION
    i = order.index(start)
    left, right = order[:i][::-1], order[i + 1:]
    first, second = (left, right) if len(left) <= len(right) else (right, left)
    return [start] + first + second


def _counts(n_lessons):
    if n_lessons == len(LESSON_REGION_COUNTS):
        return list(LESSON_REGION_COUNTS)
    base, extra = divmod(len(REGION_ORDER), max(1, n_lessons))  # fallback if the lesson list changes
    return [base + (1 if i < extra else 0) for i in range(n_lessons)]


def regions_by_lesson(child):
    """{lesson_key: [region_key, …]} along the child's route."""
    lessons = _ls().lessons_sorted()
    route, out, i = route_for(child), {}, 0
    for lesson, n in zip(lessons, _counts(len(lessons))):
        out[lesson["key"]] = route[i:i + n]
        i += n
    return out


def region_lesson(child, region_key):
    return next((lk for lk, keys in regions_by_lesson(child).items() if region_key in keys), None)


def visited_count(child_id):
    """Regions visited = regions hosted by completed lessons (independent of the route order)."""
    ls = _ls()
    progress = ls.progress_by_lesson(child_id)
    counts = _counts(len(ls.lessons_sorted()))
    return sum(counts[l["position"] - 1] for l in ls.lessons_sorted()
               if progress.get(l["id"], {}).get("status") == "completed" and l["position"] - 1 < len(counts))


def public_region(r, topic=None):
    c = r["content"]
    out = {"key": r["key"], "name": r["name"], "short_name": r["short_name"], "emoji": r["emoji"],
           "city": c["city"], "style": c["style"], "palette": c["palette"], "fact": c["fact"],
           "description": c.get("description", ""), "theme": c.get("theme"),
           "x": c["x"], "y": c["y"]}
    if topic:
        out["stop"] = c.get(topic) or c["intro"]
    return out


def journey(child):
    """The whole route with status per region, for maps and the passport."""
    ls = _ls()
    by_key = regions_by_key()
    progress = ls.progress_by_lesson(child["id"])
    lessons = {l["key"]: l for l in ls.lessons_sorted()}
    unlocked = ls.unlocked_lesson_ids(child["id"])
    route, prev = [], None
    for lesson_key, keys in regions_by_lesson(child).items():
        lesson = lessons[lesson_key]
        done = progress.get(lesson["id"], {}).get("status") == "completed"
        status = "visited" if done else "current" if lesson["id"] in unlocked else "locked"
        for k in keys:
            adjacent = prev is None or abs(REGION_ORDER.index(k) - REGION_ORDER.index(prev)) == 1
            route.append({**public_region(by_key[k]), "status": status, "lesson_key": lesson_key,
                          "lesson_title": lesson["title"], "lesson_position": lesson["position"],
                          "travel": "start" if prev is None else "road" if adjacent else "fly",
                          "home": k == home_region(child)})
            prev = k
    visited = sum(1 for r in route if r["status"] == "visited")
    return {"home_region": home_region(child), "route": route, "visited": visited, "total": len(route),
            "current": [r for r in route if r["status"] == "current"]}


def lesson_regions(child, lesson_key):
    by_key = regions_by_key()
    topic = REGION_TOPIC.get(lesson_key, "intro")
    home = home_region(child)
    return [{**public_region(by_key[k], topic), "home": k == home} for k in regions_by_lesson(child).get(lesson_key, [])]


def region_questions(child, lesson_key):
    keys = set(regions_by_lesson(child).get(lesson_key, []))
    return [q for q in get_repo().select("mk_questions", kind="region") if q.get("region_key") in keys]


def unlocked_region_keys(child):
    ls = _ls()
    unlocked = ls.unlocked_lesson_ids(child["id"])
    lessons = {l["key"]: l for l in ls.lessons_sorted()}
    return {k for lk, keys in regions_by_lesson(child).items() if lessons[lk]["id"] in unlocked for k in keys}


def visited_regions(child):
    return [r for r in journey(child)["route"] if r["status"] == "visited"]
