import Groq from 'groq-sdk';
import knowledgeBase from '../data/knowledgeBase';
import type { KnowledgeEntry } from '../types';

// ─── Groq client (browser-safe: key exposed to Vite bundle, keep repo private) ─
const API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

let _groq: Groq | null = null;

function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({
      apiKey: API_KEY ?? '',
      dangerouslyAllowBrowser: true, // required for Vite/browser usage
    });
  }
  return _groq;
}

export const GROQ_AVAILABLE = Boolean(API_KEY);

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are NetVerse AI, an expert networking tutor embedded in an interactive learning platform.

Your knowledge and teaching style:
- You are equivalent to a CCNA/CCNP + Cloud + Kubernetes networking engineer
- You ALWAYS structure your answers cleanly into distinct sections:

1. 💡 **Concept & Analogy**: A simple, intuitive explanation or real-world analogy.
2. ⚙️ **Technical Details & Mechanism**: Step-by-step technical breakdown using numbered lists or bullet points. Include exact port numbers, headers, and protocol rules.
3. 🛠️ **Command / RFC Reference**: Relevant Linux CLI commands (ip, tcpdump, dig, ss) and exact RFC citations (e.g. "RFC 9293 §3.5").

Format rules:
- Always use structured headings (e.g. ### 💡 Concept, ### ⚙️ Technical Breakdown, ### 🛠️ CLI & RFC Reference).
- Use clear bullet points (- ) and numbered lists (1. 2. 3.).
- Wrap Linux commands and code in fenced markdown blocks (\`\`\`bash ... \`\`\`).
- Wrap inline headers, ports, and parameters in backticks (\`TCP\`, \`443\`, \`SYN\`).
- Keep responses concise, well-spaced, and easy to read.`;

// ─── Local KB fallback ────────────────────────────────────────────────────────
function localFallback(query: string): KnowledgeEntry {
  const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);
  let best: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    if (entry.confidence === 'uncertain') continue;
    let score = 0;
    for (const kw of entry.keywords) {
      if (tokens.some((t) => t.includes(kw) || kw.includes(t))) score++;
    }
    if (score > bestScore) { bestScore = score; best = entry; }
  }

  return bestScore > 0 && best
    ? best
    : knowledgeBase.find((e) => e.id === 'uncertain-fallback')!;
}

// ─── Streaming Groq call ──────────────────────────────────────────────────────
/**
 * Calls Groq with streaming and calls `onChunk` for each token.
 * Returns the full response text when done.
 * Falls back to local KB if the API is unavailable or throws.
 */
export async function streamGroqAnswer(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk: (token: string) => void,
  onDone: (fullText: string) => void,
  onError: (fallbackText: string, fromLocal: boolean) => void
): Promise<void> {
  if (!GROQ_AVAILABLE) {
    const entry = localFallback(query);
    onError(entry.answer, true);
    return;
  }

  try {
    const groq = getGroq();

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-8), // last 4 turns of context
        { role: 'user', content: query },
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.3,   // deterministic for technical accuracy
    });

    let full = '';
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? '';
      if (token) {
        full += token;
        onChunk(token);
      }
    }
    onDone(full);
  } catch (err) {
    console.warn('[NetVerse] Groq API error, falling back to local KB:', err);
    const entry = localFallback(query);
    onError(entry.answer, true);
  }
}
