import { useServingInvoke } from '@databricks/appkit-ui/react';
import { useState, useRef, useEffect } from 'react';

interface ChatChoice {
  message?: { content?: string };
}
interface ChatResponse {
  choices?: ChatChoice[];
}

function extractContent(data: unknown): string {
  const resp = data as ChatResponse;
  return resp?.choices?.[0]?.message?.content ?? JSON.stringify(data, null, 2);
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'What are my largest sources of Scope 3 emissions?',
  'How do my emissions compare to industry benchmarks?',
  'What reduction opportunities should I prioritize?',
  'Explain what Scope 2 market-based vs location-based means',
  'What data do I need for CSRD reporting?',
  'How do I calculate Scope 3 Category 1 purchased goods?',
];

export function AssistantPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: 'Hello! I\'m your ESG & carbon accounting assistant, powered by Databricks Agent Bricks. I can help you understand your emissions data, navigate GHG Protocol frameworks (Scope 1/2/3), and prepare for CSRD, CDP, or GRI reporting. What would you like to know?',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { invoke, loading, error } = useServingInvoke({ messages: [] });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const fullHistory = [
      ...messages.map(({ role, content }) => ({ role, content })),
      { role: 'user' as const, content: trimmed },
    ];

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    void invoke({ messages: fullHistory }).then((result) => {
      if (result) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: extractContent(result) },
        ]);
      }
    });
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground">ESG AI Assistant</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Powered by Databricks Agent Bricks · GHG Protocol · CSRD · CDP · GRI
        </p>
      </div>

      <div className="border rounded-lg flex flex-col h-[min(550px,65vh)] bg-background">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.role === 'assistant' && (
                  <p className="text-xs font-semibold text-muted-foreground mb-1">ESG Assistant</p>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2.5 bg-muted">
                <p className="text-xs font-semibold text-muted-foreground mb-1">ESG Assistant</p>
                <div className="flex gap-1 items-center h-5">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">{error}</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="border-t p-3 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your emissions, frameworks, or reduction strategies..."
            className="flex-1 rounded-md border px-3 py-2 text-sm bg-background"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">Suggested questions</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              disabled={loading}
              className="text-xs border rounded-full px-3 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
