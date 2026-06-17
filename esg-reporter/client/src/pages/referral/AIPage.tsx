import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Lightbulb } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const EXAMPLE_QUERIES = [
  'Find dialysis centers near Jaipur with high trust score',
  'Which states have the most oncology facilities?',
  'Show me verified eye care hospitals in Tamil Nadu',
  'Find pediatric hospitals in Maharashtra with doctor count data',
  'What facilities are available in rural Rajasthan?',
];

export function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "I'm your Referral Copilot AI, powered by Databricks Agent Bricks. I can help you find healthcare facilities across India from the Virtue Foundation dataset of 10,000+ facilities.\n\nAsk me anything like:\n• \"Find dialysis centers near Jaipur\"\n• \"Which cities have the most oncology hospitals?\"\n• \"Show me verified maternity hospitals in UP\"",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const resp = await fetch('/api/serving/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: msg }] }),
      });

      if (!resp.ok) {
        const err = await resp.json() as { error?: string };
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${err.error ?? resp.statusText}` },
        ]);
        return;
      }

      const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
      const reply = data.choices?.[0]?.message?.content ?? '(no response)';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Network error: ${(err as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-64px)]">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          AI Copilot
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Powered by Databricks Agent Bricks · Queries the real Unity Catalog dataset
        </p>
      </div>

      {/* Example queries */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="text-xs text-gray-400 self-center flex items-center gap-1">
          <Lightbulb className="w-3 h-3" /> Try:
        </span>
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => void send(q)}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
              }`}
            >
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
          }}
          placeholder="Ask about facilities, care needs, locations…"
          className="flex-1 resize-none text-sm focus:outline-none text-gray-800 placeholder-gray-400 max-h-32 overflow-y-auto"
        />
        <button
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
