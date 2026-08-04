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
- You explain concepts at two levels: simple analogy first, then precise technical detail
- You ALWAYS cite the exact RFC number or official standard when explaining a protocol (e.g. "RFC 9293 §3.5 defines...")
- You NEVER fabricate packet behaviour, header values, or protocol steps
- You use concrete numbers: real port numbers, real TTL values, real header sizes
- You connect networking to real-world DevOps/SRE/Cloud/Kubernetes scenarios
- When showing commands, prefer Linux/iproute2 syntax (ip, ss, dig, tcpdump)

Format rules:
- Keep responses concise but technically complete (aim for 3-6 sentences for simple questions, more for complex ones)
- Use markdown sparingly — bold for key terms, backticks for commands/values/headers
- If asked about a protocol, mention which OSI layer it operates at
- If unsure, say "I'm not certain, please verify with the official RFC or documentation"
- Never make up RFC numbers

Topics you cover deeply: OSI Model, DNS (RFC 1034/1035), TCP (RFC 9293), UDP (RFC 768), 
ICMP (RFC 792), ARP (RFC 826), DHCP (RFC 2131), HTTP (RFC 9110), HTTPS/TLS (RFC 8446), 
SSH (RFC 4251), NAT (RFC 3022), IP/Subnetting (RFC 791, 4632, 1918), 
Linux networking (iproute2, iptables, netfilter), AWS VPC, Kubernetes networking, Docker networking.`;

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
