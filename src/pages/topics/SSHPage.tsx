import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Key, ShieldCheck, ArrowRight, Server, Cpu, Lock } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 4251 – SSH Protocol Architecture', url: 'https://www.rfc-editor.org/rfc/rfc4251', type: 'rfc', rfcNumber: 4251 },
  { title: 'RFC 4252 – SSH Authentication Protocol', url: 'https://www.rfc-editor.org/rfc/rfc4252', type: 'rfc', rfcNumber: 4252 },
  { title: 'RFC 4253 – SSH Transport Layer Protocol', url: 'https://www.rfc-editor.org/rfc/rfc4253', type: 'rfc', rfcNumber: 4253 },
  { title: 'RFC 4254 – SSH Connection Protocol', url: 'https://www.rfc-editor.org/rfc/rfc4254', type: 'rfc', rfcNumber: 4254 },
];

const SSH_STEPS = [
  { id: 'tcp', label: '1. TCP Connection', detail: 'SYN → SYN-ACK → ACK to port 22', desc: 'Standard TCP 3-way handshake to destination port 22.', color: '#3b82f6' },
  { id: 'banner', label: '2. Banner & Version Exchange', detail: 'SSH-2.0-OpenSSH_9.x', desc: 'Both sides exchange software version strings to agree on SSH-2.0 protocol.', color: '#8b5cf6' },
  { id: 'kex', label: '3. Key Exchange (ECDH)', detail: 'Diffie-Hellman / Curve25519', desc: 'Client and server compute a shared secret over an insecure channel without transmitting the secret itself.', color: '#ec4899' },
  { id: 'hostkey', label: '4. Host Key Verification', detail: 'TOFU (~/.ssh/known_hosts)', desc: 'Client verifies server identity using server host public key (prevents MITM attacks).', color: '#f59e0b' },
  { id: 'auth', label: '5. User Authentication', detail: 'ED25519 / RSA Public Key', desc: 'Client proves user identity via signed challenge using user private key or password.', color: '#10b981' },
  { id: 'channel', label: '6. Encrypted Channel Open', detail: 'Interactive Shell / SFTP', desc: 'Encrypted tunnel is ready. Interactive PTY session or port forwarding channel established.', color: '#06b6d4' },
];

const TUNNEL_TYPES = [
  {
    type: 'Local Port Forwarding (-L)',
    cmd: 'ssh -L 8080:localhost:80 user@remote-server',
    desc: 'Binds a local port (8080) on your client machine and tunnels traffic through the SSH connection to a remote destination (remote-server:80).',
    diagram: 'Client (localhost:8080) → [SSH Tunnel] → Remote Server → Internal Target:80',
    color: '#3b82f6',
  },
  {
    type: 'Remote Port Forwarding (-R)',
    cmd: 'ssh -R 9000:localhost:3000 user@public-server',
    desc: 'Exposes a port on the remote server (9000) that tunnels traffic back to a port on your local machine (localhost:3000). Useful for demoing local web apps.',
    diagram: 'Public Internet → Remote Server:9000 → [SSH Tunnel] → Client (localhost:3000)',
    color: '#10b981',
  },
  {
    type: 'Dynamic Port Forwarding (-D)',
    cmd: 'ssh -D 1080 user@jump-host',
    desc: 'Creates a local SOCKS5 proxy server at localhost:1080. Any app (browser/curl) using this proxy routes all its traffic through the SSH tunnel.',
    diagram: 'Browser (SOCKS5 Proxy 1080) → [SSH Tunnel] → Jump Host → Any Destination',
    color: '#8b5cf6',
  },
];

export default function SSHPage() {
  const [activeTab, setActiveTab] = useState<'handshake' | 'tunnels' | 'keys' | 'quiz'>('handshake');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('ssh'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep(s => {
          if (s >= SSH_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('ssh'); return s; }
          return s + 1;
        });
      }, Math.round(1400 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const currentStep = SSH_STEPS[animStep];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Terminal size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">SSH — Secure Shell Protocol</h1>
            <p className="text-sm text-slate-500 mt-0.5">Application Layer · RFC 4251-4254</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={7} size="sm" />
            <span className="badge-amber">Intermediate</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-semibold">Simple explanation: </span>
            SSH is a secure CLI telephone call to a remote computer. It lets Linux sysadmins and cloud engineers log into servers over untrusted networks like the Internet safely.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-semibold">Technical explanation (RFC 4251): </span>
            SSH runs over TCP port 22 and consists of three sub-protocols: <strong className="text-white font-semibold">Transport Layer Protocol</strong> (server authentication, confidentiality, integrity via ECDH/AES-GCM), <strong className="text-white font-semibold">User Authentication Protocol</strong> (publickey/password), and <strong className="text-white font-semibold">Connection Protocol</strong> (multiplexes channels for interactive shell, SFTP, and TCP port forwarding).
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['handshake', 'tunnels', 'keys', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'handshake' ? '🤝 Handshake' : tab === 'tunnels' ? '🔀 SSH Tunnels' : tab === 'keys' ? '🔑 Keys & Config' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'handshake' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying} currentStep={animStep} totalSteps={SSH_STEPS.length} speed={speed}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep(s => Math.min(s + 1, SSH_STEPS.length - 1))}
            onStepBack={() => setAnimStep(s => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed} stepLabel={currentStep.label}
          />

          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6 space-y-3">
            {SSH_STEPS.map((step, idx) => {
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
                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold" style={{ backgroundColor: `${step.color}20`, color: step.color }}>
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{step.label}</span>
                  <span className="text-xs font-mono text-slate-400 ml-auto">{step.detail}</span>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={animStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-xl p-5 space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: currentStep.color }} />
                {currentStep.label}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{currentStep.desc}</p>
              <div className="text-xs font-mono text-slate-400 pt-2 border-t border-white/[0.06]">
                Technical Detail: {currentStep.detail}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'tunnels' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">SSH can encapsulate arbitrary TCP traffic inside an encrypted SSH channel. This is known as SSH Port Forwarding or Tunneling.</p>
          <div className="space-y-4">
            {TUNNEL_TYPES.map(t => (
              <div key={t.type} className="glass rounded-xl p-5 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{t.type}</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{t.desc}</p>
                <div className="glass rounded-lg p-3 font-mono text-xs text-slate-400">
                  {t.diagram}
                </div>
                <code className="block text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                  {t.cmd}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key size={16} className="text-emerald-400" /> Key Pair Comparison: ED25519 vs RSA
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Always prefer <strong className="text-emerald-400 font-semibold">ED25519</strong> (<code className="font-mono text-emerald-400 text-[11px]">ssh-keygen -t ed25519</code>). It is faster, shorter (68 chars vs 700+ chars for RSA 4096), and offers superior security against side-channel attacks based on Edwards-curve Digital Signature Algorithm (EdDSA).
            </p>
          </div>

          <div className="glass rounded-xl p-5 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Client Configuration (~/.ssh/config)</h4>
            <CodeBlock language="text" filename="~/.ssh/config" code={`Host prod-cluster
  HostName 192.168.1.100
  User ubuntu
  IdentityFile ~/.ssh/id_ed25519
  Port 22
  ServerAliveInterval 60
  ForwardAgent no`} />
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="ssh" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock language="bash" filename="ssh-commands.sh" code={`# Generate modern ED25519 SSH keypair
ssh-keygen -t ed25519 -C "admin@netverse.io"

# Copy public key to remote server (authorized_keys)
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@remote-host

# Verbose connection debugging (shows handshake steps)
ssh -vvv user@remote-host

# Local Port Forwarding: access remote database locally
ssh -L 5432:localhost:5432 user@db-server

# Remote Port Forwarding: expose local dev server to remote host
ssh -R 8080:localhost:3000 user@public-server

# Dynamic SOCKS5 proxy
ssh -D 1080 user@jump-host`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
