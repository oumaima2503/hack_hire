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
    ("region_hopper", "Region Hopper", "Visit 6 regions of Morocco", "🧭", {"type": "regions_visited", "count": 6}),
    ("all_morocco", "Explorer of Morocco", "Visit all 12 regions of Morocco", "🗺️", {"type": "regions_visited", "count": 12}),
]


# ───────────────────────── Moroccan regions ─────────────────────────
# The 12 administrative regions, in a north→south travel order. The learning path
# visits all of them: the journey starts in the child's home region, and each of
# the 8 lessons is hosted by 1-2 regions (see LESSON_REGION_COUNTS).
# Each region has one text per lesson topic (REGION_TOPIC) so the regional stop
# always matches what the lesson teaches.

REGION_ORDER = (
    "tanger_tetouan_al_hoceima", "oriental", "fes_meknes", "rabat_sale_kenitra", "casablanca_settat",
    "beni_mellal_khenifra", "marrakech_safi", "draa_tafilalet", "souss_massa", "guelmim_oued_noun",
    "laayoune_sakia_el_hamra", "dakhla_oued_ed_dahab",
)
DEFAULT_START_REGION = "marrakech_safi"
LESSON_REGION_COUNTS = (1, 2, 1, 2, 1, 2, 1, 2)  # 12 regions over the 8 lessons, home region first
REGION_TOPIC = {"discover": "intro", "materials": "materials", "tools": "technique", "design": "motifs",
                "weaving": "technique", "create": "colours", "challenges": "fact", "unlock": "motifs"}

REGIONS = {
    "tanger_tetouan_al_hoceima": {
        "name": "Tanger-Tétouan-Al Hoceïma", "short": "Tangier & the Rif", "emoji": "🏔️", "city": "Chefchaouen",
        "x": 71, "y": 8, "palette": ["#2f6fb3", "#d7263d"], "style": "Rif stripes & the mendil",
        "description": 'The northern tip of Morocco, where the Mediterranean meets the Atlantic. It has the green Rif mountains, the port cities of Tangier and Tétouan, and blue-painted Chefchaouen.',
        "theme": {'look': 'Bold horizontal stripes of red and white, sometimes with thin bands of blue or black, woven flat and tight.', 'story': "The striped mendil is part of Jbala women's traditional clothing: they wear it around the waist or over the shoulders, with a wide straw hat.", 'tags': ['Flatweave', 'Stripes', 'Red & white'], 'pattern': 'stripes', 'colors': ['#d7263d', '#f7f3ea', '#2f6fb3', '#1b1b1b']},
        "intro": "In the green Rif mountains of the north, Jbala and Rifi families weave striped cloths and blankets.",
        "materials": "Northern weavers use soft sheep's wool and cotton, perfect for the rainy mountain winters.",
        "technique": "Many northern pieces are flat-woven: the weft threads make neat stripes, no knots needed!",
        "motifs": "The famous mendil is a red-and-white striped cloth worn by Jbala women. Stripes are the star here!",
        "colours": "Red and white stripes, and the famous blue walls of Chefchaouen.",
        "fact": "Chefchaouen is called the Blue Pearl because its streets are painted blue!",
        "quiz": ("What pattern is the northern mendil cloth famous for?", ["Red and white stripes", "Polka dots", "Pictures of cars"],
                 "Look at the lines going across!", "The mendil has red and white stripes."),
    },
    "oriental": {
        "name": "L'Oriental", "short": "Oujda & the East", "emoji": "🌴", "city": "Oujda",
        "x": 89, "y": 11, "palette": ["#8c2f39", "#e0a458"], "style": "Beni Snassen flatweaves",
        "description": 'The eastern region, from the Mediterranean beaches of Saïdia down to the oasis of Figuig, with high plateaus, mountains and wide open steppes.',
        "theme": {'look': 'Long bands of pattern filled with rows of small triangles, zigzags and lozenges, woven flat.', 'story': 'Each band is like a new chapter of the rug, a bit like the rows of a field or the tracks of a caravan.', 'tags': ['Flatweave', 'Bands', 'Triangles'], 'pattern': 'bands', 'colors': ['#8c2f39', '#e0a458', '#f3e3c3', '#3b2a20']},
        "intro": "In the east, near Oujda and the Beni Snassen mountains, weavers make bold flat-woven blankets.",
        "materials": "Wool from the sheep of the high plateaus is spun by hand into strong yarn.",
        "technique": "Flatweaving: coloured weft threads pass over and under the warp to build bands of pattern.",
        "motifs": "Wide bands full of small triangles and zigzags march across the rug.",
        "colours": "Deep reds and warm sandy yellows, like the eastern plateaus at sunset.",
        "fact": "Figuig, in the Oriental, is an oasis town with thousands of palm trees!",
        "quiz": ("How are Beni Snassen blankets mostly made?", ["By flatweaving bands", "By printing on paper", "By knitting socks"],
                 "Think of threads going over and under.", "They are flat-woven, band by band."),
    },
    "fes_meknes": {
        "name": "Fès-Meknès", "short": "Fès & the Middle Atlas", "emoji": "🎨", "city": "Fès",
        "x": 72, "y": 15, "palette": ["#f2ead8", "#2b2b2b"], "style": "Beni Ourain & the dyers of Fès",
        "description": "The heart of Morocco's history, with the imperial cities of Fès and Meknès, and the cedar forests and snowy peaks of the Middle Atlas.",
        "theme": {'look': 'Thick, shaggy cream wool crossed by thin dark lines that form big diamonds, like a lattice.', 'story': 'Beni Ourain families made these rugs to sleep on and keep warm in the snowy mountains; the lines can be read as paths and signs of protection.', 'tags': ['Knotted pile', 'Cream wool', 'Diamond lattice'], 'pattern': 'lozenge', 'colors': ['#f2ead8', '#2b2b2b', '#d9ccb0', '#6b5a48']},
        "intro": "Fès has one of the oldest medinas in the world, and the Middle Atlas nearby is home to the Beni Ourain weavers.",
        "materials": "Beni Ourain rugs use thick, fluffy sheep's wool, often left in its natural cream colour.",
        "technique": "They are knotted rugs with a long, soft pile, perfect for snowy mountain winters.",
        "motifs": "Cream wool with dark lines that form diamonds and lozenges.",
        "colours": "Mostly cream and dark brown, while the dyers of Fès fill huge vats with every colour!",
        "fact": "In Fès, leather is dyed in giant stone pools of colour at the famous tanneries.",
        "quiz": ("What do classic Beni Ourain rugs look like?", ["Cream wool with dark diamonds", "Bright green with pink dots", "Shiny gold metal"],
                 "Think soft, light wool with dark lines.", "Beni Ourain rugs are cream with dark diamonds."),
    },
    "rabat_sale_kenitra": {
        "name": "Rabat-Salé-Kénitra", "short": "Rabat & Zemmour", "emoji": "🏰", "city": "Rabat",
        "x": 62, "y": 15, "palette": ["#a4161a", "#1d3557"], "style": "Rbati carpets & Zemmour weaves",
        "description": "The region of Morocco's capital on the Atlantic coast: Rabat and Salé face each other across the Bouregreg river, next to the plains and forests of the Gharb.",
        "theme": {'look': 'A finely knotted city carpet with a large central medallion framed by several borders, often in rich reds.', 'story': "Rbati carpets were made in town homes and workshops for special rooms and celebrations, showing the city's taste for elegant, orderly designs.", 'tags': ['Fine knots', 'Central medallion', 'Borders'], 'pattern': 'medallion', 'colors': ['#a4161a', '#1d3557', '#e9c46a', '#f1faee']},
        "intro": "Rabat, Morocco's capital, has a long tradition of city carpets called Rbati rugs.",
        "materials": "Rbati carpets use fine wool in many dyed colours; nearby Zemmour weavers use sturdy wool.",
        "technique": "Rbati rugs are knotted very finely, knot by knot, a bit like tiny pixels!",
        "motifs": "Rbati carpets often have a big central medallion with borders; Zemmour rugs use bold geometric shapes.",
        "colours": "Rich reds with dark blue and golden details.",
        "fact": "The Kasbah of the Udayas in Rabat has blue-and-white streets looking over the ocean.",
        "quiz": ("What is often in the middle of a Rbati carpet?", ["A big medallion", "A zipper", "A pocket"],
                 "It's a large shape right in the centre.", "Rbati carpets often have a central medallion."),
    },
    "casablanca_settat": {
        "name": "Casablanca-Settat", "short": "Casablanca & Chaouia", "emoji": "🏙️", "city": "Casablanca",
        "x": 58, "y": 18, "palette": ["#ff6b6b", "#4ecdc4"], "style": "Boucherouite rag rugs",
        "description": "Home to Casablanca, Morocco's biggest city and business capital, surrounded by the farming plains of Chaouia and the beaches of El Jadida.",
        "theme": {'look': 'A joyful patchwork of every colour, made from strips of recycled fabric, with free and surprising shapes.', 'story': 'Boucherouite shows creativity and care for the planet: old clothes get a second life as a bright, soft rug.', 'tags': ['Recycled fabric', 'Patchwork', 'Rainbow'], 'pattern': 'patchwork', 'colors': ['#ff6b6b', '#4ecdc4', '#ffe66d', '#6a4c93', '#1a535c']},
        "intro": "Casablanca is Morocco's biggest city, and the plains around Settat are full of farms.",
        "materials": "Boucherouite rugs are made from strips of old clothes and fabric: nothing is wasted!",
        "technique": "Weavers knot strips of recycled cloth onto the warp instead of wool yarn.",
        "motifs": "Free and playful patterns: patches, stripes and surprising shapes.",
        "colours": "Every colour of the rainbow, depending on the fabrics that were collected.",
        "fact": "The Hassan II Mosque in Casablanca is built partly over the Atlantic Ocean!",
        "quiz": ("What are boucherouite rugs made from?", ["Recycled fabric strips", "Chocolate", "Glass"],
                 "Old t-shirts get a second life…", "Boucherouite rugs recycle strips of fabric."),
    },
    "beni_mellal_khenifra": {
        "name": "Béni Mellal-Khénifra", "short": "Azilal & Khénifra", "emoji": "⛰️", "city": "Azilal",
        "x": 64, "y": 28, "palette": ["#ffbe0b", "#fb5607"], "style": "Azilal & Zayane rugs",
        "description": 'Between the Middle and High Atlas mountains and the Tadla plain, with the Ouzoud waterfalls and many Amazigh villages.',
        "theme": {'look': 'A cream background covered with bright, playful symbols (zigzags, lines and little figures) placed freely.', 'story': 'Every Azilal rug is personal: the weaver draws her own ideas in wool, like a colourful diary.', 'tags': ['Knotted pile', 'Bright colours', 'Free design'], 'pattern': 'playful', 'colors': ['#f4ecdc', '#fb5607', '#ff006e', '#3a86ff', '#ffbe0b']},
        "intro": "Between the mountains and the plains, the Azilal and Khénifra areas are famous for joyful rugs.",
        "materials": "Azilal weavers knot colourful wool onto cream wool, sometimes with cotton for the base.",
        "technique": "Azilal rugs are knotted with a medium pile, and each weaver invents her own design.",
        "motifs": "Playful symbols, zigzags and shapes that tell the weaver's own story.",
        "colours": "Bright orange, pink, blue and yellow on a cream background.",
        "fact": "The Ouzoud waterfalls near Azilal are among the highest in North Africa!",
        "quiz": ("What makes Azilal rugs special?", ["Bright colours on cream wool", "They are invisible", "They are made of stone"],
                 "Imagine a cream rug with happy colours.", "Azilal rugs have bright colours on cream."),
    },
    "marrakech_safi": {
        "name": "Marrakech-Safi", "short": "Marrakech & Chichaoua", "emoji": "🕌", "city": "Marrakech",
        "x": 56, "y": 30, "palette": ["#c1121f", "#f4a261"], "style": "Chichaoua rugs",
        "description": 'The region of Marrakech, the red city at the foot of the High Atlas, and of Safi, an Atlantic port famous for its pottery.',
        "theme": {'look': 'A deep red field with a few simple motifs (zigzags, diamonds, little animals) scattered like stars.', 'story': 'Chichaoua rugs are simple and friendly: the red background makes every little motif stand out.', 'tags': ['Knotted pile', 'Red field', 'Simple motifs'], 'pattern': 'red_field', 'colors': ['#c1121f', '#1b1b1b', '#f4f1de', '#f4a261']},
        "intro": "Marrakech is the red city, and the villages of Chichaoua nearby weave famous red rugs.",
        "materials": "Chichaoua weavers use local wool, often dyed red with natural plant dyes.",
        "technique": "Chichaoua rugs are knotted, with simple shapes spread out on a big red field.",
        "motifs": "Simple, fun figures (zigzags, diamonds, sometimes little animals) float on the red background.",
        "colours": "Deep red backgrounds with black, white and yellow details.",
        "fact": "Jemaa el-Fna square in Marrakech fills with storytellers and musicians every evening!",
        "quiz": ("What is the main background colour of Chichaoua rugs?", ["Red", "Purple", "Silver"],
                 "Marrakech is called the ___ city.", "Chichaoua rugs usually have a red background."),
    },
    "draa_tafilalet": {
        "name": "Drâa-Tafilalet", "short": "Ouarzazate & Taznakht", "emoji": "🏜️", "city": "Taznakht",
        "x": 60, "y": 36, "palette": ["#e9c46a", "#9b2226"], "style": "Taznakht & Glaoua rugs",
        "description": 'The south-east of kasbahs, palm-filled valleys and dunes: Ouarzazate, the Drâa valley, the Dadès gorges and the dunes of Merzouga.',
        "theme": {'look': 'Rows of knotted diamonds and crosses alternating with flat-woven stripes, in saffron, henna and deep red.', 'story': 'Mixing two techniques in one rug takes great skill, and the weavers of Taznakht are proud of their natural dyes.', 'tags': ['Flatweave + pile', 'Natural dyes', 'Diamonds'], 'pattern': 'mixed', 'colors': ['#9b2226', '#e9c46a', '#ee9b00', '#2b2d42']},
        "intro": "In the land of kasbahs, around Ouarzazate and Taznakht, weavers make some of Morocco's most colourful rugs.",
        "materials": "Taznakht is famous for natural dyes: saffron and henna for yellows and oranges, indigo for blue.",
        "technique": "Glaoua rugs mix flatweave and knotted pile in the same rug, a clever combination!",
        "motifs": "Rows of diamonds and crosses, framed by bands of flatweave.",
        "colours": "Saffron yellow, henna orange and deep red, like the desert kasbahs.",
        "fact": "Ouarzazate is called the door of the desert, and many films are shot there!",
        "quiz": ("What is special about Glaoua rugs?", ["They mix flatweave and knots", "They glow in the dark", "They are square pizzas"],
                 "Two techniques in one rug…", "Glaoua rugs mix flatweave and knotted pile."),
    },
    "souss_massa": {
        "name": "Souss-Massa", "short": "Agadir & the Anti-Atlas", "emoji": "🌳", "city": "Tiznit",
        "x": 46, "y": 42, "palette": ["#6a994e", "#bc6c25"], "style": "Anti-Atlas weaves & Tiznit silver",
        "description": 'The south-west: the beach city of Agadir, the fertile Souss valley, the walls of Taroudant, the Anti-Atlas mountains and forests of argan trees.',
        "theme": {'look': 'Fine, precise stripes with small triangles and crosses, in earthy greens, browns and oranges.', 'story': "The shapes echo the triangles and crosses of Tiznit's famous Amazigh silver jewellery.", 'tags': ['Flatweave', 'Fine stripes', 'Jewellery motifs'], 'pattern': 'fine_stripes', 'colors': ['#6a994e', '#bc6c25', '#dda15e', '#283618']},
        "intro": "In the south-west, the Souss valley and the Anti-Atlas mountains are the land of argan trees.",
        "materials": "Weavers use wool from mountain sheep, and argan trees give the region its famous oil.",
        "technique": "Many Anti-Atlas pieces are flat-woven with thin, precise stripes.",
        "motifs": "Triangles, crosses and fine stripes, often like the shapes on Tiznit's silver jewellery.",
        "colours": "Earthy greens, browns and oranges, like the argan forests.",
        "fact": "In the Souss, goats sometimes climb argan trees to eat the fruit!",
        "quiz": ("Which tree is famous in the Souss-Massa region?", ["The argan tree", "The maple tree", "The Christmas tree"],
                 "Its oil is famous all over the world.", "The argan tree grows in Souss-Massa."),
    },
    "guelmim_oued_noun": {
        "name": "Guelmim-Oued Noun", "short": "Guelmim, door of the Sahara", "emoji": "🐪", "city": "Guelmim",
        "x": 45, "y": 46, "palette": ["#3d2b1f", "#d4a373"], "style": "Nomad tent weaving",
        "description": "The gateway to the Sahara, where the Anti-Atlas meets the desert and the ocean, with Guelmim's camel market and the oasis of Tighmert.",
        "theme": {'look': 'Long dark strips of goat and camel hair with a few bold light stripes, sewn side by side.', 'story': "The khaima, the nomad tent, is a family's home: strong, easy to carry and woven by hand.", 'tags': ['Goat & camel hair', 'Tent strips', 'Bold stripes'], 'pattern': 'tent', 'colors': ['#3d2b1f', '#d4a373', '#faedcd', '#7f5539']},
        "intro": "Guelmim is called the door of the Sahara, and it has a famous camel market.",
        "materials": "Nomad families weave tent strips from goat and camel hair, strong against rain and sun.",
        "technique": "Long, narrow strips are woven on a ground loom, then sewn together into a tent (khaima).",
        "motifs": "Dark bands of goat hair with simple, bold stripes.",
        "colours": "Dark browns of goat hair and the sandy colours of camel hair.",
        "fact": "Guelmim's camel market is one of the most famous in Morocco!",
        "quiz": ("What are nomad tent strips woven from?", ["Goat and camel hair", "Paper", "Plastic bags"],
                 "Think about the animals of the desert…", "Tents are woven from goat and camel hair."),
    },
    "laayoune_sakia_el_hamra": {
        "name": "Laâyoune-Sakia El Hamra", "short": "Laâyoune & the dunes", "emoji": "⛺", "city": "Laâyoune",
        "x": 28, "y": 58, "palette": ["#e76f51", "#264653"], "style": "Sahrawi crafts",
        "description": 'A Saharan region of golden dunes and Atlantic beaches around the city of Laâyoune, home to a rich Sahrawi nomadic culture.',
        "theme": {'look': 'Leather and woven pieces decorated with stitched geometric stars and crosses in bright colours.', 'story': 'Everything is made to travel: cushions, bags and tent decorations are light, strong and beautifully stitched.', 'tags': ['Leather & wool', 'Stitched stars', 'Bright colours'], 'pattern': 'stitch', 'colors': ['#c68b59', '#e76f51', '#264653', '#2a9d8f']},
        "intro": "In the Sahara, Sahrawi families have a rich nomadic culture of tents, leather and bright fabrics.",
        "materials": "Wool, camel hair and decorated leather make cushions, bags and tent decorations.",
        "technique": "Woven strips and leather pieces are sewn together, so everything is light and easy to carry.",
        "motifs": "Geometric shapes stitched in bright colours, a bit like little maps of the stars.",
        "colours": "Bright melhfa colours (orange, blue and green) against the golden dunes.",
        "fact": "Sakia El Hamra means 'the red canal', named after a river valley in the desert.",
        "quiz": ("Why are nomad crafts easy to carry?", ["Strips are sewn together, so they're light", "They have wheels", "They are tiny"],
                 "Nomads travel with their tents…", "Sewn strips and leather keep things light and portable."),
    },
    "dakhla_oued_ed_dahab": {
        "name": "Dakhla-Oued Ed-Dahab", "short": "Dakhla, desert meets ocean", "emoji": "🌊", "city": "Dakhla",
        "x": 12, "y": 79, "palette": ["#0077b6", "#f1c27d"], "style": "Ocean & desert nomad weaving",
        "description": 'The far south, where the Sahara meets the Atlantic Ocean around the long, blue lagoon of Dakhla.',
        "theme": {'look': 'Wave-like zigzags and stripes in lagoon blue and golden sand.', 'story': 'The patterns bring two landscapes together: the waves of the ocean and the dunes of the desert.', 'tags': ['Knots & nets', 'Wave zigzags', 'Blue & sand'], 'pattern': 'waves', 'colors': ['#0077b6', '#f1c27d', '#90e0ef', '#fefae0']},
        "intro": "Dakhla is where the Sahara meets the Atlantic Ocean, around a huge blue lagoon.",
        "materials": "Nomad weavers use camel hair, goat hair and wool, and fishermen mend nets with strong knots.",
        "technique": "Net-making and weaving both need careful knots: each knot must be tight and even.",
        "motifs": "Wave-like zigzags and stripes that remind you of the ocean and the dunes.",
        "colours": "Lagoon blue and golden sand.",
        "fact": "Dakhla's lagoon is so windy that people come from all over the world to kite-surf!",
        "quiz": ("What does Dakhla's landscape mix?", ["Desert and ocean", "Snow and ice", "Jungle and volcanoes"],
                 "Sand dunes next to…", "In Dakhla, the desert meets the ocean."),
    },
}


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
            questions.append({"id": _id("question", l["key"], str(i)), "lesson_id": lid, "region_key": None, "kind": "quiz",
                              "difficulty": diff, "prompt": prompt, "options": options, "answer": options[0],
                              "hint": hint, "explanation": expl})
    for i, (diff, prompt, options, hint, expl) in enumerate(MATERIAL_ROUNDS):
        questions.append({"id": _id("material", str(i)), "lesson_id": lesson_ids["materials"], "region_key": None, "kind": "material",
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
    regions = []
    for pos, key in enumerate(REGION_ORDER, start=1):
        r = REGIONS[key]
        regions.append({"id": _id("region", key), "key": key, "position": pos, "name": r["name"],
                        "short_name": r["short"], "emoji": r["emoji"],
                        "content": {k: v for k, v in r.items() if k not in ("name", "short", "emoji", "quiz")}})
        prompt, options, hint, expl = r["quiz"]
        questions.append({"id": _id("region-question", key), "lesson_id": None, "region_key": key, "kind": "region",
                          "difficulty": 1, "prompt": prompt, "options": options, "answer": options[0],
                          "hint": hint, "explanation": expl})
    # Order matters for Supabase foreign keys.
    return {"mk_lessons": lessons, "mk_games": games, "mk_regions": regions, "mk_questions": questions,
            "mk_rewards": rewards, "mk_achievements": achievements}
