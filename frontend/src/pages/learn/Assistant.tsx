import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../../api'
import { useCompanion } from '../../companion/Companion'
import { companionText } from '../../companion/companionText'
import { useLearn } from '../../learn/LearnContext'
import { usePageDescriptor } from '../../companion/PageContext'
import { pages } from '../../companion/pageDescriptors'

interface Msg {
  id?: string
  role: 'user' | 'assistant'
  content: string
}

/** Conversation corner: talk to the companion (voice first, typing as a fallback) and see what you said. */
export default function Assistant() {
  const { childId, exp } = useLearn()
  usePageDescriptor(() => pages.assistant(exp), [exp])
  const companion = useCompanion()
  const tx = companionText(exp.child.language)
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const listening = companion.state === 'listening'
  const busy = companion.state === 'thinking'

  useEffect(() => {
    api.chatHistory(childId).then(setMessages, () => setMessages([]))
  }, [childId, companion.exchanges])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const m = text.trim()
    if (!m) return
    setText('')
    companion.ask(m)
  }

  const suggestions = ['What is a loom?', 'Where does wool come from?', 'How do you make colours for yarn?', 'What should I learn next?']

  return (
    <div className="learn-page companion-page">
      <h1>
        {companion.emoji} Talk to {companion.name}
      </h1>
      <p className="lead-dark">
        Tap {companion.name} or the big button, then ask anything about wool, looms, patterns or weaving. During a quiz, {companion.name} gives hints, not
        answers!
      </p>

      <section className="card companion-talk">
        <button className={`talk-btn${listening ? ' live' : ''}`} onClick={companion.listen} disabled={busy}>
          <span className="talk-btn-icon">{listening ? '👂' : busy ? '💭' : '🎤'}</span>
          <span>{listening ? `${tx.listening} (tap when you’re done)` : busy ? companion.name + '…' : tx.tap_me}</span>
        </button>
        <div className="chat-suggestions">
          {suggestions.map((s) => (
            <button key={s} onClick={() => companion.ask(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
        <form className="chat-form" onSubmit={submit}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder={tx.type_here} aria-label={tx.type_here} />
          <button className="btn primary" disabled={busy || !text.trim()}>
            {tx.send}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>💬 Our conversation</h2>
        <div className="chat-list companion-log" ref={listRef} aria-live="polite">
          {messages.length === 0 && (
            <p className="chat-msg assistant">
              Hi! I’m {companion.name} {companion.emoji}. Tap me and ask me anything about how rugs are made!
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              {m.content}
              {m.role === 'assistant' && (
                <button className="speak-btn" onClick={() => companion.say(m.content, { state: 'explaining', voice: true, sticky: true, messageId: m.id })} aria-label="Say it again">
                  🔊
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
      <p className="chat-safety">🔒 Don’t share your full name, address or school.</p>
    </div>
  )
}
