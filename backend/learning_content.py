"""Rug-making course content and personalisation catalogues.

Content rows (lessons, games, questions, rewards, achievements) are seeded into
Supabase by `seed.py` and read back through the repository, so the team can edit
them in the database. The catalogues below (themes, colours, styles) describe
*how* a child's stored choices change the interface.
"""
import uuid

NS = uuid.UUID("0b8a8d2e-51b7-4f0e-a7a4-6c1b5f3e2d90")


def _id(*parts):
    return str(uuid.uuid5(NS, "/".join(parts)))


# ───────────────────────── Personalisation catalogues ─────────────────────────

THEMES = {
    "space": {
        "name": "Space", "emoji": "🚀", "guide": {"name": "Nova", "emoji": "👩‍🚀"},
        "colors": {"bg1": "#0b1030", "bg2": "#3a2a7a", "surface": "#f4f1ff", "text": "#1d1b3a", "secondary": "#ffcf4a"},
        "particles": ["⭐", "✨", "🪐", "🌙"], "animation": "twinkle",
        "icons": {"home": "🛸", "learn": "🔭", "games": "👾", "studio": "🧶", "rewards": "🏆", "progress": "🚀", "assistant": "👩‍🚀"},
        "vocab": {"points": "stars", "point_emoji": "⭐", "level": "Orbit", "friend": "astronaut", "thing": "rocket",
                  "place": "space station", "collect": "moon rocks", "cheer": "Out of this world"},
        "motifs": ["⭐", "🪐", "🌙", "🚀", "☄️"],
    },
    "ocean": {
        "name": "Ocean", "emoji": "🐠", "guide": {"name": "Coral", "emoji": "🐬"},
        "colors": {"bg1": "#073b4c", "bg2": "#1597a8", "surface": "#eefcff", "text": "#08323f", "secondary": "#ff8a5b"},
        "particles": ["🫧", "🐟", "🐚", "🫧"], "animation": "bubbles",
        "icons": {"home": "🏝️", "learn": "🐚", "games": "🐠", "studio": "🧶", "rewards": "💎", "progress": "🌊", "assistant": "🐬"},
        "vocab": {"points": "shells", "point_emoji": "🐚", "level": "Wave", "friend": "diver", "thing": "submarine",
                  "place": "coral reef", "collect": "pearls", "cheer": "Fin-tastic"},
        "motifs": ["🐠", "🐚", "🌊", "🐙", "🦀"],
    },
    "dinosaurs": {
        "name": "Dinosaurs", "emoji": "🦕", "guide": {"name": "Rexy", "emoji": "🦖"},
        "colors": {"bg1": "#2f4a17", "bg2": "#8fb34a", "surface": "#fbfbe9", "text": "#253312", "secondary": "#f28c28"},
        "particles": ["🌿", "🦴", "🥚", "🍃"], "animation": "stomp",
        "icons": {"home": "🌋", "learn": "🦴", "games": "🦖", "studio": "🧶", "rewards": "🥚", "progress": "🦕", "assistant": "🦖"},
        "vocab": {"points": "fossils", "point_emoji": "🦴", "level": "Era", "friend": "dino explorer", "thing": "dino egg",
                  "place": "volcano valley", "collect": "fossils", "cheer": "Dino-mite"},
        "motifs": ["🦕", "🦖", "🦴", "🌿", "🥚"],
    },
    "jungle": {
        "name": "Jungle", "emoji": "🌴", "guide": {"name": "Kiki", "emoji": "🐒"},
        "colors": {"bg1": "#133a2a", "bg2": "#4fa36f", "surface": "#f1faee", "text": "#12321f", "secondary": "#ffb703"},
        "particles": ["🍃", "🦋", "🌺", "🍃"], "animation": "leaves",
        "icons": {"home": "🛖", "learn": "🗺️", "games": "🦜", "studio": "🧶", "rewards": "🍌", "progress": "🌴", "assistant": "🐒"},
        "vocab": {"points": "leaves", "point_emoji": "🍃", "level": "Tree", "friend": "jungle ranger", "thing": "backpack",
                  "place": "rainforest", "collect": "bananas", "cheer": "Wild work"},
        "motifs": ["🦜", "🌺", "🍃", "🐒", "🦋"],
    },
    "desert": {
        "name": "Moroccan Desert", "emoji": "🐪", "guide": {"name": "Rugy", "emoji": "🧶"},
        "colors": {"bg1": "#5b2a1a", "bg2": "#d98a3d", "surface": "#fbf3e6", "text": "#3b2417", "secondary": "#f3b04a"},
        "particles": ["✨", "🌙", "⭐", "✨"], "animation": "sand",
        "icons": {"home": "🕌", "learn": "📜", "games": "🐪", "studio": "🧶", "rewards": "🏺", "progress": "🌙", "assistant": "🧶"},
        "vocab": {"points": "golden coins", "point_emoji": "🪙", "level": "Caravan", "friend": "traveller", "thing": "lantern",
                  "place": "oasis", "collect": "treasures", "cheer": "Mabrouk"},
        "motifs": ["🐪", "🌙", "⭐", "🌴", "🏮"],
    },
    "fairytale": {
        "name": "Fairy Tale", "emoji": "🏰", "guide": {"name": "Luna", "emoji": "🧚"},
        "colors": {"bg1": "#3d1a52", "bg2": "#b77fe0", "surface": "#fff5fd", "text": "#35143f", "secondary": "#ff99c8"},
        "particles": ["✨", "💫", "🌸", "✨"], "animation": "sparkle",
        "icons": {"home": "🏰", "learn": "📖", "games": "🎠", "studio": "🧶", "rewards": "👑", "progress": "🌈", "assistant": "🧚"},
        "vocab": {"points": "sparkles", "point_emoji": "✨", "level": "Castle", "friend": "little knight", "thing": "magic wand",
                  "place": "castle", "collect": "gems", "cheer": "Magical"},
        "motifs": ["🦄", "🏰", "👑", "🌸", "💫"],
    },
    # Special theme: only available once the "magic_carpet" reward is unlocked.
    "magic": {
        "name": "Magic Carpet", "emoji": "🧞", "guide": {"name": "Zaki the Genie", "emoji": "🧞"},
        "colors": {"bg1": "#1a1446", "bg2": "#7a3fb0", "surface": "#fff8e7", "text": "#2a1845", "secondary": "#ffd166"},
        "particles": ["✨", "🪔", "🌟", "💫"], "animation": "sparkle",
        "icons": {"home": "🕌", "learn": "🪔", "games": "🧞", "studio": "🧶", "rewards": "💎", "progress": "🌟", "assistant": "🧞"},
        "vocab": {"points": "wishes", "point_emoji": "🌟", "level": "Sky", "friend": "carpet pilot", "thing": "flying carpet",
                  "place": "sky palace", "collect": "wishes", "cheer": "Wish granted"},
        "motifs": ["🪔", "🌟", "🕌", "💎", "🌙"],
    },
}
BASE_THEMES = ("space", "ocean", "dinosaurs", "jungle", "desert", "fairytale")
# Children created before themes existed get one derived from their islands.
THEME_FROM_INTEREST = {"space": "space", "animals": "jungle", "nature": "jungle", "stories": "fairytale", "art": "desert", "music": "desert"}

COLORS = {
    "red": {"hex": "#e53935", "on": "#ffffff"},
    "orange": {"hex": "#f57c00", "on": "#ffffff"},
    "yellow": {"hex": "#f9c22e", "on": "#3b2417"},
    "green": {"hex": "#2e9d4f", "on": "#ffffff"},
    "blue": {"hex": "#1e7be0", "on": "#ffffff"},
    "purple": {"hex": "#8e24aa", "on": "#ffffff"},
    "pink": {"hex": "#e8508a", "on": "#ffffff"},
}

LEARNING_STYLES = {
    "watch": {"label": "Watch it", "emoji": "👀", "order": ["video", "explain", "cards", "quiz"]},
    "listen": {"label": "Listen to it", "emoji": "👂", "order": ["explain", "video", "cards", "quiz"]},
    "do": {"label": "Try it", "emoji": "✋", "order": ["cards", "video", "explain", "quiz"]},
}

RUG_STYLES = {
    "berber": {"name": "Berber diamonds", "emoji": "🔶", "shapes": ["◆", "◇", "✕", "▲"],
               "colors": ["#c4501f", "#f5ecd7", "#2a1a10"]},
    "kilim": {"name": "Kilim zigzags", "emoji": "〰️", "shapes": ["▲", "▼", "▬", "◆"],
              "colors": ["#b23a48", "#2f3a6b", "#f3b04a"]},
    "floral": {"name": "Flower garden", "emoji": "🌸", "shapes": ["✿", "❀", "●", "❦"],
               "colors": ["#e56b9f", "#4f8a3c", "#fff1c9"]},
    "modern": {"name": "Modern blocks", "emoji": "🟦", "shapes": ["■", "●", "▲", "★"],
               "colors": ["#1e88e5", "#fbc02d", "#111827"]},
}

DIFFICULTY_LABELS = {1: "Beginner", 2: "Explorer", 3: "Master"}


# ───────────────────────── Lessons ─────────────────────────
# explain[level] = sentences for reading level 1 (3-5 yrs / beginner) … 3 (advanced).
# analogy uses the child's theme vocabulary: {friend} {thing} {place} {collect}.

LESSONS = [
    {
        "key": "discover", "title": "Discover Rugs", "emoji": "🔍",
        "summary": "What is a rug, and where do Moroccan rugs come from?",
        "explain": {
            1: ["A rug is a soft blanket for the floor.",
                "In Morocco, families have made rugs by hand for hundreds of years."],
            2: ["A rug is a thick piece of fabric that covers the floor and keeps it warm and cosy.",
                "In Morocco, Amazigh (Berber) families have woven rugs by hand for hundreds of years.",
                "Every rug tells a story with its colours and shapes."],
            3: ["A rug is a thick textile that covers the floor, keeps homes warm and makes them beautiful.",
                "In Morocco, Amazigh (Berber) families have woven rugs by hand for hundreds of years, passing the skill from grandmothers to children.",
                "Weavers hide symbols in their rugs: a diamond can mean protection, and a zigzag can mean flowing water.",
                "A big handmade rug can take weeks or even months to finish!"],
        },
        "analogy": "Just like a {friend} carries a special {thing}, every family in Morocco has its own special rug!",
        "storyboard": [["🏔️", "In the Atlas mountains, a family gets ready to weave."],
                       ["🐑", "The wool comes from their own sheep."],
                       ["🧶", "Row by row, the rug grows on a wooden loom."],
                       ["🏠", "The finished rug keeps the home warm and beautiful."]],
        "cards": [["🏠", "Why rugs?", "Rugs keep floors warm in cold mountain winters."],
                  ["🎨", "Stories", "Colours and shapes in a rug can tell a family's story."],
                  ["⏳", "Patience", "A big handmade rug can take months to weave."]],
        "questions": [
            (1, "What is a rug used for?", ["Covering the floor", "Cooking food", "Flying a kite"],
             "Think about where you put a rug in your home.", "Rugs cover the floor and keep it warm."),
            (1, "Where do the rugs in our lessons come from?", ["Morocco", "The Moon", "Under the sea"],
             "Rugy the guide lives there too!", "Our rugs come from Morocco."),
            (2, "What can the colours and shapes in a rug do?", ["Tell a story", "Make music", "Keep food cold"],
             "Weavers hide little messages in their rugs…", "Colours and shapes can tell a family's story."),
            (3, "How long can a big handmade rug take to weave?", ["Months", "One minute", "One second"],
             "Remember: every knot is tied by hand!", "Tying thousands of knots by hand can take months."),
        ],
        "game": None,
    },
    {
        "key": "materials", "title": "Choose Materials", "emoji": "🐑",
        "summary": "Wool, cotton, silk and natural dyes.",
        "explain": {
            1: ["Rugs are made from wool.", "Wool is the soft, fluffy coat of a sheep."],
            2: ["Most Moroccan rugs are made from sheep's wool because it is soft, warm and strong.",
                "Strong cotton threads are often used as the base of the rug.",
                "Colours come from plants, like indigo for blue and henna for orange."],
            3: ["Most Moroccan rugs are made from sheep's wool because it is soft, warm, strong and takes colour well.",
                "Cotton threads are strong and straight, so they are often used for the warp, the base of the rug.",
                "Some special rugs use silk for shine, or camel and goat hair for strength.",
                "Natural dyes from plants and spices, like indigo, madder root, henna and saffron, colour the wool."],
        },
        "analogy": "Wool keeps a sheep warm, just like a cosy suit keeps a {friend} warm at the {place}!",
        "storyboard": [["🐑", "Once a year, the sheep get a haircut. Their wool is called fleece."],
                       ["🫧", "The wool is washed in water until it is clean and white."],
                       ["🌿", "Plants like indigo and henna are boiled to make dye."],
                       ["🌈", "The wool is dipped in the dye and dried in the sun."]],
        "cards": [["🐑", "Wool", "Soft, warm and strong: the favourite rug material!"],
                  ["☁️", "Cotton", "Strong threads for the base of the rug."],
                  ["🪻", "Indigo", "A plant that dyes wool a deep blue."]],
        "questions": [
            (1, "Where does wool come from?", ["Sheep", "Fish", "Trees"],
             "Which animal has a fluffy coat?", "Wool is the fluffy coat of a sheep."),
            (1, "Which material makes a rug soft and warm?", ["Wool", "Glass", "Stone"],
             "It comes from a fluffy animal.", "Wool is soft, warm and strong."),
            (2, "Which plant dyes wool blue?", ["Indigo", "Carrot", "Mint"],
             "Its name is also a colour of the rainbow.", "Indigo is a plant used for blue dye."),
            (3, "Which strong thread is often used for the base (the warp) of a rug?", ["Cotton", "Spaghetti", "Paper"],
             "It grows on a plant with fluffy white balls.", "Cotton threads are strong, perfect for the warp."),
        ],
        "game": "choose_material",
    },
    {
        "key": "tools", "title": "Learn the Tools", "emoji": "✂️",
        "summary": "The loom, the comb, scissors, the spindle…",
        "explain": {
            1: ["Weavers use a loom to hold the threads.", "Scissors cut the yarn."],
            2: ["A loom is a big wooden frame that holds threads tight while you weave.",
                "A weaving comb presses each row down so the rug is strong.",
                "Scissors trim the yarn to make the rug neat."],
            3: ["A loom is a wooden frame that holds the warp threads tight while you weave.",
                "A heavy weaving comb beats each row down so the rug becomes thick and strong.",
                "Scissors or a small knife trim every knot to the same height.",
                "Before weaving, carding brushes comb the wool fluffy and a spindle twists it into yarn."],
        },
        "analogy": "A {friend} needs the right tools at the {place}, and a weaver needs the right tools at the loom!",
        "storyboard": [["🪥", "Carding brushes comb the wool until it is fluffy."],
                       ["🌀", "A spindle spins the fluffy wool into long yarn."],
                       ["🪵", "The loom holds long threads called the warp."],
                       ["✂️", "Scissors trim each knot to the same size."]],
        "cards": [["🪵", "Loom", "Holds the threads tight while you weave."],
                  ["🪮", "Comb", "Presses each row down tight. Tap, tap!"],
                  ["✂️", "Scissors", "Cut and trim the yarn."]],
        "questions": [
            (1, "Which tool holds the threads while you weave?", ["Loom", "Spoon", "Pillow"],
             "It is a big wooden frame.", "The loom holds the threads tight."),
            (1, "Which tool cuts the yarn?", ["Scissors", "Brush", "Cup"],
             "Snip, snip!", "Scissors cut and trim the yarn."),
            (2, "What does the weaving comb do?", ["Presses rows down tight", "Paints the rug", "Brushes your hair"],
             "Tap, tap, tap after each row…", "The comb packs each row down tightly."),
            (3, "Which tool spins fluffy wool into yarn?", ["Spindle", "Hammer", "Ruler"],
             "It twists and turns round and round.", "A spindle twists wool into long yarn."),
        ],
        "game": "match_tools",
    },
    {
        "key": "design", "title": "Prepare the Design", "emoji": "📐",
        "summary": "Patterns, symmetry and design grids.",
        "explain": {
            1: ["Before weaving, we choose colours and shapes.", "Patterns repeat, like red, blue, red, blue."],
            2: ["Weavers plan their rug by choosing colours and shapes first.",
                "Many rugs use repeating patterns, like stripes, zigzags and diamonds.",
                "Some weavers draw the design on squared paper, where each square is one knot."],
            3: ["Weavers plan their rug by choosing a palette of colours and a set of shapes.",
                "Repeating patterns, like stripes, zigzags and diamonds, give the rug rhythm.",
                "On a design grid, each little square stands for one knot of colour.",
                "Symmetry makes rugs look balanced: the left side mirrors the right side."],
        },
        "analogy": "Planning a rug is like planning a trip to the {place}: you decide where everything goes before you start!",
        "storyboard": [["📝", "The weaver draws the design on a grid."],
                       ["🔷", "Diamonds, zigzags and stripes repeat across the rug."],
                       ["🪞", "The left side mirrors the right side: that's symmetry!"],
                       ["🎨", "Colours are chosen to look great together."]],
        "cards": [["🔁", "Pattern", "Something that repeats again and again."],
                  ["🪞", "Symmetry", "Both sides match, like in a mirror."],
                  ["▦", "Grid", "Each little square is one knot."]],
        "questions": [
            (1, "What comes next? Red, blue, red, blue, …", ["Red", "Green", "Yellow"],
             "Say the pattern out loud.", "The pattern repeats: red, blue, red, blue, red!"),
            (2, "What is a pattern?", ["Something that repeats", "A kind of sheep", "A loud noise"],
             "Stripes, zigzags, diamonds… they keep coming back!", "A pattern is something that repeats."),
            (2, "On a design grid, each square is…", ["One knot", "One whole rug", "One sheep"],
             "Think tiny!", "Each little square stands for one knot."),
            (3, "What does symmetry mean?", ["Both sides match like a mirror", "All colours are red", "The rug is round"],
             "Imagine folding the rug in half.", "Symmetry: the left side mirrors the right side."),
        ],
        "game": "build_pattern",
    },
    {
        "key": "weaving", "title": "The Weaving Process", "emoji": "🧶",
        "summary": "Warp, weft, knots and the comb.",
        "explain": {
            1: ["The weaver ties small knots of yarn onto the threads.", "Row after row, the rug grows!"],
            2: ["First, long threads called the warp are stretched on the loom.",
                "Then the weaver ties little knots of coloured yarn onto the warp, one by one.",
                "After each row, the comb presses the knots down tight."],
            3: ["First, long warp threads are stretched from the top to the bottom of the loom.",
                "The weaver ties knots of coloured yarn around pairs of warp threads, following the design.",
                "Between knot rows, a weft thread is passed across to lock everything in place.",
                "Then the comb beats the row down, and the next row begins."],
        },
        "analogy": "Each knot is like one tiny piece of {collect}: collect thousands and you get a whole rug!",
        "storyboard": [["🧵", "Long warp threads are stretched from top to bottom."],
                       ["🪢", "A little knot of yarn is tied around two warp threads."],
                       ["➡️", "A weft thread goes across to hold the row."],
                       ["🪮", "The comb presses the row down. Tap, tap, tap!"]],
        "cards": [["🧵", "Warp", "Threads that go up and down on the loom."],
                  ["➡️", "Weft", "The thread that goes across."],
                  ["🪢", "Knot", "A tiny tuft that makes the rug soft."]],
        "questions": [
            (1, "What does the weaver tie onto the threads?", ["Little knots of yarn", "Shoelaces", "Gift ribbons"],
             "They are tiny and soft.", "The weaver ties little knots of yarn."),
            (2, "What are the long threads stretched on the loom called?", ["The warp", "The wave", "The wand"],
             "It starts with W and goes up and down.", "The warp threads go from top to bottom."),
            (2, "What happens after each row of knots?", ["The comb presses it down", "The rug is washed", "The sheep is sheared"],
             "Tap, tap, tap!", "The comb presses each row tight."),
            (3, "Which thread goes across to lock the knots in place?", ["The weft", "The warp", "The fringe"],
             "The warp goes up and down; this one goes…", "The weft goes across between rows of knots."),
        ],
        "game": "order_steps",
    },
    {
        "key": "create", "title": "Create Your Rug", "emoji": "🎨",
        "summary": "Design, trim, wash and finish your own rug.",
        "explain": {
            1: ["Now it's your turn to design a rug!", "Pick colours and fill the squares."],
            2: ["Now you are the weaver! Each square on the grid is one knot.",
                "Choose your colours, add shapes and try a mirror pattern.",
                "When you finish, trim and wash: your rug is ready!"],
            3: ["Now you are the weaver! Each square on your grid is one knot of colour.",
                "Use a palette, repeating shapes and mirror symmetry to make your design balanced.",
                "Real weavers finish by trimming the pile evenly, washing the rug and tying the fringes.",
                "Give your rug a name: Moroccan weavers often name rugs after what they mean."],
        },
        "analogy": "Make a rug that a {friend} would love to take to the {place}!",
        "storyboard": [["✂️", "The weaver trims the knots so the rug is flat and even."],
                       ["🫧", "The rug is washed to make the colours shine."],
                       ["🪢", "The fringes at the ends are tied."],
                       ["🎉", "The rug is finished and ready for a home!"]],
        "cards": [["✂️", "Trim", "Cut the knots to the same height."],
                  ["🫧", "Wash", "Makes colours bright and wool soft."],
                  ["🪢", "Fringe", "Threads tied at the ends of the rug."]],
        "questions": [
            (1, "What do we do to make the knots even at the end?", ["Trim them", "Paint them", "Freeze them"],
             "Snip, snip with scissors.", "The weaver trims the knots."),
            (2, "Why is a finished rug washed?", ["To make the colours shine", "To make it smaller", "To feed the sheep"],
             "Clean things look…", "Washing makes the colours bright."),
            (2, "In your rug design, one square is…", ["One knot", "One whole rug", "One loom"],
             "Remember the design grid!", "Each square is one knot."),
            (3, "What are the threads hanging at the ends of a rug called?", ["Fringes", "Tails", "Roots"],
             "They look like a little skirt at the end.", "They are called fringes."),
        ],
        "game": "create_rug",
    },
    {
        "key": "challenges", "title": "Complete Challenges", "emoji": "🏆",
        "summary": "The Great Weaver Challenge: questions from every lesson.",
        "explain": {
            1: ["Let's see what you remember!", "Answer the questions to win a big prize."],
            2: ["Time for the Great Weaver Challenge!", "You will get questions from every lesson.",
                "Take your time, and ask your guide for a hint if you need one."],
            3: ["Time for the Great Weaver Challenge!", "You will get questions from every lesson.",
                "The timer is running, so think fast but carefully.",
                "Pass the challenge to earn a trophy and bonus points."],
        },
        "analogy": "Every {friend} trains before a big mission. This is your training!",
        "storyboard": [["🐑", "Remember: wool comes from sheep."],
                       ["🪵", "The loom holds the warp threads."],
                       ["🔷", "Patterns repeat and mirror."],
                       ["🏆", "Now show what you know!"]],
        "cards": [["🐑", "Material", "Wool, cotton, natural dyes."],
                  ["🪵", "Tools", "Loom, comb, scissors, spindle."],
                  ["🪢", "Process", "Warp, knots, weft, comb, trim."]],
        "questions": [],
        "game": "challenge",
    },
    {
        "key": "unlock", "title": "Unlock New Designs", "emoji": "🔓",
        "summary": "Moroccan symbols and the designs your points unlock.",
        "explain": {
            1: ["Your points unlock new colours and shapes!", "Keep learning to open more surprises."],
            2: ["Every lesson and game gives you points.",
                "Points unlock new colours, patterns and characters for your rugs.",
                "Moroccan symbols have meanings, like the diamond for protection."],
            3: ["Every lesson and game gives you points that unlock new colours, patterns and designs.",
                "Moroccan symbols carry meanings: a diamond can stand for protection, a zigzag for flowing water.",
                "Different regions have famous styles: Beni Ourain rugs are cream with dark diamonds.",
                "Azilal rugs are full of bright colours and playful shapes."],
        },
        "analogy": "Collect {collect} to unlock new treasures, just like a {friend} exploring the {place}!",
        "storyboard": [["🔷", "The diamond: a symbol of protection."],
                       ["〰️", "The zigzag: flowing water."],
                       ["🌸", "Flowers and plants: a happy, growing home."],
                       ["🔓", "Earn points to unlock new designs!"]],
        "cards": [["🔷", "Diamond", "Can mean protection."],
                  ["〰️", "Zigzag", "Can mean flowing water."],
                  ["🔓", "Unlocks", "Points open new colours and designs."]],
        "questions": [
            (1, "How do you unlock new colours?", ["By earning points", "By closing the app", "By shouting"],
             "Learning and playing gives you…", "Points unlock new colours and shapes."),
            (2, "In Moroccan rugs, a diamond can mean…", ["Protection", "Pizza", "Rain"],
             "It keeps you safe.", "The diamond is a symbol of protection."),
            (2, "A zigzag line can stand for…", ["Flowing water", "A pizza slice", "A sleeping cat"],
             "Think of a river.", "Zigzags can show flowing water."),
            (3, "Beni Ourain rugs are famous for…", ["Cream wool with dark diamonds", "Pictures of cars", "Being made of plastic"],
             "Soft, light colours with dark lines…", "Beni Ourain rugs are cream with dark diamonds."),
        ],
        "game": None,
    },
]

# Game 1: "Which material can be used?" rounds (kind='material', lesson 'materials').
MATERIAL_ROUNDS = [
    (1, "Which material comes from sheep and makes rugs soft and warm?", ["🐑 Wool", "🥤 Plastic", "🪟 Glass"],
     "It's fluffy and grows on an animal.", "Wool comes from sheep. It's soft and warm."),
    (1, "Which one can be spun into yarn?", ["🐑 Wool", "🪨 Stone", "🥄 Metal spoon"],
     "It must be soft and bendy.", "Wool can be spun into yarn."),
    (1, "Which one would make a scratchy, bad rug?", ["🌵 Cactus", "🐑 Wool", "☁️ Cotton"],
     "Ouch! Which one is prickly?", "A cactus is prickly: never for rugs!"),
    (2, "Which plant gives a beautiful blue dye?", ["🪻 Indigo", "🥕 Carrot", "🏖️ Sand"],
     "Its name is a colour of the rainbow.", "Indigo gives a deep blue dye."),
    (2, "Which strong thread is often used for the warp threads on the loom?", ["☁️ Cotton", "📄 Paper", "🍝 Spaghetti"],
     "It grows on a plant with white fluffy balls.", "Cotton makes strong warp threads."),
    (2, "Which shiny, precious material makes very fine rugs?", ["✨ Silk", "🧽 Sponge", "🧱 Clay"],
     "Silkworms make it!", "Silk is shiny and very fine."),
    (3, "Which natural dye gives red and orange colours?", ["🌿 Henna", "🥛 Milk", "🧂 Salt"],
     "It is also used to decorate hands in Morocco.", "Henna gives red-orange colours."),
    (3, "Which yellow spice can dye wool?", ["🌼 Saffron", "🧊 Ice", "🍫 Chocolate"],
     "It is a precious spice from crocus flowers.", "Saffron can dye wool yellow."),
    (3, "Camel hair is useful for rugs because it is…", ["💪 Strong and warm", "🔩 Made of metal", "👻 Invisible"],
     "Camels live in cold desert nights!", "Camel hair is strong and warm."),
]

TOOL_PAIRS = [
    {"tool": "Scissors", "emoji": "✂️", "purpose": "Cutting the yarn", "difficulty": 1},
    {"tool": "Loom", "emoji": "🪵", "purpose": "Holding threads for weaving", "difficulty": 1},
    {"tool": "Yarn", "emoji": "🧶", "purpose": "Making the rug", "difficulty": 1},
    {"tool": "Weaving comb", "emoji": "🪮", "purpose": "Pressing rows tight", "difficulty": 2},
    {"tool": "Spindle", "emoji": "🌀", "purpose": "Spinning wool into yarn", "difficulty": 3},
    {"tool": "Carding brushes", "emoji": "🪥", "purpose": "Combing wool fluffy", "difficulty": 3},
    {"tool": "Dye pot", "emoji": "🫕", "purpose": "Colouring the wool", "difficulty": 3},
]

PROCESS_STEPS = {
    1: [["design", "📝", "Design the rug"], ["prepare", "🧶", "Prepare the materials"],
        ["weave", "🪢", "Weave on the loom"], ["finish", "✂️", "Finish and trim"]],
    2: [["shear", "🐑", "Shear the sheep's wool"], ["spin", "🌀", "Spin the wool into yarn"],
        ["dye", "🌈", "Dye the yarn"], ["weave", "🪢", "Weave knots on the loom"], ["finish", "🫧", "Trim and wash"]],
    3: [["shear", "🐑", "Shear the wool"], ["wash", "🫧", "Wash the wool"], ["card", "🪥", "Card (comb) the wool"],
        ["spin", "🌀", "Spin it into yarn"], ["dye", "🌈", "Dye the yarn"], ["weave", "🪢", "Warp the loom and tie knots"],
        ["finish", "✂️", "Beat, trim and wash the rug"]],
}

GAMES = [
    {"key": "choose_material", "lesson": "materials", "type": "choose_material", "title": "Choose the Material", "emoji": "🐑",
     "config": {}},
    {"key": "match_tools", "lesson": "tools", "type": "match_tools", "title": "Match the Tools", "emoji": "🧰",
     "config": {"pairs": TOOL_PAIRS}},
    {"key": "build_pattern", "lesson": "design", "type": "build_pattern", "title": "Build the Pattern", "emoji": "🔷",
     "config": {}},
    {"key": "order_steps", "lesson": "weaving", "type": "order_steps", "title": "Order the Steps", "emoji": "🔢",
     "config": {"steps": {str(k): v for k, v in PROCESS_STEPS.items()}}},
    {"key": "create_rug", "lesson": "create", "type": "create_rug", "title": "Create Your Own Rug", "emoji": "🧶",
     "config": {}},
    {"key": "challenge", "lesson": "challenges", "type": "challenge", "title": "The Great Weaver Challenge", "emoji": "🏆",
     "config": {"pass_ratio": 0.6}},
]

# Stamps are small 0/1 masks painted with the current colour in the rug studio.
REWARDS = [
    ("indigo_night", "color", "Indigo Night", "🟦", 50, {"hex": "#283593"}),
    ("saffron_gold", "color", "Saffron Gold", "🟨", 100, {"hex": "#f4b400"}),
    ("zigzag_river", "pattern", "Zigzag River", "〰️", 150, {"stamp": [[1, 0, 0, 0, 1], [0, 1, 0, 1, 0], [0, 0, 1, 0, 0]]}),
    ("berber_diamond", "pattern", "Berber Diamond", "🔷", 200, {"stamp": [[0, 1, 0], [1, 0, 1], [0, 1, 0]]}),
    ("golden_camel", "character", "Golden Camel", "🐪", 300, {"motif": "🐪", "avatar": "camel"}),
    ("henna_red", "color", "Henna Red", "🟥", 400, {"hex": "#b3261e"}),
    ("fes_medallion", "design", "Royal Fès Medallion", "🏵️", 500, {"template": "medallion"}),
    ("magic_carpet", "theme", "Magic Carpet Theme", "🧞", 750, {"theme": "magic"}),
    ("master_workshop", "workshop", "Master Weaver Workshop", "👑", 1000, {"grid": [16, 20]}),
]

ACHIEVEMENTS = [
    ("first_steps", "First Steps", "Complete your first lesson", "🎓", {"type": "lessons_completed", "count": 1}),
    ("game_on", "Game On", "Finish your first game", "🎮", {"type": "games_completed", "count": 1}),
    ("sharp_mind", "Sharp Mind", "Answer 10 questions correctly", "🧠", {"type": "correct_answers", "count": 10}),
    ("first_rug", "First Rug", "Create your first rug", "🧶", {"type": "rugs_created", "count": 1}),
    ("half_way", "Half Way There", "Complete 4 lessons", "🗺️", {"type": "lessons_completed", "count": 4}),
    ("rug_collector", "Rug Collector", "Create 5 rugs", "🖼️", {"type": "rugs_created", "count": 5}),
    ("challenge_champion", "Challenge Champion", "Pass the Great Weaver Challenge", "🏆", {"type": "challenge_passed", "count": 1}),
    ("master_weaver", "Master Weaver", "Complete all 8 lessons", "👑", {"type": "lessons_completed", "count": 8}),
    ("streak_3", "On Fire", "Learn 3 days in a row", "🔥", {"type": "streak_days", "count": 3}),
    ("treasure_500", "Treasure Hunter", "Earn 500 points", "💎", {"type": "total_points", "count": 500}),
]


def build_learning_content():
    lessons, games, questions, rewards, achievements = [], [], [], [], []
    lesson_ids = {}
    for pos, l in enumerate(LESSONS, start=1):
        lid = _id("lesson", l["key"])
        lesson_ids[l["key"]] = lid
        lessons.append({
            "id": lid, "key": l["key"], "position": pos, "title": l["title"], "emoji": l["emoji"],
            "summary": l["summary"], "video_url": None,
            "content": {"explain": {str(k): v for k, v in l["explain"].items()}, "analogy": l["analogy"],
                        "storyboard": l["storyboard"], "cards": l["cards"], "game": l["game"]},
        })
        for i, (diff, prompt, options, hint, expl) in enumerate(l["questions"]):
            questions.append({"id": _id("question", l["key"], str(i)), "lesson_id": lid, "kind": "quiz",
                              "difficulty": diff, "prompt": prompt, "options": options, "answer": options[0],
                              "hint": hint, "explanation": expl})
    for i, (diff, prompt, options, hint, expl) in enumerate(MATERIAL_ROUNDS):
        questions.append({"id": _id("material", str(i)), "lesson_id": lesson_ids["materials"], "kind": "material",
                          "difficulty": diff, "prompt": prompt, "options": options, "answer": options[0],
                          "hint": hint, "explanation": expl})
    for g in GAMES:
        games.append({"id": _id("game", g["key"]), "key": g["key"], "lesson_id": lesson_ids[g["lesson"]],
                      "type": g["type"], "title": g["title"], "emoji": g["emoji"], "config": g["config"]})
    for key, kind, name, emoji, threshold, payload in REWARDS:
        rewards.append({"id": _id("reward", key), "key": key, "kind": kind, "name": name, "emoji": emoji,
                        "threshold": threshold, "payload": payload})
    for key, title, desc, emoji, rule in ACHIEVEMENTS:
        achievements.append({"id": _id("achievement", key), "key": key, "title": title, "description": desc,
                             "emoji": emoji, "rule": rule})
    # Order matters for Supabase foreign keys.
    return {"mk_lessons": lessons, "mk_games": games, "mk_questions": questions,
            "mk_rewards": rewards, "mk_achievements": achievements}
