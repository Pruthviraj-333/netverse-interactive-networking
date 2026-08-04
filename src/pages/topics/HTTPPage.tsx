import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Info, Send, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 9110 – HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110', type: 'rfc', rfcNumber: 9110 },
  { title: 'RFC 9112 – HTTP/1.1', url: 'https://www.rfc-editor.org/rfc/rfc9112', type: 'rfc', rfcNumber: 9112 },
  { title: 'RFC 9113 – HTTP/2', url: 'https://www.rfc-editor.org/rfc/rfc9113', type: 'rfc', rfcNumber: 9113 },
  { title: 'RFC 9114 – HTTP/3 (over QUIC)', url: 'https://www.rfc-editor.org/rfc/rfc9114', type: 'rfc', rfcNumber: 9114 },
];

const HTTP_STEPS = [
  { id: 'dns', label: '1. DNS Lookup', from: 'Browser', to: 'DNS Server', protocol: 'UDP 53', desc: 'Browser resolves domain name (e.g. api.example.com) to an IP address via DNS.', color: '#3b82f6' },
  { id: 'tcp', label: '2. TCP Handshake', from: 'Browser', to: 'Web Server', protocol: 'TCP 80/443', desc: '3-Way Handshake (SYN -> SYN-ACK -> ACK) establishes reliable L4 socket.', color: '#8b5cf6' },
  { id: 'request', label: '3. HTTP Request', from: 'Browser', to: 'Web Server', protocol: 'HTTP GET', desc: 'Browser sends HTTP Request: GET /api/v1/user HTTP/1.1 with Headers & Host.', color: '#f59e0b' },
  { id: 'processing', label: '4. Server Processing', from: 'Web Server', to: 'Web Server', protocol: 'App Logic', desc: 'Web server (Nginx/Node.js) processes request, queries DB, generates response.', color: '#ec4899' },
  { id: 'response', label: '5. HTTP Response', from: 'Web Server', to: 'Browser', protocol: '200 OK', desc: 'Server sends status 200 OK with Headers (Content-Type) and JSON/HTML body.', color: '#10b981' },
];

const STATUS_CODES = [
  { code: '200', category: '2xx Success', title: 'OK', desc: 'Request succeeded. Standard response for successful HTTP requests.' },
  { code: '201', category: '2xx Success', title: 'Created', desc: 'Request succeeded and a new resource was created (e.g. POST request).' },
  { code: '301', category: '3xx Redirection', title: 'Moved Permanently', desc: 'Resource permanently moved to a new URI (location header).' },
  { code: '304', category: '3xx Redirection', title: 'Not Modified', desc: 'Conditional GET: cached version is still valid. Saves bandwidth.' },
  { code: '400', category: '4xx Client Error', title: 'Bad Request', desc: 'Server cannot process request due to client syntax error or invalid payload.' },
  { code: '401', category: '4xx Client Error', title: 'Unauthorized', desc: 'Authentication required. Client must provide valid credentials.' },
  { code: '403', category: '4xx Client Error', title: 'Forbidden', desc: 'Client authenticated, but lacks permissions for the requested resource.' },
  { code: '404', category: '4xx Client Error', title: 'Not Found', desc: 'Target resource does not exist on server.' },
  { code: '429', category: '4xx Client Error', title: 'Too Many Requests', desc: 'Rate limiting exceeded. Client sent too many requests in a given time.' },
  { code: '500', category: '5xx Server Error', title: 'Internal Server Error', desc: 'Generic error: server encountered an unexpected condition or unhandled exception.' },
  { code: '502', category: '5xx Server Error', title: 'Bad Gateway', desc: 'Reverse proxy (Nginx/ALB) received an invalid response from upstream app.' },
  { code: '503', category: '5xx Server Error', title: 'Service Unavailable', desc: 'Server temporarily unable to handle request (overloaded or maintenance).' },
  { code: '504', category: '5xx Server Error', title: 'Gateway Timeout', desc: 'Upstream server failed to send a response in time to reverse proxy.' },
];

const HTTP_VERSIONS = [
  { version: 'HTTP/1.1', year: '1997', transport: 'TCP', features: 'Text-based headers, Keep-Alive persistent connections, subject to Head-of-Line (HOL) blocking per connection.', color: '#3b82f6' },
  { version: 'HTTP/2', year: '2015', transport: 'TCP', features: 'Binary framing layer, Multiplexing over single TCP connection, HPACK header compression, Server Push.', color: '#8b5cf6' },
  { version: 'HTTP/3', year: '2020', transport: 'UDP (QUIC)', features: 'Built on QUIC over UDP, eliminates TCP HOL blocking, mandatory 0-RTT/1-RTT encryption, seamless connection migration.', color: '#10b981' },
];

export default function HTTPPage() {
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'versions' | 'codes' | 'quiz'>('lifecycle');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('http'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep(s => {
          if (s >= HTTP_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('http'); return s; }
          return s + 1;
        });
      }, Math.round(1300 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const currentStep = HTTP_STEPS[animStep];
  const filteredCodes = selectedCategory === 'all' 
    ? STATUS_CODES 
    : STATUS_CODES.filter(c => c.category.startsWith(selectedCategory));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Globe size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">HTTP — Hypertext Transfer Protocol</h1>
            <p className="text-sm text-slate-500 mt-0.5">Application Layer · RFC 9110</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={7} size="sm" />
            <span className="badge-green">Beginner</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            HTTP is the protocol of the Web. Whenever you open a web page, your browser sends an HTTP Request ("Give me index.html") and the server sends an HTTP Response ("Here is the file, Status 200 OK").
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (RFC 9110): </span>
            HTTP is a stateless, application-layer request-response protocol. It operates over TCP (HTTP/1.1, HTTP/2) or QUIC/UDP (HTTP/3). Messages consist of start-lines (method/path/version or status code/reason), headers (key-value metadata), and optional body payloads.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['lifecycle', 'versions', 'codes', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'lifecycle' ? '🔄 Lifecycle' : tab === 'versions' ? '⚡ HTTP/1.1 vs 2 vs 3' : tab === 'codes' ? '🚦 Status Codes' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'lifecycle' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying} currentStep={animStep} totalSteps={HTTP_STEPS.length} speed={speed}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep(s => Math.min(s + 1, HTTP_STEPS.length - 1))}
            onStepBack={() => setAnimStep(s => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed} stepLabel={currentStep.label}
          />

          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6">
            <div className="grid grid-cols-3 mb-6">
              {['💻 Client (Browser)', '🌐 Network Path', '🖥️ Web Server'].map(h => (
                <div key={h} className="text-center text-xs font-semibold text-slate-400">{h}</div>
              ))}
            </div>

            <div className="space-y-3">
              {HTTP_STEPS.map((step, idx) => {
                const isCurrent = idx === animStep;
                const isPast = idx < animStep;
                return (
                  <motion.div key={step.id} animate={{ opacity: idx > animStep ? 0.25 : 1 }}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3"
                    style={{
                      borderColor: isCurrent ? step.color : isPast ? `${step.color}30` : 'rgba(255,255,255,0.04)',
                      backgroundColor: isCurrent ? `${step.color}12` : 'transparent',
                      boxShadow: isCurrent ? `0 0 16px ${step.color}20` : 'none',
                    }}>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border" style={{ color: step.color, borderColor: `${step.color}40`, backgroundColor: `${step.color}15` }}>
                      {step.protocol}
                    </span>
                    <span className="text-sm font-medium text-slate-200">{step.label}</span>
                    <span className="text-xs text-slate-500 ml-auto hidden sm:inline">{step.from} → {step.to}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={animStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-xl p-5 space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStep.color }} />
                {currentStep.label}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{currentStep.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HTTP_VERSIONS.map(v => (
              <div key={v.version} className="glass rounded-xl p-5 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{v.version}</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">{v.year}</span>
                </div>
                <div className="text-xs font-mono" style={{ color: v.color }}>Transport: {v.transport}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{v.features}</p>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white mb-2">Why HTTP/3 (QUIC) is Revolutionary</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              HTTP/1.1 suffered from Connection Head-of-Line (HOL) blocking. HTTP/2 solved this at HTTP level by multiplexing streams over a single TCP connection, but created TCP-level HOL blocking (if 1 TCP packet drops, all streams pause). HTTP/3 replaces TCP with QUIC over UDP, giving independent stream delivery so packet loss on one stream does not block others.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'codes' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['all', '2xx', '3xx', '4xx', '5xx'].map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all ${selectedCategory === cat ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'glass border-white/[0.06] text-slate-400'}`}>
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCodes.map(c => (
              <div key={c.code} className="glass rounded-xl p-4 flex items-start gap-3">
                <div className={`font-mono text-sm font-bold px-2 py-1 rounded border shrink-0 ${
                  c.code.startsWith('2') ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                  c.code.startsWith('3') ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                  c.code.startsWith('4') ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                  'text-rose-400 border-rose-500/30 bg-rose-500/10'
                }`}>
                  {c.code}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{c.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="http" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock language="bash" filename="http-commands.sh" code={`# Perform HTTP request with verbose headers
curl -v https://api.github.com/users/octocat

# Inspect response headers only
curl -I https://google.com

# Force HTTP/2
curl --http2 -I https://cloudflare.com

# Force HTTP/3 (QUIC)
curl --http3 -I https://cloudflare.com

# Send POST request with JSON payload
curl -X POST https://httpbin.org/post \\
  -H "Content-Type: application/json" \\
  -d '{"name": "NetVerse", "role": "networking"}'

# Capture HTTP GET traffic with tcpdump
sudo tcpdump -i eth0 -n -s 0 -A 'tcp port 80 and (((ip[20:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
