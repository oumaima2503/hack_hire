"""Companion guardrails, applied on the server around every AI call.

Before the AI: messages about unsafe or adult topics, attempts to change the
companion's rules, and personal details are answered by a kind, fixed reply
(the AI is not called). After the AI: replies that ask the child for personal
information, contain links or unsafe words are replaced by a safe answer.
The system prompt also tells Gemini all of this; these checks make sure it holds
even if the model gets it wrong."""
import re

# Word-boundary patterns (EN / FR / AR). Kept conservative so normal rug talk
# ("skills", "cutting yarn with a knife", "dyes") never trips them.
_UNSAFE = {
    "self_harm": [
        r"\bkill(ing)? my ?self\b", r"\bsuicid", r"\bhurt(ing)? my ?self\b", r"\bwant(s)? to die\b", r"\bend my life\b",
        r"\bme (tuer|suicider)\b", r"\bme faire du mal\b", r"\bveux mourir\b",
        r"انتحار", r"أقتل نفسي", r"أؤذي نفسي", r"أريد أن أموت",
    ],
    "violence": [
        r"\b(kill|murder|shoot|stab)(s|ing|ed)?\b", r"\b(gun|guns|bomb|bombs|weapon|weapons|rifle|pistol)\b",
        r"\b(tuer|tue|assassiner|fusil|pistolet|bombe|armes?)\b",
        r"قتل", r"سلاح", r"قنبلة", r"مسدس",
    ],
    "adult": [
        r"\bsex(y|ual)?\b", r"\bporn", r"\bnaked\b", r"\bnudes?\b",
        r"\bsexe\b", r"\bporno", r"\btoute nue?\b",
        r"جنس", r"إباحي", r"عاري",
    ],
    "drugs": [
        r"\bdrugs?\b", r"\bcocaine\b", r"\bweed\b", r"\bcannabis\b", r"\balcohol\b", r"\bbeer\b", r"\bvodka\b", r"\bcigarettes?\b",
        r"\bdrogues?\b", r"\balcool\b", r"\bbières?\b", r"\bshit\b",
        r"مخدرات", r"خمر", r"كحول", r"حشيش",
    ],
    "rules": [
        r"\bignore (all |the |your |previous |these )*(instructions|rules)\b", r"\bsystem prompt\b", r"\bjailbreak\b",
        r"\bdeveloper mode\b", r"\b(forget|reveal|show me) your (instructions|rules|prompt)\b",
        r"\bignore (tes|les|vos) (instructions|règles)\b", r"\boublie (tes|les) (instructions|règles)\b",
        r"تجاهل التعليمات", r"انس القواعد",
    ],
    "personal": [
        r"\bmy (home )?address is\b", r"\bi live (at|on|in) \d", r"\bmy (school|password|phone( number)?) is\b",
        r"\bmon adresse (est|c'est)\b", r"\bj'habite (au|à|a) \d", r"\bmon (école|mot de passe|numéro) (est|c'est)\b",
        r"عنواني", r"رقم هاتفي", r"كلمة السر", r"مدرستي اسمها",
    ],
}
_UNSAFE_RE = {k: re.compile("|".join(v), re.IGNORECASE) for k, v in _UNSAFE.items()}
# Order matters: a child in distress gets the caring answer first.
_ORDER = ("self_harm", "adult", "violence", "drugs", "personal", "rules")

REPLIES = {
    "self_harm": {
        "en": "I'm really glad you told me. Please talk to a grown-up you trust right now, like a parent or a teacher. You matter a lot. 💛",
        "fr": "Je suis content que tu me l'aies dit. Parle tout de suite à un adulte de confiance, comme un parent ou un enseignant. Tu comptes beaucoup. 💛",
        "ar": "أنا سعيد لأنك أخبرتني. تحدث الآن مع شخص بالغ تثق به، مثل أحد والديك أو معلمك. أنت مهم جداً. 💛",
    },
    "unsafe": {
        "en": "That's not something I can talk about. If something worries you, ask a grown-up you trust. Shall we learn how rugs are woven instead? 🧶",
        "fr": "Je ne peux pas parler de ça. Si quelque chose t'inquiète, demande à un adulte de confiance. On apprend plutôt comment on tisse un tapis ? 🧶",
        "ar": "لا أستطيع التحدث عن هذا. إذا كان شيء يقلقك، اسأل شخصاً بالغاً تثق به. هل نتعلم بدلاً من ذلك كيف تُنسج الزرابي؟ 🧶",
    },
    "personal": {
        "en": "Let's keep that private! Only share it with grown-ups you trust, never online. Now, what would you like to learn about rugs? 🔒",
        "fr": "Garde ça secret ! Ne le partage qu'avec des adultes de confiance, jamais en ligne. Alors, que veux-tu apprendre sur les tapis ? 🔒",
        "ar": "لنحتفظ بهذا سراً! شاركه فقط مع الكبار الذين تثق بهم، وليس على الإنترنت. ماذا تريد أن تتعلم عن الزرابي؟ 🔒",
    },
    "rules": {
        "en": "I'm your rug-making buddy and I always stay that way! Want to hear a fun fact about Moroccan rugs? 🧶",
        "fr": "Je suis ton copain tisserand et je le reste toujours ! Tu veux un fait amusant sur les tapis marocains ? 🧶",
        "ar": "أنا رفيقك في صناعة الزرابي وسأبقى كذلك دائماً! هل تريد معلومة ممتعة عن الزرابي المغربية؟ 🧶",
    },
    "safe_fallback": {
        "en": "Let's get back to our rug adventure! Ask me about wool, looms, colours or patterns. 🧶",
        "fr": "Revenons à notre aventure du tapis ! Pose-moi une question sur la laine, le métier à tisser, les couleurs ou les motifs. 🧶",
        "ar": "لنعد إلى مغامرة الزربية! اسألني عن الصوف أو النول أو الألوان أو الزخارف. 🧶",
    },
}


def check_message(text):
    """The first guardrail category the child's message falls into, or None."""
    for kind in _ORDER:
        if _UNSAFE_RE[kind].search(text or ""):
            return kind
    return None


def reply_for(kind, lang="en"):
    key = "self_harm" if kind == "self_harm" else kind if kind in ("personal", "rules") else "unsafe"
    return REPLIES[key].get(lang) or REPLIES[key]["en"]


# ── Output checks ──
_ASKS_PERSONAL = re.compile("|".join([
    r"\b(what('s| is)|tell me) your (full |last |real )?(name|surname|address|school|phone|number|email|password)\b",
    r"\bwhere do you live\b", r"\bwhich school\b", r"\bsend (me )?(a )?(photo|picture|pic|selfie)\b",
    r"\b(quel est|c'est quoi|dis-moi) ton (nom|adresse|école|numéro|mot de passe|email)\b",
    r"\boù (est-ce que tu habites|habites-tu|tu habites)\b", r"\benvoie(-moi)? une (photo|image)\b",
    r"ما اسمك الكامل", r"أين تسكن", r"ما عنوانك", r"ما رقم هاتفك", r"أرسل (لي )?صورة",
]), re.IGNORECASE)
_LINK = re.compile(r"(https?://|www\.)\S+", re.IGNORECASE)


def check_reply(answer, lang="en"):
    """Returns (safe_answer, changed)."""
    text = _LINK.sub("", answer or "").strip()
    unsafe = next((k for k in ("self_harm", "adult", "violence", "drugs") if _UNSAFE_RE[k].search(text)), None)
    if _ASKS_PERSONAL.search(text) or unsafe or not text:
        return REPLIES["safe_fallback"].get(lang) or REPLIES["safe_fallback"]["en"], True
    return text, text != (answer or "").strip()
