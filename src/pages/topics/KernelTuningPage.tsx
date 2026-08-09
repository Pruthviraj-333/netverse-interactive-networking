import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Sliders, Activity, Info, AlertOctagon, Terminal } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import TopicFooterNav from '../../components/common/TopicFooterNav';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'Linux Kernel Documentation – IP Sysctl', url: 'https://docs.kernel.org/networking/ip-sysctl.html', type: 'linux', description: 'Official sysctl parameters for Linux TCP/IP stack' },
  { title: 'Cloudflare – When TCP Sockets Refuse to Die (TCP Keepalives & User Timeout)', url: 'https://blog.cloudflare.com/when-tcp-sockets-refuse-to-die/', type: 'official' },
  { title: 'RFC 9293 – Transmission Control Protocol', url: 'https://www.rfc-editor.org/rfc/rfc9293', type: 'rfc', rfcNumber: 9293 },
];

interface TuningStep {
  id: string;
  label: string;
  parameter: string;
  recommended: string;
  defaultVal: string;
  impact: string;
  color: string;
}

const TUNING_STEPS: TuningStep[] = [
  {
    id: 'somaxconn',
    label: '1. Socket Listen Backlog (`somaxconn`)',
    parameter: 'net.core.somaxconn',
    defaultVal: '4096 (or 128 on older kernels)',
    recommended: '65535',
    impact: 'Prevents connection drops during burst traffic by increasing maximum pending TCP connection queue size.',
    color: '#3b82f6',
  },
  {
    id: 'syn-backlog',
    label: '2. Half-Open SYN Queue (`tcp_max_syn_backlog`)',
    parameter: 'net.ipv4.tcp_max_syn_backlog',
    defaultVal: '2048',
    recommended: '65535',
    impact: 'Protects servers against SYN floods and handles thousands of simultaneous incoming handshakes.',
    color: '#8b5cf6',
  },
  {
    id: 'tw-reuse',
    label: '3. TIME_WAIT Socket Reuse (`tcp_tw_reuse`)',
    parameter: 'net.ipv4.tcp_tw_reuse',
    defaultVal: '0 (disabled)',
    recommended: '1 (enabled)',
    impact: 'Allows safe recycling of TIME_WAIT sockets for outgoing connections (critical for reverse proxies like NGINX).',
    color: '#10b981',
  },
  {
    id: 'conntrack',
    label: '4. Connection Tracking Limit (`nf_conntrack_max`)',
    parameter: 'net.netfilter.nf_conntrack_max',
    defaultVal: '262144',
    recommended: '1048576',
    impact: 'Prevents `nf_conntrack: table full, dropping packet` kernel panics under high NAT/firewall load.',
    color: '#f59e0b',
  },
];

export default function KernelTuningPage() {
  const [activeTab, setActiveTab] = useState<'params' | 'simulation' | 'conntrack' | 'quiz'>('params');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('kernel-tuning'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep((s) => {
          if (s >= TUNING_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('kernel-tuning'); return s; }
          return s + 1;
        });
      }, Math.round(1500 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const currentStep = TUNING_STEPS[animStep];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sliders size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Linux Kernel TCP Tuning</h1>
            <p className="text-sm text-slate-500 mt-0.5">sysctl · Socket Buffers · conntrack · High-Load SRE</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-emerald">Advanced SRE</span>
            <span className="badge-blue">Performance</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-white font-medium">Simple explanation: </span>
            Out of the box, Linux kernel network settings are tuned for general-purpose desktop/laptop use. 
            For production web servers handling 100,000+ requests per second, SREs must tune kernel parameters (`sysctl`) to prevent connection drops, memory exhaustion, and socket exhaustion.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-white font-medium">Technical explanation: </span>
            Kernel tuning optimizes TCP buffer allocations (`rmem_max`, `wmem_max`), socket queue depth (`somaxconn`), SYN flood protections (`tcp_syncookies`), connection tracking (`nf_conntrack`), and TCP congestion control algorithms (e.g. Google BBR vs CUBIC).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        {(['params', 'simulation', 'conntrack', 'quiz'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'params' ? '⚙️ Core Parameters' : tab === 'simulation' ? '📈 Bottleneck Simulator' : tab === 'conntrack' ? '🔥 Conntrack' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {/* ── Parameters Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'params' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TUNING_STEPS.map((step) => (
              <div key={step.id} className="glass rounded-xl p-5 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{step.label}</h3>
                </div>
                <code className="text-xs text-cyan-300 font-mono block">{step.parameter} = {step.recommended}</code>
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Default: <span className="text-slate-500 font-mono">{step.defaultVal}</span></span>
                  <span className="text-emerald-400 font-semibold">SRE Recommended</span>
                </div>
                <p className="text-xs text-slate-300 pt-1 leading-relaxed">{step.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Simulation Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'simulation' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying}
            currentStep={animStep}
            totalSteps={TUNING_STEPS.length}
            speed={speed}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep((s) => Math.min(s + 1, TUNING_STEPS.length - 1))}
            onStepBack={() => setAnimStep((s) => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed}
            stepLabel={currentStep.label}
          />

          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6 space-y-3">
            {TUNING_STEPS.map((step, idx) => {
              const isCurrent = idx === animStep;
              const isPast = idx < animStep;
              return (
                <motion.div
                  key={step.id}
                  animate={{ opacity: idx > animStep ? 0.3 : 1 }}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: isCurrent ? step.color : isPast ? `${step.color}30` : 'rgba(255,255,255,0.04)',
                    backgroundColor: isCurrent ? `${step.color}12` : 'transparent',
                  }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0" style={{ backgroundColor: `${step.color}20`, color: step.color }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{step.label}</div>
                    <div className="text-xs font-mono text-cyan-400">{step.parameter}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={animStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-strong rounded-xl p-5 border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white mb-1" style={{ color: currentStep.color }}>{currentStep.label}</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">{currentStep.impact}</p>
              <div className="border-t border-white/[0.06] pt-3 flex justify-between text-xs">
                <span className="text-slate-500 font-mono">Default: {currentStep.defaultVal}</span>
                <span className="text-cyan-300 font-mono font-bold">Optimized: {currentStep.recommended}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Conntrack Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'conntrack' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Linux Netfilter Conntrack Table Exhaustion</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When Linux firewalls (`iptables` / NAT) track active TCP/UDP connections, entries are stored in a fixed-size kernel table. 
              If `nf_conntrack_count` reaches `nf_conntrack_max`, kernel immediately drops incoming packets.
            </p>
            <CodeBlock
              language="bash"
              filename="sysctl-production-config.conf"
              code={`# /etc/sysctl.d/99-sre-performance.conf
# Maximize socket listen backlog
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# Enable BBR Congestion Control (Google BBR)
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# Enable TIME_WAIT reuse
net.ipv4.tcp_tw_reuse = 1

# Increase max connection tracking limit
net.netfilter.nf_conntrack_max = 1048576

# Increase socket memory buffers (max 16MB)
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216`}
            />
          </div>
        </div>
      )}

      {/* ── Quiz Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'quiz' && <Quiz topicId="kernel-tuning" />}

      {/* Commands */}
      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Sysctl CLI Commands</span></div>
      <CodeBlock
        language="bash"
        filename="kernel-tuning-debug.sh"
        code={`# Apply sysctl settings without rebooting
sudo sysctl -p /etc/sysctl.d/99-sre-performance.conf

# Check current active TCP congestion algorithm (e.g. cubic vs bbr)
sysctl net.ipv4.tcp_congestion_control

# View current connection tracking table usage
sysctl net.netfilter.nf_conntrack_count net.netfilter.nf_conntrack_max

# Check for dropped connections due to listen queue overflow
netstat -s | grep -i "listen overflows"`}
      />

      <div className="mt-8">
        <ReferencePanel references={REFERENCES} />
      </div>

      <TopicFooterNav currentTopicId="kernel-tuning" />
    </div>
  );
}
