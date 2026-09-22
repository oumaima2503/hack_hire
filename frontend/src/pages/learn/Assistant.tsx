import { ChatWidget } from '../../learn/ChatWidget'
import { useLearn } from '../../learn/LearnContext'

export default function Assistant() {
  const { exp } = useLearn()
  return (
    <div className="learn-page">
      <h1>
        {exp.theme.guide.emoji} Ask {exp.theme.guide.name}
      </h1>
      <p className="lead-dark">Ask anything about wool, looms, patterns or weaving. During a quiz, I give hints, not answers!</p>
      <ChatWidget inline />
    </div>
  )
}
