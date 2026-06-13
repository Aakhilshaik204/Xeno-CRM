import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Sparkles, Send, X, Loader2 } from 'lucide-react'

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{role: 'user'|'agent', content: string, actions?: any[]}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const prompt = input.trim()
    setInput('')
    
    setMessages(prev => [...prev, { role: 'user', content: prompt }])
    setLoading(true)

    try {
      const res = await axios.post('/api/agent/chat', { prompt, history: messages })
      setMessages(prev => [...prev, { role: 'agent', content: res.data.reply, actions: res.data.actions }])
    } catch (e: any) {
      console.error('AI error', e)
      setMessages(prev => [...prev, { role: 'agent', content: '❌ Error: ' + (e.response?.data?.error || e.message) }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 p-4 bg-primary text-black rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-8 right-8 w-96 h-[500px] glass-panel z-50 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-border bg-surfaceHighlight flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text">Maison Luxe AI</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-text-muted mt-10">
              <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Hi! I can help you create campaigns, find segments, and analyze data.</p>
              <div className="space-y-2 mt-4 text-sm text-text-muted">
                <p>Try asking:</p>
                <button onClick={() => setInput('Create an SMS campaign for Platinum Members about our new winter collection')} className="block w-full text-left px-3 py-2 rounded bg-surfaceHighlight hover:bg-border transition-colors">"Create an SMS campaign for Platinum Members"</button>
                <button onClick={() => setInput('Can you find out how many customers we have in the Gold Members segment?')} className="block w-full text-left px-3 py-2 rounded bg-surfaceHighlight hover:bg-border transition-colors">"How many Gold Members do we have?"</button>
                <button onClick={() => setInput('Dispatch my new Platinum campaign')} className="block w-full text-left px-3 py-2 rounded bg-surfaceHighlight hover:bg-border transition-colors">"Dispatch my new Platinum campaign"</button>
              </div>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm flex flex-col gap-1 ${
                m.role === 'user' 
                  ? 'bg-primary text-black font-medium rounded-br-sm' 
                  : 'bg-surfaceHighlight border border-border text-text rounded-bl-sm whitespace-pre-wrap'
              }`}>
                {m.actions && m.actions.length > 0 && (
                  <div className="flex flex-col gap-2 mb-2 w-full">
                    {m.actions.map((action, idx) => (
                      <div key={idx} className="flex flex-col bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
                        <div className="flex items-center gap-1.5 text-[10px] text-primary bg-surfaceHighlight/50 px-2 py-1.5 border-b border-border">
                          <Sparkles className="w-3 h-3" />
                          <span className="font-semibold">{action.name}</span>
                        </div>
                        <div className="p-2 bg-black/40 text-[9px] font-mono text-text-muted overflow-x-auto whitespace-pre">
                          {JSON.stringify(action.args, null, 2)}
                        </div>
                        <div className="px-2 py-1.5 bg-surfaceHighlight/30 text-[10px] text-text-muted border-t border-border">
                          {action.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surfaceHighlight border border-border rounded-xl px-4 py-2 rounded-bl-sm">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-surfaceHighlight/50">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask AI to draft a campaign..."
              className="w-full pl-4 pr-12 py-3 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-text"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-black rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
