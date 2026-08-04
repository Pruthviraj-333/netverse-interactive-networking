import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Info, AlertCircle } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 792 – ICMPv4', url: 'https://www.rfc-editor.org/rfc/rfc792', type: 'rfc', rfcNumber: 792 },
  { title: 'RFC 4443 – ICMPv6', url: 'https://www.rfc-editor.org/rfc/rfc4443', type: 'rfc', rfcNumber: 4443 },
  { title: 'RFC 1122 – Requirements for Internet Hosts', url: 'https://www.rfc-editor.org/rfc/rfc1122', type: 'rfc', rfcNumber: 1122 },
];

const ICMP_TYPES = [
  { type: 0,  code: 0, name: 'Echo Reply',               color: '#10b981', desc: 'Response to ping. Contains original identifier + sequence number.' },
  { type: 3,  code: '0-15', name: 'Destination Unreachable', color: '#f43f5e', desc: 'Code 0=Net, 1=Host, 2=Protocol, 3=Port, 4=Frag needed (PMTUD), 13=Admin Prohibited.' },
  { type: 5,  code: '0-3', name: 'Redirect',              color: '#f59e0b', desc: 'Router tells host to use a better gateway for a destination.' },
  { type: 8,  code: 0, name: 'Echo Request',              color: '#3b82f6', desc: 'Ping request. Contains identifier, sequence number, and timestamp payload.' },
  { type: 11, code: '0-1', name: 'Time Exceeded',         color: '#f97316', desc: 'Code 0=TTL exceeded in transit (used by traceroute). Code 1=Fragment reassembly timeout.' },
  { type: 12, code: 0, name: 'Parameter Problem',         color: '#8b5cf6', desc: 'IP header contains invalid field. Pointer field identifies the problem byte.' },
];

// Ping animation steps
const PING_STEPS = [
  { id: 'send', label: 'Ping sends ICMP Echo Request', from: 'Host', to: 'Router 1', fromIcon: '💻', toIcon: '🔀', ttl: 64, color: '#3b82f6', desc: 'OS creates ICMP Type 8 (Echo Request) with TTL=64, seq=1. IP packet dst=8.8.8.8. Each hop decrements TTL.' },
  { id: 'r1',   label: 'Router 1 forwards, TTL=63',  from: 'Router 1', to: 'Router 2', fromIcon: '🔀', toIcon: '🔀', ttl: 63, color: '#3b82f6', desc: 'Router decrements TTL: 64→63. Forwards packet to next hop based on routing table.' },
  { id: 'r2',   label: 'Router 2 forwards, TTL=62',  from: 'Router 2', to: 'Destination', fromIcon: '🔀', toIcon: '🖥️', ttl: 62, color: '#3b82f6', desc: 'TTL=62. If TTL reached 0 at any router, that router would discard the packet and send ICMP Type 11 (Time Exceeded) back.' },
  { id: 'reply',label: '8.8.8.8 sends Echo Reply',   from: 'Destination', to: 'Host', fromIcon: '🖥️', toIcon: '💻', ttl: 56, color: '#10b981', desc: 'Destination (8.8.8.8) sends ICMP Type 0 (Echo Reply). Round-trip time measured. seq=1 matched to request.' },
  { id: 'rtt',  label: 'RTT measured: 12ms',         from: 'Host', to: 'Host', fromIcon: '💻', toIcon: '📊', ttl: null, color: '#10b981', desc: 'RTT (Round-Trip Time) = time from Echo Request sent to Echo Reply received. Sequence number confirms correct reply. Duplicates or out-of-order replies are detected.' },
];

// Traceroute steps
const TRACE_STEPS = [
  { ttl: 1, hop: 'Home Router 192.168.1.1', time: '1.2ms', msg: 'ICMP Type 11 (TTL Exceeded) from 192.168.1.1 — first hop identified' },
  { ttl: 2, hop: 'ISP Gateway 100.64.1.1',  time: '8.4ms', msg: 'TTL=2: next hop is ISP CGN gateway' },
  { ttl: 3, hop: 'ISP Core 203.0.113.1',    time: '15.2ms', msg: 'TTL=3: ISP backbone router' },
  { ttl: 4, hop: '8.8.8.8 (Google DNS)',    time: '22.1ms', msg: 'ICMP Type 0 (Echo Reply) — destination reached' },
];

export default function ICMPPage() {
  const [activeTab, setActiveTab] = useState<'ping' | 'traceroute' | 'types' | 'quiz'>('ping');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [traceStep, setTraceStep] = useState(-1);
  const [tracing, setTracing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('icmp'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep(s => {
          if (s >= PING_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('icmp'); return s; }
          return s + 1;
        });
      }, Math.round(1200 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const runTraceroute = () => {
    setTraceStep(-1);
    setTracing(true);
    let i = 0;
    const iv = setInterval(() => {
      setTraceStep(i);
      i++;
      if (i >= TRACE_STEPS.length) { clearInterval(iv); setTracing(false); }
    }, 800);
  };

  const currentPing = PING_STEPS[animStep];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Radio size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">ICMP — Internet Control Message Protocol</h1>
            <p className="text-sm text-slate-500 mt-0.5">Network Layer · RFC 792</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={3} size="sm" />
            <span className="badge-green">Beginner</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            ICMP is the diagnostic tool of the internet — used by <code className="text-xs bg-white/[0.06] px-1 rounded">ping</code> to check if a host is alive and <code className="text-xs bg-white/[0.06] px-1 rounded">traceroute</code> to map the path packets take. It reports errors back to senders when something goes wrong.
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (RFC 792): </span>
            ICMP sits inside IP packets (protocol number 1). It is NOT a transport protocol — it has no ports and carries no application data. It uses Type (8-bit) and Code (8-bit) fields to classify messages. ICMP is essential for Path MTU Discovery (Type 3 Code 4 "Fragmentation Needed"), TTL expiry (traceroute), and router-to-host error signalling. Blocking all ICMP in firewalls breaks PMTUD and blackholes connections.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['ping', 'traceroute', 'types', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'ping' ? '🏓 Ping' : tab === 'traceroute' ? '🗺️ Traceroute' : tab === 'types' ? '📋 ICMP Types' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'ping' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying} currentStep={animStep} totalSteps={PING_STEPS.length} speed={speed}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep(s => Math.min(s + 1, PING_STEPS.length - 1))}
            onStepBack={() => setAnimStep(s => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed} stepLabel={currentPing.label}
          />

          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6 space-y-2">
            {PING_STEPS.map((step, idx) => {
              const isPast = idx < animStep;
              const isCurrent = idx === animStep;
              return (
                <motion.div key={step.id} animate={{ opacity: idx > animStep ? 0.2 : 1 }}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: isCurrent ? step.color : isPast ? `${step.color}30` : 'rgba(255,255,255,0.04)',
                    backgroundColor: isCurrent ? `${step.color}12` : 'transparent',
                    boxShadow: isCurrent ? `0 0 16px ${step.color}20` : 'none',
                  }}>
                  <span className="text-xl">{step.fromIcon}</span>
                  <span className="text-xs text-slate-500">→</span>
                  <span className="text-xl">{step.toIcon}</span>
                  <span className="text-sm font-medium" style={{ color: isCurrent ? step.color : '#64748b' }}>{step.label}</span>
                  {step.ttl !== null && (
                    <span className="ml-auto text-xs font-mono" style={{ color: `${step.color}aa` }}>TTL={step.ttl}</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={animStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-xl p-5 space-y-2">
              <h3 className="text-white font-semibold">{currentPing.label}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{currentPing.desc}</p>
            </motion.div>
          </AnimatePresence>

          <div className="glass rounded-xl p-4 border border-rose-500/20">
            <p className="text-xs text-rose-400/80 flex items-center gap-1.5 mb-1"><AlertCircle size={11} /> Firewall Warning</p>
            <p className="text-xs text-slate-400 leading-relaxed">Blocking all ICMP in AWS Security Groups or iptables breaks Path MTU Discovery (PMTUD). Allow ICMP Type 3 Code 4 (Fragmentation Needed) at minimum — otherwise TCP connections over VPN/tunnels silently stall.</p>
          </div>
        </div>
      )}

      {activeTab === 'traceroute' && (
        <div className="space-y-5">
          <div className="glass rounded-xl p-5">
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              <span className="text-white font-medium">How traceroute works: </span>
              It sends packets with TTL=1, 2, 3… Each router that decrements TTL to 0 sends back ICMP Type 11 (Time Exceeded) identifying itself. By incrementing TTL, the full path is mapped hop by hop.
            </p>
            <button onClick={runTraceroute} disabled={tracing}
              className="btn-primary text-sm">
              {tracing ? '⏳ Tracing...' : '▶ Run Traceroute to 8.8.8.8'}
            </button>
          </div>

          <div className="space-y-2">
            {TRACE_STEPS.map((hop, i) => (
              <motion.div key={i}
                animate={{ opacity: traceStep >= i ? 1 : 0.15 }}
                transition={{ duration: 0.3 }}
                className="glass rounded-xl px-4 py-3 flex items-center gap-4"
                style={traceStep >= i ? { borderColor: i === TRACE_STEPS.length - 1 ? '#10b98140' : '#3b82f640' } : {}}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0"
                  style={{ backgroundColor: i === TRACE_STEPS.length - 1 ? '#10b98120' : '#3b82f620', color: i === TRACE_STEPS.length - 1 ? '#10b981' : '#3b82f6' }}>
                  {hop.ttl}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-mono text-slate-200">{hop.hop}</div>
                  <div className="text-xs text-slate-500">{hop.msg}</div>
                </div>
                <div className="font-mono text-sm text-emerald-400 shrink-0">{traceStep >= i ? hop.time : '...'}</div>
              </motion.div>
            ))}
          </div>

          <div className="glass rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Platform Differences</p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div><span className="text-white">Linux traceroute:</span> sends UDP datagrams (default) with high destination ports (33434+). TTL Exceeded replies map the path.</div>
              <div><span className="text-white">Windows tracert:</span> sends ICMP Echo Requests (like ping but with incrementing TTL).</div>
              <div><span className="text-white">traceroute -I (Linux):</span> use ICMP mode like Windows.</div>
              <div><span className="text-white">Firewalls:</span> many firewalls block UDP/ICMP causing traceroute to show <code className="bg-white/[0.06] px-1 rounded">* * *</code> (timeout, not necessarily dead).</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'types' && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400 mb-3">Key ICMP message types (RFC 792). Each has Type + Code field combination.</p>
          {ICMP_TYPES.map(t => (
            <div key={t.type} className="glass rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="w-8 h-6 rounded font-mono font-bold text-xs flex items-center justify-center border shrink-0"
                style={{ borderColor: `${t.color}40`, backgroundColor: `${t.color}15`, color: t.color }}>
                T{t.type}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-white">{t.name}</span>
                  <span className="text-[10px] text-slate-500">Code: {t.code}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="icmp" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock language="bash" filename="icmp-commands.sh" code={`# Basic ping (ICMP Echo Request/Reply)
ping 8.8.8.8
ping -c 4 google.com           # send 4 packets
ping -s 1400 -M do 8.8.8.8    # PMTUD: send 1400-byte packet, don't fragment

# Traceroute (UDP mode default on Linux)
traceroute 8.8.8.8
traceroute -I 8.8.8.8          # ICMP mode (like Windows tracert)
traceroute -T -p 443 8.8.8.8  # TCP SYN mode (bypasses ICMP blocks)

# Better traceroute: mtr (Matt's Traceroute) — live, continuous
mtr 8.8.8.8
mtr --report 8.8.8.8           # report mode (non-interactive)
mtr -T -P 443 8.8.8.8          # TCP mode

# Capture ICMP packets
sudo tcpdump -i eth0 -n icmp
sudo tcpdump -i eth0 -n 'icmp[icmptype] = icmp-echo'     # only requests
sudo tcpdump -i eth0 -n 'icmp[icmptype] = icmp-echoreply' # only replies

# Check if ICMP is blocked (AWS Security Groups)
# Must allow: Type 8 (Echo) inbound, Type 0 (Reply) outbound
# Critical: Type 3 Code 4 (Frag Needed) must not be blocked — breaks PMTUD`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
