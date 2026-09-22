import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../api'
import { speak, useLearn } from './LearnContext'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

/** The AI learning assistant. Talks to our backend only (/api/chat); Gemini is called server-side. */
export function ChatWidget({ inline = false }: { inline?: boolean }) {
  const { childId, exp, focus } = useLearn()
  const guide = exp.theme.guide
  const [open, setOpen] = useState(inline)
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const lang = exp.child.language ?? 'en'

  useEffect(() => {
    if (!open) return
    api.chatHistory(childId, focus.lessonId).then(setMessages, () => setMessages([]))
  }, [open, childId, focus.lessonId])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const send = async (message: string) => {
    const m = message.trim()
    if (!m || busy) return
    setMessages((xs) => [...xs, { role: 'user', content: m }])
    setText('')
    setBusy(true)
    setNote(null)
    try {
      const res = await api.chat({ childId, message: m, ...focus })
      setMessages((xs) => [...xs, { role: 'assistant', content: res.reply }])
      if (res.source === 'offline') setNote(`${guide.name} is in offline mode: simple answers only.`)
    } catch (e) {
      setMessages((xs) => [...xs, { role: 'assistant', content: e instanceof Error ? e.message : 'Oops, try again!' }])
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    send(text)
  }

  const suggestions = focus.questionId
    ? ['Can I have a hint? 🤔', 'Explain it more simply']
    : ['What is a loom?', 'Where does wool come from?', 'What should I learn next?']

  if (!open) {
    return (
      <button className="chat-fab" onClick={() => setOpen(true)} aria-label={`Ask ${guide.name}`}>
        <span className="chat-fab-emoji">{guide.emoji}</span>
        <span className="chat-fab-label">Ask {guide.name}</span>
      </button>
    )
  }

  return (
    <section className={inline ? 'chat chat-inline' : 'chat chat-floating'} aria-label={`Chat with ${guide.name}`}>
      <header className="chat-head">
        <span className="chat-avatar">{guide.emoji}</span>
        <div>
          <strong>{guide.name}</strong>
          <small>{focus.questionId ? 'Hint mode: I’ll help you think!' : 'Your rug-making helper'}</small>
        </div>
        {!inline && (
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close chat">
            ✕
          </button>
        )}
      </header>

      <div className="chat-list" ref={listRef} aria-live="polite">
        {messages.length === 0 && (
          <p className="chat-msg assistant">
            Hi! I’m {guide.name} {guide.emoji}. Ask me anything about how rugs are made!
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.content}
            {m.role === 'assistant' && (
              <button className="speak-btn" onClick={() => speak(m.content, lang)} aria-label="Read aloud">
                🔊
              </button>
            )}
          </div>
        ))}
        {busy && <p className="chat-msg assistant typing">{guide.emoji} …</p>}
      </div>

      <div className="chat-suggestions">
        {suggestions.map((s) => (
          <button key={s} onClick={() => send(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>
      {note && <p className="hint chat-note">{note}</p>}
      <form className="chat-form" onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Type your question…" aria-label="Your question" />
        <button className="btn primary" disabled={busy || !text.trim()}>
          Send
        </button>
      </form>
      <p className="chat-safety">🔒 Don’t share your full name, address or school.</p>
    </section>
  )
}
