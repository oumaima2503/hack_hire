import type { Lang } from '../api'

export type Page = 'home' | 'learn' | 'lesson' | 'game' | 'studio' | 'rewards' | 'progress' | 'journey' | 'assistant'

interface Texts {
  hello: (name: string, buddy: string) => string
  tap_me: string
  or_write: string
  write_to_me: string
  talk_instead: string
  no_voice_lang: string
  listening: string
  heard_nothing: string
  mic_blocked: string
  no_voice: string
  thinking: string[]
  you_said: string
  type_here: string
  send: string
  ask_again: string
  error: string
  cheer: string[]
  arrive: Partial<Record<Page, string[]>>
}

const EN: Texts = {
  hello: (name, buddy) => `Hi ${name}! I'm ${buddy}, your travel buddy. Tap me whenever you want to talk!`,
  tap_me: 'Tap to talk or write',
  or_write: '…or write to me below ✍️',
  write_to_me: 'Write to me!',
  talk_instead: 'Talk instead',
  no_voice_lang: '🔇 My voice is resting on this device, but you can read my answer!',
  listening: "I'm listening…",
  heard_nothing: "I didn't hear anything. Tap me and try again!",
  mic_blocked: 'I can’t hear you. Ask a grown-up to allow the microphone, or type here!',
  no_voice: 'My ears don’t work in this browser. Type your question!',
  thinking: ['Hmm, let me think…', 'Good question! Thinking…', 'Ooh, let me see…'],
  you_said: 'You said',
  type_here: 'Type your question…',
  send: 'Send',
  ask_again: 'Ask again',
  error: 'Oops, my thoughts got tangled like yarn! Try again.',
  cheer: ['Woohoo! You did it!', 'Amazing! Look at that!', 'Yay! I’m so proud of you!'],
  arrive: {
    home: ['Where shall we go today?', 'Ready for an adventure?'],
    learn: ['Pick a stage and let’s learn!', 'Our map is waiting!'],
    studio: ['Let’s make something beautiful!', 'Time to be a rug artist!'],
    rewards: ['Look at all your treasures!', 'So many shiny rewards!'],
    progress: ['Look how far you’ve travelled!', 'You’re growing so fast!'],
    assistant: ['Ask me anything about rugs!'],
  },
}

const FR: Texts = {
  hello: (name, buddy) => `Salut ${name} ! Je suis ${buddy}, ton compagnon de voyage. Touche-moi quand tu veux parler !`,
  tap_me: 'Touche pour parler ou écrire',
  or_write: '…ou écris-moi en dessous ✍️',
  write_to_me: 'Écris-moi !',
  talk_instead: 'Parler plutôt',
  no_voice_lang: '🔇 Ma voix se repose sur cet appareil, mais tu peux lire ma réponse !',
  listening: "Je t'écoute…",
  heard_nothing: "Je n'ai rien entendu. Touche-moi et réessaie !",
  mic_blocked: "Je ne t'entends pas. Demande à un adulte d'autoriser le micro, ou écris ici !",
  no_voice: 'Mes oreilles ne marchent pas dans ce navigateur. Écris ta question !',
  thinking: ['Hmm, je réfléchis…', 'Bonne question ! Je réfléchis…', 'Ooh, voyons voir…'],
  you_said: 'Tu as dit',
  type_here: 'Écris ta question…',
  send: 'Envoyer',
  ask_again: 'Redemander',
  error: 'Oups, mes idées se sont emmêlées comme de la laine ! Réessaie.',
  cheer: ['Youpi ! Tu as réussi !', 'Génial ! Regarde ça !', 'Bravo ! Je suis fier de toi !'],
  arrive: {
    home: ['On va où aujourd’hui ?', 'Prêt pour l’aventure ?'],
    learn: ['Choisis une étape et apprenons !', 'Notre carte nous attend !'],
    studio: ['Créons quelque chose de beau !', 'À toi de jouer, artiste !'],
    rewards: ['Regarde tous tes trésors !', 'Que de récompenses !'],
    progress: ['Regarde tout le chemin parcouru !', 'Tu grandis si vite !'],
    assistant: ['Pose-moi une question sur les tapis !'],
  },
}

const AR: Texts = {
  hello: (name, buddy) => `مرحباً ${name}! أنا ${buddy}، رفيقك في الرحلة. المسني متى أردت التحدث!`,
  tap_me: 'المس للتحدث أو الكتابة',
  or_write: '…أو اكتب لي في الأسفل ✍️',
  write_to_me: 'اكتب لي!',
  talk_instead: 'تحدث بدلاً من ذلك',
  no_voice_lang: '🔇 صوتي يستريح على هذا الجهاز، لكن يمكنك قراءة جوابي!',
  listening: 'أنا أستمع…',
  heard_nothing: 'لم أسمع شيئاً. المسني وحاول مرة أخرى!',
  mic_blocked: 'لا أستطيع سماعك. اطلب من شخص بالغ السماح بالميكروفون، أو اكتب هنا!',
  no_voice: 'أذناي لا تعملان في هذا المتصفح. اكتب سؤالك!',
  thinking: ['همم، دعني أفكر…', 'سؤال جميل! أفكر…', 'لنرَ…'],
  you_said: 'قلت',
  type_here: 'اكتب سؤالك…',
  send: 'أرسل',
  ask_again: 'اسأل مجدداً',
  error: 'أوه، تشابكت أفكاري مثل الصوف! حاول مرة أخرى.',
  cheer: ['رائع! لقد نجحت!', 'مدهش! انظر إلى هذا!', 'أحسنت! أنا فخور بك!'],
  arrive: {
    home: ['إلى أين نذهب اليوم؟', 'مستعد للمغامرة؟'],
    learn: ['اختر مرحلة ولنتعلم!', 'خريطتنا تنتظرنا!'],
    studio: ['لنصنع شيئاً جميلاً!', 'حان وقت الفن!'],
    rewards: ['انظر إلى كنوزك!', 'مكافآت كثيرة لامعة!'],
    progress: ['انظر كم سافرت!', 'أنت تكبر بسرعة!'],
    assistant: ['اسألني أي شيء عن الزرابي!'],
  },
}

const ALL: Record<Lang, Texts> = { en: EN, fr: FR, ar: AR }
export const pickLine = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
export const companionText = (lang: Lang | null | undefined) => ALL[lang ?? 'en'] ?? EN

/** Which part of the app the child is on, from the URL (sent to the AI as context). */
export function pageFromPath(path: string): Page {
  const seg = path.split('/').filter(Boolean)
  // /play/:childId/<section>/<key?>
  const section = seg[2] ?? ''
  if (section === 'learn') return seg[3] ? 'lesson' : 'learn'
  if (section === 'games' || section === 'game') return 'game'
  if (['studio', 'rewards', 'progress', 'journey', 'assistant'].includes(section)) return section as Page
  return 'home'
}
