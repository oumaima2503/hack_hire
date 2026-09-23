import { ChatWidget } from '../../learn/ChatWidget'

export default function Assistant() {
  return (
    <div className="learn-page">
      <h1>🧶 Ask MyRugy</h1>
      <p className="lead-dark">Ask anything about wool, looms, patterns or weaving. During a quiz, I give hints, not answers!</p>
      <ChatWidget inline />
    </div>
  )
}
