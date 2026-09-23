import type { GameConfig, Lang } from '../api'

type GameType = GameConfig['type']

export interface Demo {
  visual: string
  prompt: string
  options: string[]
  answer: number
  correct: string
  wrong: string
}

interface Texts {
  hello: string
  goal: Record<GameType, string>
  demo: Record<GameType, Demo>
  your_turn: string
  try_first: string
  lets_play: string
  show_me: string
  skip: string
  next: string
  how_to_play: string
  need_hint: string
  more_help: string
  ask: string
  talk: string
  listening: string
  thinking: string
  type_q: string
  send: string
  voice_off: string
  almost: string[]
  simpler: string
  offer_hint: string
  success: string[]
  finished: string
  rug_saved: string
  idle: string[]
  close: string
}

const EN: Texts = {
  hello: "Hi! I'm MyRugy! 👋 I'll show you how this game works.",
  goal: {
    choose_material: 'Goal: find the right material to make a rug.',
    match_tools: 'Goal: match each weaving tool with its job.',
    build_pattern: 'Goal: copy the rug pattern, square by square.',
    order_steps: 'Goal: put the rug-making steps in the right order.',
    create_rug: 'Goal: design your very own rug. There is no wrong answer!',
    challenge: 'Goal: answer questions from all your lessons.',
  },
  demo: {
    choose_material: { visual: '🐑   🪨   🥤', prompt: 'Which one is soft and warm for a rug?', options: ['🐑', '🪨', '🥤'], answer: 0, correct: 'Yes! Wool from sheep is soft and warm 🐑', wrong: 'Hmm, is it soft and warm? Try again!' },
    match_tools: { visual: '✂️', prompt: 'Scissors are for…', options: ['cutting', 'singing', 'sleeping'], answer: 0, correct: 'Yes! Scissors cut the yarn ✂️', wrong: 'Hmm, what do scissors do? Try again!' },
    build_pattern: { visual: '🔴  🔵  🔴  🔵  ❓', prompt: 'The colours repeat. What comes next?', options: ['🔴', '🔵', '🟢'], answer: 0, correct: 'Yes! Red, blue, red, blue, red!', wrong: 'Look again: red, blue, red, blue…' },
    order_steps: { visual: '🧶   🐑   🪢', prompt: 'What comes first to make a rug?', options: ['🐑', '🧶', '🪢'], answer: 0, correct: 'Yes! First the wool, then the yarn, then weaving.', wrong: 'Where does yarn come from? Try again!' },
    create_rug: { visual: '🎨  🖌️  🪞', prompt: 'Which button copies your painting on the other side?', options: ['🪞', '✂️', '🧽'], answer: 0, correct: 'Yes! The mirror makes both sides match 🪞', wrong: 'Look for the mirror! Try again.' },
    challenge: { visual: '❓  ⏱️  💡', prompt: 'Stuck on a question? What can you tap for a clue?', options: ['💡', '🚪', '😴'], answer: 0, correct: "Yes! Tap 💡 and I'll help you think.", wrong: 'The light bulb gives clues! Try again.' },
  },
  your_turn: 'Your turn! 🎉',
  try_first: "Try it first! I'm right here if you need help 👋",
  lets_play: "Let's play!",
  show_me: 'Show me how',
  skip: 'Skip',
  next: 'Next',
  how_to_play: 'How to play',
  need_hint: 'Need a hint?',
  more_help: 'More help',
  ask: 'Ask MyRugy',
  talk: 'Talk to MyRugy',
  listening: "I'm listening… 🎤",
  thinking: 'Let me think…',
  type_q: 'Type your question…',
  send: 'Send',
  voice_off: "Voice isn't available on this device. You can type instead!",
  almost: ["Almost! Let's look at it again.", 'So close! Try once more 🙂', 'Good try! Look carefully.'],
  simpler: "That's okay! Let's make it simpler. Want a clue? 💡",
  offer_hint: 'Want a clue? 💡',
  success: ['Great job! ⭐', 'You got it! 🎉', 'Wonderful! 🌟', 'Yes! You noticed it! 👀'],
  finished: 'Amazing work! 🏆',
  rug_saved: 'What a beautiful rug! 🧶',
  idle: ["I'm here if you need me 👋", 'Tap 💡 for a clue anytime!'],
  close: 'Close',
}

const FR: Texts = {
  hello: 'Salut ! Je suis MyRugy ! 👋 Je vais te montrer comment marche ce jeu.',
  goal: {
    choose_material: 'But : trouver la bonne matière pour faire un tapis.',
    match_tools: 'But : relier chaque outil à son travail.',
    build_pattern: 'But : recopier le motif du tapis, case par case.',
    order_steps: 'But : remettre les étapes du tapis dans le bon ordre.',
    create_rug: "But : créer ton propre tapis. Il n'y a pas de mauvaise réponse !",
    challenge: 'But : répondre aux questions de toutes tes leçons.',
  },
  demo: {
    choose_material: { visual: '🐑   🪨   🥤', prompt: 'Laquelle est douce et chaude pour un tapis ?', options: ['🐑', '🪨', '🥤'], answer: 0, correct: 'Oui ! La laine de mouton est douce et chaude 🐑', wrong: 'Hmm, est-ce doux et chaud ? Réessaie !' },
    match_tools: { visual: '✂️', prompt: 'Les ciseaux servent à…', options: ['couper', 'chanter', 'dormir'], answer: 0, correct: 'Oui ! Les ciseaux coupent le fil ✂️', wrong: 'Que font les ciseaux ? Réessaie !' },
    build_pattern: { visual: '🔴  🔵  🔴  🔵  ❓', prompt: 'Les couleurs se répètent. Que vient-il ensuite ?', options: ['🔴', '🔵', '🟢'], answer: 0, correct: 'Oui ! Rouge, bleu, rouge, bleu, rouge !', wrong: 'Regarde encore : rouge, bleu, rouge, bleu…' },
    order_steps: { visual: '🧶   🐑   🪢', prompt: "Qu'est-ce qui vient en premier pour faire un tapis ?", options: ['🐑', '🧶', '🪢'], answer: 0, correct: "Oui ! D'abord la laine, puis le fil, puis le tissage.", wrong: "D'où vient le fil ? Réessaie !" },
    create_rug: { visual: '🎨  🖌️  🪞', prompt: "Quel bouton copie ton dessin de l'autre côté ?", options: ['🪞', '✂️', '🧽'], answer: 0, correct: 'Oui ! Le miroir rend les deux côtés pareils 🪞', wrong: 'Cherche le miroir ! Réessaie.' },
    challenge: { visual: '❓  ⏱️  💡', prompt: 'Bloqué ? Que peux-tu toucher pour avoir un indice ?', options: ['💡', '🚪', '😴'], answer: 0, correct: "Oui ! Touche 💡 et je t'aide à réfléchir.", wrong: "L'ampoule donne des indices ! Réessaie." },
  },
  your_turn: 'À toi de jouer ! 🎉',
  try_first: "Essaie d'abord ! Je suis là si tu as besoin d'aide 👋",
  lets_play: 'On joue !',
  show_me: 'Montre-moi',
  skip: 'Passer',
  next: 'Suivant',
  how_to_play: 'Comment jouer',
  need_hint: "Besoin d'un indice ?",
  more_help: "Plus d'aide",
  ask: 'Demander à MyRugy',
  talk: 'Parler à MyRugy',
  listening: "Je t'écoute… 🎤",
  thinking: 'Je réfléchis…',
  type_q: 'Écris ta question…',
  send: 'Envoyer',
  voice_off: "La voix n'est pas disponible ici. Tu peux écrire !",
  almost: ['Presque ! Regardons encore.', 'Tout près ! Essaie encore 🙂', 'Bien essayé ! Regarde bien.'],
  simpler: "Ce n'est pas grave ! Faisons plus simple. Tu veux un indice ? 💡",
  offer_hint: 'Tu veux un indice ? 💡',
  success: ['Bravo ! ⭐', 'Tu as trouvé ! 🎉', 'Génial ! 🌟', "Oui ! Tu l'as remarqué ! 👀"],
  finished: 'Super travail ! 🏆',
  rug_saved: 'Quel beau tapis ! 🧶',
  idle: ['Je suis là si tu as besoin 👋', 'Touche 💡 pour un indice !'],
  close: 'Fermer',
}

const AR: Texts = {
  hello: 'مرحباً! أنا MyRugy! 👋 سأريك كيف تلعب هذه اللعبة.',
  goal: {
    choose_material: 'الهدف: اختيار المادة المناسبة لصنع الزربية.',
    match_tools: 'الهدف: ربط كل أداة بعملها.',
    build_pattern: 'الهدف: نسخ زخرفة الزربية مربعاً بمربع.',
    order_steps: 'الهدف: ترتيب خطوات صنع الزربية.',
    create_rug: 'الهدف: تصميم زربيتك الخاصة. لا توجد إجابة خاطئة!',
    challenge: 'الهدف: الإجابة عن أسئلة من كل دروسك.',
  },
  demo: {
    choose_material: { visual: '🐑   🪨   🥤', prompt: 'أيها ناعم ودافئ للزربية؟', options: ['🐑', '🪨', '🥤'], answer: 0, correct: 'نعم! صوف الخروف ناعم ودافئ 🐑', wrong: 'هل هو ناعم ودافئ؟ حاول مرة أخرى!' },
    match_tools: { visual: '✂️', prompt: 'المقص يُستعمل لـ…', options: ['القص', 'الغناء', 'النوم'], answer: 0, correct: 'نعم! المقص يقص الخيط ✂️', wrong: 'ماذا يفعل المقص؟ حاول مرة أخرى!' },
    build_pattern: { visual: '🔴  🔵  🔴  🔵  ❓', prompt: 'الألوان تتكرر. ما الذي يأتي بعد ذلك؟', options: ['🔴', '🔵', '🟢'], answer: 0, correct: 'نعم! أحمر، أزرق، أحمر، أزرق، أحمر!', wrong: 'انظر مرة أخرى: أحمر، أزرق، أحمر، أزرق…' },
    order_steps: { visual: '🧶   🐑   🪢', prompt: 'ما الذي يأتي أولاً لصنع الزربية؟', options: ['🐑', '🧶', '🪢'], answer: 0, correct: 'نعم! أولاً الصوف، ثم الخيط، ثم النسج.', wrong: 'من أين يأتي الخيط؟ حاول مرة أخرى!' },
    create_rug: { visual: '🎨  🖌️  🪞', prompt: 'أي زر ينسخ رسمك في الجهة الأخرى؟', options: ['🪞', '✂️', '🧽'], answer: 0, correct: 'نعم! المرآة تجعل الجهتين متشابهتين 🪞', wrong: 'ابحث عن المرآة! حاول مرة أخرى.' },
    challenge: { visual: '❓  ⏱️  💡', prompt: 'إذا احترت، ماذا تلمس لتحصل على تلميح؟', options: ['💡', '🚪', '😴'], answer: 0, correct: 'نعم! المس 💡 وسأساعدك على التفكير.', wrong: 'المصباح يعطي تلميحات! حاول مرة أخرى.' },
  },
  your_turn: 'دورك الآن! 🎉',
  try_first: 'جرّب أولاً! أنا هنا إذا احتجت مساعدة 👋',
  lets_play: 'هيا نلعب!',
  show_me: 'أرني كيف',
  skip: 'تخطّ',
  next: 'التالي',
  how_to_play: 'كيف ألعب',
  need_hint: 'تحتاج تلميحاً؟',
  more_help: 'مساعدة أكثر',
  ask: 'اسأل MyRugy',
  talk: 'تحدث مع MyRugy',
  listening: 'أنا أسمعك… 🎤',
  thinking: 'دعني أفكر…',
  type_q: 'اكتب سؤالك…',
  send: 'أرسل',
  voice_off: 'الصوت غير متاح هنا. يمكنك الكتابة!',
  almost: ['قريب جداً! لننظر مرة أخرى.', 'اقتربت! حاول مرة أخرى 🙂', 'محاولة جميلة! انظر جيداً.'],
  simpler: 'لا بأس! لنجعلها أسهل. هل تريد تلميحاً؟ 💡',
  offer_hint: 'هل تريد تلميحاً؟ 💡',
  success: ['أحسنت! ⭐', 'وجدتها! 🎉', 'رائع! 🌟', 'نعم! لاحظت ذلك! 👀'],
  finished: 'عمل مدهش! 🏆',
  rug_saved: 'يا لها من زربية جميلة! 🧶',
  idle: ['أنا هنا إذا احتجتني 👋', 'المس 💡 للحصول على تلميح!'],
  close: 'إغلاق',
}

const ALL: Record<Lang, Texts> = { en: EN, fr: FR, ar: AR }
export const guideText = (lang: Lang | null | undefined) => ALL[lang ?? 'en'] ?? EN
export const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
