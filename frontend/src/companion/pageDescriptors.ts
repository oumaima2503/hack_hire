import type { Experience } from '../api'
import { sidebarNav, type PageDescriptor } from './PageContext'

/**
 * Short, accurate descriptions of each child page for the companion's AI prompt.
 * Names match what is on screen, so the companion can say "tap the 💡 button".
 * Keep them concise: they count toward the prompt size.
 */
const GUIDE_BUTTONS = ['💡 Need a hint? button', '💬 Ask button', '🎤 talk button', '❔ How to play button']

function nav(exp: Experience, current: string, extra: PageDescriptor['navigation'] = []) {
  return [...extra, ...sidebarNav(exp.child.id, exp.theme.guide.name).filter((n) => n.key !== current)]
}

export const pages = {
  home(exp: Experience): PageDescriptor {
    const next = exp.next_lesson
    const p = exp.progress
    return {
      key: 'home',
      label: 'The home screen',
      visibleElements: [
        `greeting from ${exp.theme.guide.name} with a read-aloud button`,
        next ? `big "Watch & play: ${next.title}" button` : 'big "Create a rug" button',
        `tiles: ${exp.theme.vocab.points}, ${exp.theme.vocab.level}, lessons done, day streak`,
        'Morocco trip map with the route and regions',
        'rug-making journey card',
        'MyRugy Box card',
      ],
      availableActions: [next ? `start the next lesson (${next.title})` : 'design a rug', 'tap a region on the map to read about it', 'use the sidebar to change page'],
      navigation: nav(exp, 'home', next ? [{ key: 'lesson', label: `Next lesson: ${next.title}`, path: `/play/${exp.child.id}/learn/${next.key}` }] : []),
      meta: {
        points: String(p.total_points),
        level: String(p.xp_level),
        lessonsDone: `${p.lessons_completed}/${p.lessons_total}`,
        ...(next ? { nextLesson: next.title } : {}),
      },
    }
  },

  learn(exp: Experience, unlocked: number, total: number): PageDescriptor {
    return {
      key: 'learn',
      label: 'The Learn & Play journey (all 8 stages)',
      visibleElements: ['list of lesson stages with their games', '🔒 locked and ✅ finished markers', 'Morocco map with the regions of each stage'],
      availableActions: ['open an unlocked stage', 'replay a finished game', 'tap a region on the map'],
      navigation: nav(exp, 'learn'),
      meta: { stagesUnlocked: `${unlocked}/${total}`, level: exp.difficulty.label },
    }
  },

  lesson(exp: Experience, l: { key: string; title: string; position: number; status: string; game?: string | null; regions: string[] }, step: string): PageDescriptor {
    const common = [`lesson "${l.title}" (stage ${l.position} of 8)`, 'road map of steps: Watch, Practice, Discover, Quiz, Done']
    const byStep: Record<string, { see: string[]; do: string[] }> = {
      watch: { see: ['storyboard video with a ▶ play button', '"Practice now" button (after watching)'], do: ['watch the video', 'go to Practice after watching'] },
      practice: l.game
        ? { see: [`the "${l.game}" game`, ...GUIDE_BUTTONS, '"Keep exploring" button'], do: ['play the game', 'ask for a hint', 'go on to Discover'] }
        : { see: ['practice quiz questions', '"Keep exploring" button'], do: ['answer the practice questions'] },
      discover: {
        see: ['region stops with their weaving style', '"Let’s learn more" explanation with read-aloud', '"Tap to discover" cards', 'button to go to the quiz or finish'],
        do: ['read or listen to the explanation', 'tap the cards', 'open the quick quiz'],
      },
      quiz: { see: ['quick quiz questions with answer choices', '"I finished this stage!" button'], do: ['answer the quiz', 'finish the stage'] },
      done: { see: ['🏆 trophy', '"Next lesson" button', '"My journey" button'], do: ['go to the next lesson', 'go back to the journey'] },
    }
    const s = byStep[step] ?? byStep.watch
    return {
      key: 'lesson',
      label: `A lesson, on the ${step} step`,
      visibleElements: [...common, ...s.see],
      availableActions: [...s.do, 'tap an earlier step on the road map'],
      navigation: nav(exp, 'lesson', [{ key: 'learn', label: 'My journey (Learn & Play)', path: `/play/${exp.child.id}/learn` }]),
      meta: {
        lessonTitle: l.title,
        lessonKey: l.key,
        status: l.status,
        step,
        ...(l.game ? { practiceGame: l.game } : {}),
        ...(l.regions.length ? { regions: l.regions.join(', ') } : {}),
      },
    }
  },

  game(exp: Experience, g: { title: string; type: string } | null): PageDescriptor {
    return {
      key: 'game',
      label: g ? `The "${g.title}" game` : 'A practice game',
      visibleElements: ['the game board', 'score / progress of the game', ...GUIDE_BUTTONS, '"Back to Learn & Play" button'],
      availableActions: ['play the game', 'tap 💡 for a hint', 'tap ❔ to see how to play', 'talk to the companion'],
      navigation: nav(exp, 'game', [{ key: 'learn', label: 'Back to Learn & Play', path: `/play/${exp.child.id}/learn` }]),
      meta: g ? { gameTitle: g.title, gameType: g.type } : undefined,
    }
  },

  studio(exp: Experience, locked: boolean, rugs: number): PageDescriptor {
    return {
      key: 'studio',
      label: 'The Create My Rug studio',
      visibleElements: locked
        ? ['🔒 message: finish the lessons up to "Create Your Rug" first', '"Go to lessons" button']
        : [
            'the loom (rug grid) with fringes',
            'tools: 🖌️ Brush, ➖ Fill row, 🔷 Pattern, Sticker, 🧽 Eraser',
            '🪞 Mirror switch',
            'Colours palette, Patterns, Stickers, Texture',
            '"Start from" templates and a clear button',
            '"Name your rug" box and "✂️ Finish & save my rug" button',
            ...(rugs ? ['My rug gallery'] : []),
          ],
      availableActions: locked ? ['go to the lessons'] : ['pick a colour', 'paint knots on the loom', 'stamp patterns and stickers', 'turn on the mirror', 'name and save the rug'],
      navigation: nav(exp, 'studio'),
      meta: { rugStyle: exp.rug_style.name, rugsSaved: String(rugs) },
    }
  },

  rewards(exp: Experience): PageDescriptor {
    const p = exp.progress
    return {
      key: 'rewards',
      label: 'The Rewards page',
      visibleElements: [`${exp.theme.vocab.points} counter with a bar to the next unlock`, 'Unlock track (unlocked items and 🔒 locked ones)', 'My worlds (world buttons)', 'Achievements'],
      availableActions: ['look at unlocked treasures', 'switch to another unlocked world', 'see what unlocks next'],
      navigation: nav(exp, 'rewards'),
      meta: { points: String(p.total_points), itemsUnlocked: String(p.items_unlocked), achievements: String(p.achievements) },
    }
  },

  progress(exp: Experience): PageDescriptor {
    const p = exp.progress
    return {
      key: 'progress',
      label: 'The Progress page',
      visibleElements: ['stat tiles (points, level, lessons, games, rugs, streak, regions)', '"How I like to learn" profile', 'My Morocco passport (visited regions)', 'Lessons and Games lists', 'Latest points'],
      availableActions: ['tap a passport stamp to read about a region', 'check which lessons and games are done'],
      navigation: nav(exp, 'progress'),
      meta: { level: String(p.xp_level), regionsVisited: `${p.regions_visited}/12`, lessonsDone: `${p.lessons_completed}/${p.lessons_total}` },
    }
  },

  assistant(exp: Experience): PageDescriptor {
    return {
      key: 'assistant',
      label: `The talking corner with ${exp.theme.guide.name}`,
      visibleElements: ['big 🎤 "Tap to talk" button', 'question suggestion buttons', 'text box with Send button', 'our conversation (chat history)'],
      availableActions: ['speak a question', 'type a question', 'tap a suggestion', 'replay an answer with 🔊'],
      navigation: nav(exp, 'assistant'),
    }
  },
}
