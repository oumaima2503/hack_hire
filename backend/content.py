"""Demo content prepared by the team (adventures, missions, Box items).

Single source of truth: loaded into the in-memory store at startup and pushed to
Supabase by `seed.py`. IDs are deterministic (uuid5) so re-seeding is idempotent.
"""
import uuid

NS = uuid.UUID("6f1c2a7e-3b8d-4c1e-9a55-2d6f0b7e9c10")

AGE_BANDS = ("3-5", "6-8", "9-11")
LANGUAGES = ("en", "fr", "ar")
INTERESTS = ("animals", "nature", "art", "space", "music", "stories")
# The avatar is the child's travel buddy (favourite animal) across the whole app.
AVATARS = ("fox", "camel", "owl", "turtle", "lion", "monkey", "dino", "dolphin", "cat", "unicorn")
BOX_PRICE = 299.00
CURRENCY = "MAD"


def _id(*parts):
    return str(uuid.uuid5(NS, "/".join(parts)))


# slug, interest_tags (first = primary), motif {en, fr, ar}, {lang: (title, description)}
_ADVENTURES = [
    (
        "atlas-animals", ["animals", "nature"], ("Camel", "Dromadaire", "الجمل"),
        {
            "en": ("The Atlas Animal Trail", "Follow the tracks of camels, storks and Barbary macaques from the Atlas mountains to the Sahara, and weave each new friend into your rug."),
            "fr": ("La piste des animaux de l'Atlas", "Suis les traces des dromadaires, des cigognes et des macaques de Barbarie, des montagnes de l'Atlas jusqu'au Sahara, et tisse chaque nouvel ami dans ton tapis."),
            "ar": ("درب حيوانات الأطلس", "تتبّع آثار الجِمال واللقالق وقردة المكاك من جبال الأطلس إلى الصحراء، وانسج كل صديق جديد في زربيتك."),
        },
    ),
    (
        "oasis-garden", ["nature", "stories"], ("Palm tree", "Palmier", "النخلة"),
        {
            "en": ("Secrets of the Oasis Garden", "Discover how palm trees, water channels and desert flowers keep the oasis alive, and turn their shapes into your first rug patterns."),
            "fr": ("Les secrets du jardin de l'oasis", "Découvre comment les palmiers, les canaux d'eau et les fleurs du désert font vivre l'oasis, et transforme leurs formes en premiers motifs de tapis."),
            "ar": ("أسرار حديقة الواحة", "اكتشف كيف تحافظ النخيل وقنوات الماء وأزهار الصحراء على حياة الواحة، وحوّل أشكالها إلى أولى زخارف زربيتك."),
        },
    ),
    (
        "colour-souk", ["art", "nature"], ("Diamond", "Losange", "المعيّن"),
        {
            "en": ("The Colour Souk of Fès", "Meet the dyers of Fès, mix colours from saffron, henna and indigo, and design bold diamond patterns like a real Master Weaver."),
            "fr": ("Le souk des couleurs de Fès", "Rencontre les teinturiers de Fès, mélange les couleurs du safran, du henné et de l'indigo, et crée des losanges comme un vrai maître tisserand."),
            "ar": ("سوق الألوان في فاس", "تعرّف على صبّاغي فاس، وامزج ألوان الزعفران والحناء والنيلة، وصمّم معيّنات جريئة مثل معلّم نسّاج حقيقي."),
        },
    ),
    (
        "desert-stars", ["space", "stories"], ("Star", "Étoile", "النجمة"),
        {
            "en": ("Night of the Desert Stars", "Camp under the Sahara sky, learn how travellers used the stars to find their way, and weave a constellation rug full of stories."),
            "fr": ("La nuit des étoiles du désert", "Campe sous le ciel du Sahara, apprends comment les voyageurs se guidaient grâce aux étoiles, et tisse un tapis-constellation plein d'histoires."),
            "ar": ("ليلة نجوم الصحراء", "خيّم تحت سماء الصحراء، وتعلّم كيف اهتدى المسافرون بالنجوم، وانسج زربية كوكبات مليئة بالحكايات."),
        },
    ),
    (
        "medina-rhythms", ["music", "art"], ("Drum", "Tambour", "الطبل"),
        {
            "en": ("Rhythms of the Medina", "Follow the beat of drums and qraqeb through the medina, and discover how rhythm and repeating patterns are woven together."),
            "fr": ("Les rythmes de la médina", "Suis le son des tambours et des qraqeb à travers la médina, et découvre comment le rythme et les motifs qui se répètent se tissent ensemble."),
            "ar": ("إيقاعات المدينة القديمة", "اتبع إيقاع الطبول والقراقب في أزقة المدينة، واكتشف كيف يُنسج الإيقاع والزخارف المتكررة معاً."),
        },
    ),
    (
        "storyteller-square", ["stories", "music"], ("Lantern", "Lanterne", "الفانوس"),
        {
            "en": ("The Storyteller of Jemaa el-Fna", "Sit with the famous storytellers of Marrakech, collect magical tales and hide their symbols in a rug that tells your own story."),
            "fr": ("Le conteur de Jemaa el-Fna", "Assieds-toi avec les célèbres conteurs de Marrakech, collecte des contes magiques et cache leurs symboles dans un tapis qui raconte ton histoire."),
            "ar": ("حكواتي ساحة جامع الفنا", "اجلس مع حكواتيي مراكش المشهورين، واجمع حكايات سحرية وأخفِ رموزها في زربية تروي حكايتك."),
        },
    ),
]

_GENERIC_ADVENTURE = (
    "great-journey", [], ("Rug", "Tapis", "الزربية"),
    {
        "en": ("The Great Moroccan Journey", "Travel across Morocco, visit villages and learn the basics of weaving, step by step."),
        "fr": ("Le grand voyage marocain", "Voyage à travers le Maroc, visite des villages et apprends les bases du tissage, pas à pas."),
        "ar": ("الرحلة المغربية الكبرى", "سافر عبر المغرب، وزر القرى وتعلّم أساسيات النسيج خطوة بخطوة."),
    },
)

# (age_band, difficulty) -> {lang: template}; mission format changes with age band.
_MISSION_TEMPLATES = {
    ("3-5", 1): {"en": "Colouring time: {m}", "fr": "Coloriage : {m}", "ar": "وقت التلوين: {m}"},
    ("3-5", 2): {"en": "Hide-and-seek: {m}", "fr": "Cache-cache : {m}", "ar": "لعبة الغميضة: {m}"},
    ("3-5", 3): {"en": "Sticker builder: {m}", "fr": "Atelier autocollants : {m}", "ar": "ورشة الملصقات: {m}"},
    ("6-8", 1): {"en": "Pattern copy: {m}", "fr": "Frise à recopier : {m}", "ar": "انسخ الزخرفة: {m}"},
    ("6-8", 2): {"en": "Broken pattern rescue: {m}", "fr": "Frise cassée à réparer : {m}", "ar": "أصلح الزخرفة: {m}"},
    ("6-8", 3): {"en": "Pattern code breaker: {m}", "fr": "Code secret de la frise : {m}", "ar": "فكّ شيفرة الزخرفة: {m}"},
    ("9-11", 1): {"en": "Design sketch: {m}", "fr": "Croquis de design : {m}", "ar": "رسم تخطيطي: {m}"},
    ("9-11", 2): {"en": "Symmetry studio: {m}", "fr": "Atelier symétrie : {m}", "ar": "ورشة التناظر: {m}"},
    ("9-11", 3): {"en": "Master weaver grid: {m}", "fr": "Grille du maître tisserand : {m}", "ar": "شبكة المعلّم النسّاج: {m}"},
}
_ACTIVITY_TYPE = {"3-5": "listen_and_colour", "6-8": "pattern_puzzle", "9-11": "design_challenge"}
_DURATION_MIN = {"3-5": 10, "6-8": 15, "9-11": 20}

# interest -> {age_band: (en, fr, ar)}
_BOX = {
    "animals": {
        "3-5": ("Camel finger puppet", "Marionnette à doigt dromadaire", "دمية إصبع على شكل جمل"),
        "6-8": ("Atlas animals sticker map", "Carte à autocollants des animaux de l'Atlas", "خريطة ملصقات حيوانات الأطلس"),
        "9-11": ("Animal tracks field notebook", "Carnet de terrain des empreintes", "دفتر ميداني لآثار الحيوانات"),
    },
    "nature": {
        "3-5": ("Seed-growing kit", "Kit pour faire pousser des graines", "عدة زراعة البذور"),
        "6-8": ("Pressed-flower rug frame", "Cadre-tapis de fleurs séchées", "إطار زربية من الأزهار المجففة"),
        "9-11": ("Oasis ecosystem card game", "Jeu de cartes de l'écosystème de l'oasis", "لعبة بطاقات النظام البيئي للواحة"),
    },
    "art": {
        "3-5": ("Chunky wool & lacing card", "Grosse laine et carte à lacer", "صوف سميك وبطاقة للحياكة"),
        "6-8": ("Mini loom + 5 natural-dye yarns", "Mini métier à tisser + 5 laines teintes", "منسج صغير و5 خيوط بأصباغ طبيعية"),
        "9-11": ("Pattern-design grid pad & dye chart", "Bloc de grilles de motifs et nuancier", "دفتر شبكات للزخارف ودليل الألوان"),
    },
    "space": {
        "3-5": ("Glow-in-the-dark star stickers", "Autocollants étoiles phosphorescentes", "ملصقات نجوم مضيئة في الظلام"),
        "6-8": ("Constellation rug stencil", "Pochoir tapis-constellation", "قالب زربية الكوكبات"),
        "9-11": ("Star-map planisphere", "Planisphère céleste", "خريطة النجوم الدوّارة"),
    },
    "music": {
        "3-5": ("Mini bendir hand drum", "Mini bendir (tambour)", "بندير صغير"),
        "6-8": ("Rhythm cards set", "Jeu de cartes rythmes", "مجموعة بطاقات الإيقاع"),
        "9-11": ("Make-your-own qraqeb kit", "Kit pour fabriquer tes qraqeb", "عدة صنع القراقب"),
    },
    "stories": {
        "3-5": ("Picture storybook", "Livre d'histoires illustré", "كتاب حكايات مصوّر"),
        "6-8": ("Moroccan tales story dice", "Dés à histoires marocaines", "نرد الحكايات المغربية"),
        "9-11": ("Storyteller's journal", "Carnet du conteur", "دفتر الحكواتي"),
    },
}
_GENERIC_BOX = [
    ("Morocco adventure map poster", "Poster carte de l'aventure au Maroc", "ملصق خريطة المغامرة في المغرب"),
    ("Colouring pages & crayons", "Coloriages et crayons", "صفحات تلوين وأقلام"),
]
_NAME_CARD = ("Personalised explorer name card", "Carte d'explorateur personnalisée", "بطاقة مستكشف باسمك")


def _names(triple, key="name"):
    en, fr, ar = triple
    return en, {"fr": {key: fr}, "ar": {key: ar}}


def build_content():
    adventures, missions, box_items = [], [], []

    for slug, tags, motif, text in _ADVENTURES + [_GENERIC_ADVENTURE]:
        adv_id = _id("adventure", slug)
        adventures.append({
            "id": adv_id,
            "slug": slug,
            "title": text["en"][0],
            "description": text["en"][1],
            "interest_tags": tags,
            "cover_image_url": None,
            "is_active": True,
            "is_generic": slug == _GENERIC_ADVENTURE[0],
            "translations": {lang: {"title": t, "description": d} for lang, (t, d) in text.items() if lang != "en"},
        })
        motifs = dict(zip(LANGUAGES, motif))
        for (band, diff), tpl in _MISSION_TEMPLATES.items():
            missions.append({
                "id": _id("mission", slug, band, str(diff)),
                "adventure_id": adv_id,
                "title": tpl["en"].format(m=motifs["en"]),
                "activity_type": _ACTIVITY_TYPE[band],
                "difficulty": diff,
                "age_band": band,
                "content": {"duration_min": _DURATION_MIN[band], "steps": 2 + diff, "with_grown_up": band == "3-5"},
                "translations": {lang: {"title": tpl[lang].format(m=motifs[lang])} for lang in ("fr", "ar")},
            })

    for interest, bands in _BOX.items():
        for band, triple in bands.items():
            name, tr = _names(triple)
            box_items.append({"id": _id("box", interest, band), "name": name, "interest_tag": interest,
                              "age_band": band, "image_url": None, "translations": tr})
    for i, triple in enumerate(_GENERIC_BOX):
        name, tr = _names(triple)
        box_items.append({"id": _id("box", "generic", str(i)), "name": name, "interest_tag": "generic",
                          "age_band": "all", "image_url": None, "translations": tr})
    name, tr = _names(_NAME_CARD)
    box_items.append({"id": _id("box", "name_card"), "name": name, "interest_tag": "name_card",
                      "age_band": "all", "image_url": None, "translations": tr})

    return {"mk_adventures": adventures, "mk_missions": missions, "mk_box_items": box_items}
