import { useEffect, useMemo, useState } from 'react'
import { controlRoomImg, edgeDeviceImg, voiceWorkspaceImg } from './images'

declare global {
  interface Window {
    webkitSpeechRecognition?: any
    SpeechRecognition?: any
  }
}

type MemoryItem = {
  id: number
  kind: 'voice' | 'task' | 'memory'
  title: string
  content: string
  createdAt: string
}

type ConversationItem = {
  id: number
  role: 'user' | 'astra'
  content: string
}

const commandPresets = [
  'Summarize my meeting notes into 3 bullets',
  'Plan a focused 2-hour deep work session',
  'Explain vector databases like I am a beginner',
  'Remember that I prefer concise responses',
]

const starterTranscript = 'Summarize today\'s product brainstorm and turn it into next steps.'

function App() {
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('AstraOS is ready. Speak or type a command to simulate an on-device AI session.')
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [conversation, setConversation] = useState<ConversationItem[]>([])
  const [commandMode, setCommandMode] = useState<'summarize' | 'plan' | 'explain' | 'remember'>('summarize')

  useEffect(() => {
    const savedMemories = localStorage.getItem('astraos-memories')
    const savedConversation = localStorage.getItem('astraos-conversation')
    if (savedMemories) setMemories(JSON.parse(savedMemories))
    if (savedConversation) setConversation(JSON.parse(savedConversation))
    setVoiceSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition))
  }, [])

  useEffect(() => {
    localStorage.setItem('astraos-memories', JSON.stringify(memories))
  }, [memories])

  useEffect(() => {
    localStorage.setItem('astraos-conversation', JSON.stringify(conversation))
  }, [conversation])

  const memoryContext = useMemo(() => {
    const latest = memories.slice(0, 4)
    return latest.map((item) => item.content).join(' | ')
  }, [memories])

  const speak = (text: string) => {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.02
    utterance.pitch = 1
    synth.speak(utterance)
  }

  const addConversation = (role: 'user' | 'astra', content: string) => {
    setConversation((prev) => [{ id: Date.now() + Math.random(), role, content }, ...prev].slice(0, 8))
  }

  const storeMemory = (kind: MemoryItem['kind'], title: string, content: string) => {
    setMemories((prev) => [{ id: Date.now(), kind, title, content, createdAt: new Date().toLocaleString() }, ...prev].slice(0, 10))
  }

  const generateLocalResponse = (input: string) => {
    const lower = input.toLowerCase()

    if (lower.includes('remember')) {
      const remembered = input.replace(/remember/gi, '').trim() || 'User asked AstraOS to remember a new preference.'
      storeMemory('memory', 'Preference stored', remembered)
      return `Stored locally: ${remembered}. I will use this in future on-device responses.`
    }

    if (lower.includes('summarize')) {
      const cleaned = input.replace(/summarize/gi, '').trim() || starterTranscript
      const parts = cleaned.split(/[,.]| and /).map((p) => p.trim()).filter(Boolean)
      return `Offline summary:\n• ${parts[0] || 'Core topic identified'}\n• ${parts[1] || 'Important supporting detail captured'}\n• ${parts[2] || 'Suggested action item generated'}\n\nContext memory: ${memoryContext || 'No saved memory yet.'}`
    }

    if (lower.includes('plan')) {
      return `Local execution plan:\n1. Define the outcome and timebox it.\n2. Break the task into two high-value milestones.\n3. Reserve a distraction-free block.\n4. End with a quick review and next action.\n\nUsing memory context: ${memoryContext || 'No prior preferences saved.'}`
    }

    if (lower.includes('explain')) {
      const subject = input.replace(/explain/gi, '').trim() || 'the topic'
      return `${subject.charAt(0).toUpperCase() + subject.slice(1)} works like a local expert assistant thinking on your device: it takes your input, finds the key idea, reduces complexity, and returns a practical explanation without sending data to the cloud.`
    }

    return `AstraOS local reasoning result: I detected an open command. Try starting with summarize, plan, explain, or remember for stronger offline task handling.`
  }

  const runCommand = (value?: string) => {
    const input = (value ?? transcript).trim()
    if (!input) return
    addConversation('user', input)
    storeMemory('task', 'Executed command', input)
    const next = generateLocalResponse(input)
    setResponse(next)
    addConversation('astra', next)
    speak(next)
    setTranscript('')
  }

  const startVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    setIsListening(true)
    recognition.onresult = (event: any) => {
      const result = event.results?.[0]?.[0]?.transcript || ''
      setTranscript(result)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  return (
    <div className="min-h-screen bg-void text-ink">
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-grid bg-[size:38px_38px] opacity-10" />
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-10">
          <div className="relative z-10 flex flex-col justify-between rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-sm lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-accent/90">AstraOS</p>
                <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-white md:text-6xl">
                  Your private AI operating layer, running fully offline in the browser.
                </h1>
              </div>
              <div className="hidden rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs text-accent md:block">
                RunAnywhere SDK concept demo
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-white/10 bg-panel/80 p-4">
                <img src={controlRoomImg} alt="Futuristic offline AI control interface" className="h-64 w-full rounded-[22px] object-cover" />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Core loop</p>
                    <p className="mt-2 text-sm text-slate-200">Speech-to-text → local reasoning → spoken response, all simulated on-device.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Privacy</p>
                    <p className="mt-2 text-sm text-slate-200">No cloud calls, no server dependency, no external AI runtime required.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 to-transparent p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Offline capabilities</p>
                  <ul className="mt-4 space-y-3 text-sm text-slate-100">
                    <li>• Voice command input</li>
                    <li>• Simulated local LLM command routing</li>
                    <li>• Context memory persisted in-browser</li>
                    <li>• Text-to-speech response playback</li>
                  </ul>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-panel p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Quick commands</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {commandPresets.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setTranscript(preset)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-accent/40 hover:bg-accent/10"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid gap-4">
            <div className="rounded-[32px] border border-white/10 bg-panel/90 p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Command console</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Browser-based offline assistant</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs ${voiceSupported ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>
                  {voiceSupported ? 'Voice available' : 'Voice limited'}
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="grid gap-2 sm:grid-cols-4">
                  {(['summarize', 'plan', 'explain', 'remember'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setCommandMode(mode)
                        setTranscript(mode + ' ')
                      }}
                      className={`rounded-2xl px-4 py-3 text-sm transition ${commandMode === mode ? 'bg-accent text-white' : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div>
                  <label htmlFor="commandInput">Type a command</label>
                  <textarea
                    id="commandInput"
                    rows={5}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Try: summarize the roadmap review and highlight risks"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => runCommand()}
                    className="rounded-2xl bg-cyan-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-200"
                  >
                    Run local command
                  </button>
                  <button
                    onClick={startVoice}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                  >
                    {isListening ? 'Listening…' : 'Start voice input'}
                  </button>
                  <button
                    onClick={() => speak(response)}
                    className="rounded-2xl border border-accent/30 bg-accent/10 px-5 py-3 font-medium text-accent transition hover:bg-accent/20"
                  >
                    Replay voice
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Astra response</p>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-100">{response}</pre>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-white/10 bg-panel/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">System model</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">An OS-style assistant interface built for privacy-first AI</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <img src={edgeDeviceImg} alt="Edge device running local AI processing" className="h-44 w-full rounded-[18px] object-cover" />
                <p className="mt-4 text-lg font-medium text-white">Runs at the edge</p>
                <p className="mt-2 text-sm text-slate-300">The concept centers around local execution, keeping latency low and personal data inside the device environment.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <img src={voiceWorkspaceImg} alt="Voice-driven AI workspace on a desktop" className="h-44 w-full rounded-[18px] object-cover" />
                <p className="mt-4 text-lg font-medium text-white">Conversational workflow</p>
                <p className="mt-2 text-sm text-slate-300">Users can type or speak commands, get immediate spoken replies, and maintain a persistent contextual memory.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[32px] border border-white/10 bg-panel/70 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Conversation log</p>
              <div className="mt-4 space-y-3">
                {conversation.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Your local interactions will appear here after you run a command.</div>
                ) : (
                  conversation.map((item) => (
                    <div key={item.id} className={`rounded-2xl p-4 text-sm ${item.role === 'user' ? 'bg-white/5 text-slate-100' : 'bg-cyan-300/10 text-cyan-50 border border-cyan-300/10'}`}>
                      <p className="mb-1 text-xs uppercase tracking-[0.18em] opacity-70">{item.role === 'user' ? 'User command' : 'Astra reply'}</p>
                      <p className="leading-6">{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-panel/70 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Context memory</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Persistent local memory</h3>
                </div>
                <button
                  onClick={() => {
                    setMemories([])
                    setConversation([])
                    localStorage.removeItem('astraos-memories')
                    localStorage.removeItem('astraos-conversation')
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
                >
                  Clear memory
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {memories.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No memory stored yet. Try a command like “Remember that I prefer concise responses.”</div>
                ) : (
                  memories.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <span className="text-xs text-slate-400">{item.createdAt}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
