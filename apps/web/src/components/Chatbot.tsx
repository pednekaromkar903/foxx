'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am Atomberg AI. Ask me about goals, innovations, team performance, or cycle updates.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setError(false);

    try {
      const res = await api.post('/chatbot', { message: userMsg });
      const data = res.data;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err: any) {
      setError(true);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `AI is currently offline. Please ensure Ollama is running with 'ollama run tinyllama'.` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const chips = [
    "Show my Q2 progress",
    "Pending approvals",
    "Team completion rate"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen ? (
        <div className="w-[380px] h-[580px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-[#0066FF] text-white p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-base block">Atomberg AI</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Online • v2.0</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2 text-amber-700 text-xs font-semibold">
              <AlertTriangle size={14} />
              AI offline — start Ollama
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#F8FAFC]">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-100 relative">
                    <Bot size={16} className="text-[#0066FF]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00D4FF] rounded-full border-2 border-white flex items-center justify-center">
                      <Sparkles size={6} className="text-white" />
                    </div>
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#0066FF] text-white rounded-tr-none shadow-md'
                      : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                  <Loader2 size={16} className="text-[#0066FF] animate-spin" />
                </div>
                <div className="bg-white text-slate-500 p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Quick Chips */}
          {!loading && messages.length < 4 && (
            <div className="px-5 py-3 flex gap-2 overflow-x-auto bg-[#F8FAFC] no-scrollbar">
              {chips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(chip)}
                  className="whitespace-nowrap px-3 py-1.5 bg-white border border-[#0066FF]/20 text-[#0066FF] text-xs font-bold rounded-full hover:bg-[#0066FF] hover:text-white transition-all shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-5 border-t bg-white">
            <div className="relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
                className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-[#0066FF] text-white rounded-xl hover:bg-[#0052CC] disabled:opacity-50 disabled:bg-slate-300 transition-all flex items-center justify-center shadow-md shadow-blue-100"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-[#0066FF] text-white rounded-full shadow-[0_8px_25px_rgba(0,102,255,0.4)] hover:bg-[#0052CC] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative"
        >
          <Bot size={32} />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#00D4FF] rounded-full border-4 border-white animate-pulse"></div>
        </button>
      )}
    </div>
  );
}
