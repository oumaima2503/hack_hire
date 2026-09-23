import { useEffect, useState } from 'react'
import { confetti, sfx, speak, stopSpeaking } from '../fun'
import { TalkingAvatar } from '../components/TalkingAvatar'

export interface AppWalkthroughProps {
  childId: string
  childName: string
  avatarEmoji: string
  themeName: string
  guideName: string
  guideEmoji: string
  lang?: string
  isOpen: boolean
  onClose: () => void
}

interface WalkthroughStep {
  title: string
  say: string
  icon: string
  tip: string
  badge: string
}

export function AppWalkthrough({
  childId,
  childName,
  avatarEmoji,
  themeName,
  guideName,
  guideEmoji,
  lang = 'en',
  isOpen,
  onClose,
}: AppWalkthroughProps) {
  const [stepIndex, setStepIndex] = useState(0)

  const steps: WalkthroughStep[] = [
    {
      title: `Welcome, ${childName}! 🎉`,
      say: `Hi ${childName}! I'm ${guideName}, your expedition guide! Welcome to your ${themeName} world! Let me show you how our rug-making adventure works!`,
      icon: avatarEmoji || guideEmoji || '🧭',
      badge: 'Step 1 of 6: Welcome',
      tip: 'Tap your buddy anytime to listen again!',
    },
    {
      title: 'Morocco Map Journey 🗺️',
      say: 'On the Home page, you can travel across all 12 regions of Morocco! Tap any region on the map to see its unique colours, story, and mini-rug preview!',
      icon: '🗺️',
      badge: 'Step 2 of 6: The Map',
      tip: 'Collect region stamps in your passport as you travel!',
    },
    {
      title: 'Learn & Play Lessons 🔭',
      say: 'In Learn & Play, unlock 8 exciting lessons! Watch narrated storyboards, flip interactive tap cards, and take fun quizzes to test your knowledge!',
      icon: '📖',
      badge: 'Step 3 of 6: Lessons',
      tip: 'Choose how you learn best: Watch, Listen, or Do!',
    },
    {
      title: 'Create My Rug Studio 🎨',
      say: 'In the Rug Studio, you get to weave your own custom carpets! Choose wool textures, regional stamps, and signature colors, then save your rugs to your gallery!',
      icon: '🧶',
      badge: 'Step 4 of 6: Studio',
      tip: 'Your created rugs earn you extra points and daily rewards!',
    },
    {
      title: 'Rewards, Badges & Magic 🏆',
      say: 'Every lesson and game earns you points and level trophies! Collect achievements and unlock special themes like the Flying Magic Carpet!',
      icon: '⭐',
      badge: 'Step 5 of 6: Rewards',
      tip: 'Keep up your daily streak for bonus streak multipliers!',
    },
    {
      title: 'Ask Me Anything! 💬',
      say: `Whenever you get stuck or want to know more about rug weaving, tap me or open Ask MyRugy! I am always here to guide you, ${childName}!`,
      icon: '🤝',
      badge: 'Step 6 of 6: Your Guide',
      tip: "You are all set! Let's start weaving!",
    },
  ]

  const current = steps[stepIndex]

  useEffect(() => {
    if (isOpen && current) {
      speak(current.say, lang)
    }
    return () => {
      stopSpeaking()
    }
  }, [isOpen, stepIndex, current, lang])

  if (!isOpen) return null

  const next = () => {
    sfx.whoosh()
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      finish()
    }
  }

  const prev = () => {
    sfx.whoosh()
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1)
    }
  }

  const finish = () => {
    sfx.yay()
    confetti()
    try {
      localStorage.setItem(`myrugy_walkthrough_${childId}`, 'true')
    } catch {
      // ignore quota / private browsing errors
    }
    onClose()
  }

  return (
    <div className="modal-backdrop walkthrough-backdrop" role="dialog" aria-modal="true" aria-label="App Walkthrough">
      <div className="modal walkthrough-modal glass-panel">
        <header className="walkthrough-header">
          <span className="walkthrough-badge">{current.badge}</span>
          <button type="button" className="btn-close-walkthrough" onClick={finish} aria-label="Skip tour">
            ✕
          </button>
        </header>

        <div className="walkthrough-body">
          <div className="walkthrough-avatar-stage">
            <TalkingAvatar
              say={current.say}
              lang={lang}
              avatarEmoji={avatarEmoji || guideEmoji}
              guideName={guideName}
              size={90}
              mood={stepIndex === steps.length - 1 ? 'wow' : 'happy'}
              layout="column"
            />
          </div>

          <div className="walkthrough-info">
            <h2>
              <span className="walkthrough-icon">{current.icon}</span> {current.title}
            </h2>
            <p className="walkthrough-tip">💡 {current.tip}</p>
          </div>
        </div>

        <div className="walkthrough-footer">
          <div className="walkthrough-dots">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`dot ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}
                onClick={() => setStepIndex(i)}
                role="button"
                tabIndex={0}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="walkthrough-nav-btns">
            {stepIndex > 0 && (
              <button type="button" className="btn ghost" onClick={prev}>
                ⬅ Back
              </button>
            )}
            {stepIndex < steps.length - 1 ? (
              <button type="button" className="btn primary" onClick={next}>
                Next ➡
              </button>
            ) : (
              <button type="button" className="btn primary finish-btn" onClick={finish}>
                🚀 Let's Play!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
