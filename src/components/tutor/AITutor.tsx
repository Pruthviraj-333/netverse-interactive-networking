import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Trash2, ExternalLink, AlertCircle, Zap, Cpu } from 'lucide-react';
import { streamGroqAnswer, GROQ_AVAILABLE } from '../../utils/groq';
import { useTutorStore } from '../../stores';
import { cn, uid } from '../../utils/helpers';
import type { TutorMessage } from '../../types';

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ streaming }: { streaming: boolean }) {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
        <Bot size={12} className="text-violet-400" />
      </div>
      <div className="glass rounded-2xl rounded-bl-sm px-3 py-2.5">
        {streaming ? (
          <div className="flex items-center gap-1.5 text-xs text-violet-400">
            <Cpu size={11} className="animate-pulse" />
            <span>Thinking…</span>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function TutorMessageBubble({ msg, isStreaming }: { msg: TutorMessage; isStreaming?: boolean }) {
  const isUser = msg.role === 'user';

  // Parse simple markdown: **bold**, `code`
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-[11px] px-1 py-0.5 rounded bg-white/[0.08] text-electric-300">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

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

      <div className={cn('max-w-[88%] space-y-2', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-3 py-2.5 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-electric-600/20 border border-electric-500/30 text-slate-200 rounded-br-sm'
              : 'glass rounded-bl-sm text-slate-300'
          )}
        >
          <span>{renderContent(msg.content)}</span>
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />
          )}
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
                {ref.rfcNumber ? `RFC ${ref.rfcNumber}` : ref.title.slice(0, 22)}
              </a>
            ))}
          </div>
        )}

        {/* Uncertainty warning */}
        {msg.confidence === 'uncertain' && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400/70">
            <AlertCircle size={11} />
            <span>Uncertain — verify with official docs</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Suggested questions ──────────────────────────────────────────────────────
const SUGGESTED = [
  'How does the TCP 3-way handshake work?',
  'Explain DNS resolution step by step',
  'What is the difference between TCP and UDP?',
  'How does NAT work in AWS VPC?',
  'What happens during a TLS 1.3 handshake?',
  'How does ARP work on a local network?',
  'What is DHCP and the DORA process?',
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function AITutor() {
  const { messages, isTyping, addMessage, setTyping, clearMessages } = useTutorStore();
  const [input, setInput] = useState('');
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, streamingContent]);

  // Welcome message on first open
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        id: uid(),
        role: 'assistant',
        content: GROQ_AVAILABLE
          ? "Hi! I'm the NetVerse AI Tutor powered by Llama 3.3 via Groq. Ask me anything about networking — protocols, packet flows, OSI layers, Linux commands, cloud architecture, or Kubernetes networking. I always cite RFCs when I'm confident."
          : "Hi! I'm the NetVerse AI Tutor (local knowledge base mode). Ask me about OSI, DNS, TCP, ARP, subnetting, and more.",
        timestamp: Date.now(),
        confidence: 'high',
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(async (queryOverride?: string) => {
    const q = (queryOverride ?? input).trim();
    if (!q || isTyping) return;

    // Add user message
    addMessage({ id: uid(), role: 'user', content: q, timestamp: Date.now(), confidence: 'high' });
    setInput('');
    setTyping(true);

    // Build history for context
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Create placeholder for streaming message
    const assistantId = uid();
    setStreamingId(assistantId);
    setStreamingContent('');

    await streamGroqAnswer(
      q,
      history,
      // onChunk — update streaming display
      (token) => {
        setStreamingContent((prev) => prev + token);
      },
      // onDone — commit final message
      (fullText) => {
        setStreamingId(null);
        setStreamingContent('');
        setTyping(false);
        addMessage({
          id: assistantId,
          role: 'assistant',
          content: fullText,
          timestamp: Date.now(),
          confidence: 'high',
        });
      },
      // onError / fallback
      (fallbackText, fromLocal) => {
        setStreamingId(null);
        setStreamingContent('');
        setTyping(false);
        addMessage({
          id: assistantId,
          role: 'assistant',
          content: fallbackText,
          timestamp: Date.now(),
          confidence: fromLocal ? 'medium' : 'uncertain',
        });
      }
    );
  }, [input, isTyping, messages, addMessage, setTyping]);

  const shownMessages = messages;
  const showSuggestions = shownMessages.length <= 1 && !isTyping;

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
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              {GROQ_AVAILABLE ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400/80">Groq · Llama 3.3</span>
                </>
              ) : (
                <span>Local knowledge base</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={clearMessages} className="btn-icon" title="Clear chat">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {shownMessages.map((msg) => (
          <TutorMessageBubble
            key={msg.id}
            msg={msg}
            isStreaming={msg.id === streamingId}
          />
        ))}

        {/* Live streaming bubble */}
        {streamingId && streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2 mb-3"
          >
            <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Bot size={12} className="text-violet-400" />
            </div>
            <div className="glass rounded-2xl rounded-bl-sm px-3 py-2.5 max-w-[88%] text-sm text-slate-300 leading-relaxed">
              {streamingContent}
              <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />
            </div>
          </motion.div>
        )}

        {/* Typing indicator (before streaming starts) */}
        {isTyping && !streamingContent && <TypingIndicator streaming={GROQ_AVAILABLE} />}

        {/* Suggested questions */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 space-y-1.5"
            >
              <p className="text-[10px] text-slate-600 mb-2 flex items-center gap-1">
                <Zap size={10} /> Try asking:
              </p>
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="w-full text-left text-[11px] text-slate-400 hover:text-white glass rounded-lg px-3 py-2 transition-all hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]"
                >
                  {q}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

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
            placeholder={isTyping ? 'Waiting for response…' : 'Ask about networking…'}
            disabled={isTyping}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none disabled:opacity-40"
            aria-label="Ask AI tutor"
          />
          <motion.button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
              input.trim() && !isTyping
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'bg-white/[0.05] text-slate-600'
            )}
            aria-label="Send message"
          >
            <Send size={13} />
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2">
          {GROQ_AVAILABLE ? 'Powered by Groq · RFC-grounded' : 'AI may be wrong — verify with official docs'}
        </p>
      </div>
    </motion.aside>
  );
}
