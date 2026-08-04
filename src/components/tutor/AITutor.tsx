import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import knowledgeBase from '../../data/knowledgeBase';
import { useTutorStore } from '../../stores';
import { cn, uid } from '../../utils/helpers';
import type { TutorMessage, KnowledgeEntry } from '../../types';

/**
 * Keyword-based answer lookup from the local knowledge base.
 * Phase 2: Replace this function body with a Groq API call.
 *
 * Matching strategy:
 * 1. Tokenise the query to lowercase words
 * 2. Score each KB entry by number of keyword matches
 * 3. Return best match; if score = 0, return the fallback "uncertain" entry
 */
function lookupAnswer(query: string): KnowledgeEntry {
  const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);
  let bestMatch: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    if (entry.confidence === 'uncertain') continue; // skip fallback in scoring
    let score = 0;
    for (const kw of entry.keywords) {
      if (tokens.some((t) => t.includes(kw) || kw.includes(t))) score += 1;
    }
    if (score > bestScore) { bestScore = score; bestMatch = entry; }
  }

  const fallback = knowledgeBase.find((e) => e.id === 'uncertain-fallback')!;
  return bestScore > 0 && bestMatch ? bestMatch : fallback;
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
        <Bot size={12} className="text-violet-400" />
      </div>
      <div className="glass rounded-2xl rounded-bl-sm px-3 py-2.5">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TutorMessageBubble({ msg }: { msg: TutorMessage }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-end gap-2 mb-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <Bot size={12} className="text-violet-400" />
        </div>
      )}
      <div className={cn('max-w-[85%] space-y-2', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-3 py-2.5 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-electric-600/20 border border-electric-500/30 text-slate-200 rounded-br-sm'
              : 'glass rounded-bl-sm text-slate-300'
          )}
        >
          {msg.content}
        </div>

        {/* References */}
        {msg.references && msg.references.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.references.map((ref, i) => (
              <a
                key={i}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-300 border border-amber-500/20 rounded-full px-2 py-0.5 transition-colors"
              >
                <ExternalLink size={9} />
                {ref.rfcNumber ? `RFC ${ref.rfcNumber}` : ref.title.slice(0, 20)}
              </a>
            ))}
          </div>
        )}

        {/* Uncertainty warning */}
        {msg.confidence === 'uncertain' && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400/70">
            <AlertCircle size={11} />
            <span>Uncertain — please verify with official docs</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AITutor() {
  const { messages, isTyping, addMessage, setTyping, clearMessages } = useTutorStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Welcome message on first open
    if (messages.length === 0) {
      addMessage({
        id: uid(),
        role: 'assistant',
        content:
          "Hi! I'm the NetVerse AI tutor. Ask me anything about networking — OSI model, DNS, TCP, ARP, subnetting, and more. I'll always cite official RFCs when I'm confident.",
        timestamp: Date.now(),
        confidence: 'high',
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    const q = input.trim();
    if (!q) return;

    addMessage({ id: uid(), role: 'user', content: q, timestamp: Date.now(), confidence: 'high' });
    setInput('');
    setTyping(true);

    // Simulate network latency for more natural UX
    setTimeout(() => {
      const entry = lookupAnswer(q);
      setTyping(false);
      addMessage({
        id: uid(),
        role: 'assistant',
        content: entry.answer,
        relatedTopicId: entry.topicId,
        references: entry.references,
        timestamp: Date.now(),
        confidence: entry.confidence,
      });
    }, 600 + Math.random() * 400);
  };

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-80 h-full border-l border-white/[0.06] flex flex-col shrink-0"
      style={{ background: 'rgba(10, 14, 35, 0.98)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Bot size={15} className="text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">AI Tutor</div>
            <div className="text-[10px] text-slate-500">RFC-grounded answers</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearMessages} className="btn-icon" title="Clear chat">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Phase 1 notice */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-400/80">
        Phase 1: Local knowledge base. Phase 2 will use Groq LLM.
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.map((msg) => (
          <TutorMessageBubble key={msg.id} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about networking…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
            aria-label="Ask AI tutor"
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim()}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
              input.trim()
                ? 'bg-violet-600 text-white'
                : 'bg-white/[0.05] text-slate-600'
            )}
            aria-label="Send message"
          >
            <Send size={13} />
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2">
          AI may be wrong — always verify with official docs
        </p>
      </div>
    </motion.aside>
  );
}
