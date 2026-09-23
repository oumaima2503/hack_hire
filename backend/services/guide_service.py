"""The MyRugy Guide: an assistance layer ON TOP of the existing games.

It never chooses a game, changes rules, decides correctness or gives rewards.
It reads the child's Learning Profile and the game state to decide HOW to help:
how games are introduced, how long explanations are, and progressive hints
(1 = encouragement, 2 = conceptual clue, 3 = specific guidance, never the answer)."""
import random

from learning_content import DIFFICULTY_LABELS
from middleware import get_repo
from services import learning_service as ls
from services.games_service import game_by_key, generate_pattern, process_steps
from validators import clean_text, require

SKILLS = ("pattern_recognition", "sequencing", "visual_matching", "material_recognition")
SKILL_VALUES = ("strong", "medium", "practice")
# Which onboarding skill each existing game relies on most (only used to tune support).
GAME_SKILL = {"build_pattern": "pattern_recognition", "order_steps": "sequencing",
              "match_tools": "visual_matching", "choose_material": "material_recognition"}
STYLE_LABELS = {"watch": "Watch", "listen": "Listen", "do": "Do"}
LANG_NAMES = {"en": "English", "fr": "French", "ar": "Arabic"}


def validate_learning_profile(value):
    require(isinstance(value, dict), "Invalid learning profile")
    skills = value.get("skills")
    require(isinstance(skills, dict) and set(skills) <= set(SKILLS)
            and all(v in SKILL_VALUES for v in skills.values()), "Invalid skills")
    return {"skills": {k: skills[k] for k in SKILLS if k in skills}, "assessed_at": ls.now_iso()}


def learning_profile(child):
    """The structured Learning Profile (spec §3). Friendly labels only, never a score."""
    stored = child.get("learning_profile") or {}
    level = ls.difficulty(child)
    return {
        "age": child.get("age"),
        "level": level,
        "adventure_level": DIFFICULTY_LABELS[level],
        "interests": child.get("interests") or [],
        "learning_style": STYLE_LABELS.get(child.get("learning_style") or "watch"),
        "language": LANG_NAMES.get(child.get("language") or "en", "English"),
        "skills": stored.get("skills") or {},
        "assessed": bool(stored.get("skills")),
    }


def guide_prefs(child):
    """How the Guide presents things for this child (spec §4, §9)."""
    style = child.get("learning_style") or "watch"
    band = child.get("age_band") or "6-8"
    skills = (child.get("learning_profile") or {}).get("skills") or {}
    support = {}
    for game, skill in GAME_SKILL.items():
        value = skills.get(skill, "medium")
        support[game] = "extra" if value == "practice" else "light" if value == "strong" else "normal"
    return {
        "name": "MyRugy",
        "language": child.get("language") or "en",
        # watch → short visual demo first · listen → spoken explanation · do → try first, help after
        "intro_mode": {"watch": "demo_first", "listen": "talk_first", "do": "try_first"}.get(style, "demo_first"),
        "auto_speak": style == "listen" or band == "3-5",
        "verbosity": "short" if band == "3-5" else "detailed" if band == "9-11" else "normal",
        "support": support,  # extra: offer help after 1 mistake · normal: after 2 · light: only when asked
    }


# ───────────────────────── Progressive hints ─────────────────────────

T = {
    "encourage": {
        "en": ["Take another look. You're very close!", "You can do it! Look carefully 👀", "Good thinking! Try once more."],
        "fr": ["Regarde encore une fois. Tu y es presque !", "Tu peux le faire ! Regarde bien 👀", "Bonne idée ! Essaie encore."],
        "ar": ["انظر مرة أخرى. أنت قريب جداً!", "تستطيع ذلك! انظر جيداً 👀", "تفكير جميل! حاول مرة أخرى."],
    },
    "clue": {"en": "Clue: {x}", "fr": "Indice : {x}", "ar": "تلميح: {x}"},
    "not_this": {"en": "It is not “{x}”. 🤔", "fr": "Ce n'est pas « {x} ». 🤔", "ar": "ليس «{x}». 🤔"},
    "tool_think": {"en": "Think about the {x}: does it cut, hold, press, spin or colour?",
                   "fr": "Pense à ce que fait l'outil « {x} » : couper, tenir, tasser, filer ou colorer ?",
                   "ar": "فكّر فيما تفعله أداة «{x}»: هل تقصّ أم تمسك أم تضغط أم تغزل أم تلوّن؟"},
    "tool_not": {"en": "The {x} is not for “{y}”.", "fr": "L'outil « {x} » ne sert pas à « {y} ».",
                 "ar": "أداة «{x}» ليست لـ«{y}»."},
    "pattern_repeat": {"en": "Look at the first {n} squares of the top row. They repeat again and again!",
                       "fr": "Regarde les {n} premières cases en haut. Elles se répètent encore et encore !",
                       "ar": "انظر إلى أول {n} مربعات في الصف العلوي. إنها تتكرر مرة بعد مرة!"},
    "pattern_mirror": {"en": "The right side is a mirror of the left side 🪞",
                       "fr": "Le côté droit est le miroir du côté gauche 🪞",
                       "ar": "الجهة اليمنى مرآة للجهة اليسرى 🪞"},
    "pattern_square": {"en": "Look at square {n} in the top row, then paint square {n} the same way.",
                       "fr": "Regarde la case {n} en haut, puis peins la case {n} pareil.",
                       "ar": "انظر إلى المربع {n} في الأعلى، ثم لوّن المربع {n} بنفس الطريقة."},
    "all_good": {"en": "Everything looks right! Press Check ✓", "fr": "Tout a l'air juste ! Appuie sur Vérifier ✓",
                 "ar": "كل شيء يبدو صحيحاً! اضغط تحقّق ✓"},
    "order_think": {"en": "What do you need first? Before weaving you need yarn, and before yarn you need wool 🐑",
                    "fr": "De quoi as-tu besoin d'abord ? Avant de tisser il faut du fil, et avant le fil il faut de la laine 🐑",
                    "ar": "ماذا تحتاج أولاً؟ قبل النسج تحتاج خيطاً، وقبل الخيط تحتاج صوفاً 🐑"},
    "order_place": {"en": "“{x}” goes in place {n}.", "fr": "« {x} » va à la place {n}.", "ar": "«{x}» مكانه رقم {n}."},
    "rug_2": {"en": "Try the 🪞 mirror: paint one side and the other side copies it!",
              "fr": "Essaie le 🪞 miroir : peins un côté et l'autre côté se copie !",
              "ar": "جرّب 🪞 المرآة: لوّن جهة وستُنسخ الجهة الأخرى!"},
    "rug_3": {"en": "Pick a pattern 🔷, choose a colour, then tap your rug to stamp it.",
              "fr": "Choisis un motif 🔷 et une couleur, puis touche ton tapis pour tamponner.",
              "ar": "اختر زخرفة 🔷 ولوناً، ثم المس زربيتك لتطبعها."},
}


def _t(key, lang, **kw):
    value = T[key]
    text = value.get(lang) or value["en"]
    if isinstance(text, list):
        text = random.choice(text)
    return text.format(**kw)


def game_hint(child, key, level, state, question_id=None):
    """Progressive hint for the current game state. Uses the game engine's own data;
    the answer itself is never returned."""
    game = game_by_key(key)
    require(game["lesson_id"] in ls.unlocked_lesson_ids(child["id"]), "Finish the lessons before this game first", 403)
    require(level in (1, 2, 3), "Hint level must be 1-3")
    state = state if isinstance(state, dict) else {}
    lang = child.get("language") or "en"
    if level == 1:
        return {"level": 1, "text": _t("encourage", lang)}

    kind = game["type"]
    repo = get_repo()
    if kind in ("choose_material", "challenge"):
        q = repo.get("mk_questions", question_id) if question_id and len(str(question_id)) == 36 else None
        kinds = ("material",) if kind == "choose_material" else ("quiz", "region")
        require(q is not None and q["kind"] in kinds, "Question not found", 404)
        if level == 2:
            return {"level": 2, "text": _t("clue", lang, x=q["hint"])}
        wrong = random.choice([o for o in q["options"] if o != q["answer"]])
        return {"level": 3, "text": _t("not_this", lang, x=wrong)}

    if kind == "match_tools":
        pairs = {p["tool"]: p["purpose"] for p in game["config"]["pairs"]}
        tool = clean_text(state.get("tool"), 40)
        if tool not in pairs:
            tool = next(iter(pairs))
        if level == 2:
            return {"level": 2, "text": _t("tool_think", lang, x=tool)}
        wrong = random.choice([p for t, p in pairs.items() if t != tool])
        return {"level": 3, "text": _t("tool_not", lang, x=tool, y=wrong)}

    if kind == "build_pattern":
        seed = state.get("seed")
        cells = state.get("cells") if isinstance(state.get("cells"), list) else []
        require(isinstance(seed, int), "Pattern state required")
        d = ls.difficulty(child)
        if level == 2:
            return {"level": 2, "text": _t("pattern_mirror", lang) if d == 3 else _t("pattern_repeat", lang, n={1: 2, 2: 3}[d])}
        target = generate_pattern(child, seed)
        for i, t in enumerate(target):
            c = cells[i] if i < len(cells) and isinstance(cells[i], dict) else {}
            if c.get("color") != t["color"] or c.get("shape") != t["shape"]:
                return {"level": 3, "text": _t("pattern_square", lang, n=i + 1), "focus": i}
        return {"level": 3, "text": _t("all_good", lang)}

    if kind == "order_steps":
        if level == 2:
            return {"level": 2, "text": _t("order_think", lang)}
        steps = process_steps(game, ls.difficulty(child))
        order = state.get("order") if isinstance(state.get("order"), list) else []
        for i, (sid, emoji, label) in enumerate(steps):
            if i >= len(order) or order[i] != sid:
                return {"level": 3, "text": _t("order_place", lang, x=f"{emoji} {label}", n=i + 1), "focus": i}
        return {"level": 3, "text": _t("all_good", lang)}

    # create_rug: there is no wrong answer, hints are creative tips
    return {"level": level, "text": _t("rug_2" if level == 2 else "rug_3", lang)}
