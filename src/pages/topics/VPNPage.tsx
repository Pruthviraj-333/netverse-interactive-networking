import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Globe, Server, Info, Key, ArrowRight } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import TopicFooterNav from '../../components/common/TopicFooterNav';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'WireGuard Protocol Paper', url: 'https://www.wireguard.com/papers/wireguard.pdf', type: 'official', description: 'Next-gen kernel VPN using Noise protocol framework' },
  { title: 'RFC 4301 – IPsec Security Architecture', url: 'https://www.rfc-editor.org/rfc/rfc4301', type: 'rfc', rfcNumber: 4301 },
  { title: 'RFC 7348 – Virtual eXtensible Local Area Network (VXLAN)', url: 'https://www.rfc-editor.org/rfc/rfc7348', type: 'rfc', rfcNumber: 7348 },
  { title: 'RFC 7296 – Internet Key Exchange Protocol (IKEv2)', url: 'https://www.rfc-editor.org/rfc/rfc7296', type: 'rfc', rfcNumber: 7296 },
];

interface VPNStep {
  id: string;
  label: string;
  description: string;
  technicalDetail: string;
  outerHeader: string;
  innerHeader: string;
  encrypted: boolean;
  color: string;
}

const VPN_STEPS: VPNStep[] = [
  {
    id: 'original',
    label: '1. Original Inner IP Packet (Payload)',
    description: 'Application creates an IP packet intended for a private remote host (e.g. `10.244.1.5` to `10.244.2.8`).',
    technicalDetail: 'Inner IP Header: Src=10.244.1.5, Dst=10.244.2.8. Payload = TCP/UDP data.',
    outerHeader: 'None (Raw Inner Packet)', innerHeader: 'Inner IP (10.244.x.x)', encrypted: false, color: '#3b82f6',
  },
  {
    id: 'encrypt',
    label: '2. Encryption / Encapsulation (ESP / WireGuard)',
    description: 'VPN interface encrypts the inner packet using ChaCha20-Poly1305 (WireGuard) or AES-256-GCM (IPsec ESP).',
    technicalDetail: 'Authenticated Encryption with Associated Data (AEAD) ensures both confidentiality and tamper protection.',
    outerHeader: 'Cryptographic Tag Added', innerHeader: 'Encrypted Payload', encrypted: true, color: '#8b5cf6',
  },
  {
    id: 'outer-header',
    label: '3. Outer IP & UDP Header Addition (Tunneling)',
    description: 'VPN appends an Outer IP header with public IP addresses (e.g. `203.0.113.1` → `198.51.100.5`) so the packet can cross the public internet.',
    technicalDetail: 'Outer IP Header: Src=203.0.113.1, Dst=198.51.100.5. WireGuard uses UDP port 51820. VXLAN uses UDP port 4789.',
    outerHeader: 'Outer IP (203.0.113.1 → 198.51.100.5)', innerHeader: 'Encrypted Inner Packet', encrypted: true, color: '#10b981',
  },
  {
    id: 'decap',
    label: '4. Remote Gateway Decapsulation',
    description: 'Remote VPN gateway verifies the cryptographic MAC tag, decrypts the inner packet, strips the outer IP header, and routes it to the target private subnet.',
    technicalDetail: 'WireGuard uses Cryptokey Routing: internal IP addresses are bound directly to peer public keys.',
    outerHeader: 'Outer Header Stripped', innerHeader: 'Decrypted Inner Packet Delivery', encrypted: false, color: '#f59e0b',
  },
];

export default function VPNPage() {
  const [activeTab, setActiveTab] = useState<'wireguard' | 'ipsec' | 'vxlan' | 'quiz'>('wireguard');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('vpn-tunnels'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep((s) => {
          if (s >= VPN_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('vpn-tunnels'); return s; }
          return s + 1;
        });
      }, Math.round(1500 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const currentStep = VPN_STEPS[animStep];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Lock size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">VPNs & Overlay Tunnels</h1>
            <p className="text-sm text-slate-500 mt-0.5">WireGuard · IPsec · VXLAN · Encapsulation</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-purple">Advanced SRE</span>
            <span className="badge-blue">Security</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-white font-medium">Simple explanation: </span>
            A Virtual Private Network (VPN) creates a secure "private tunnel" through the public internet. 
            Overlay networks (like VXLAN) allow container pods to talk to each other across different cloud virtual machines as if they were plugged into the same local physical switch.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-white font-medium">Technical explanation: </span>
            Tunneling works by <strong>Packet Encapsulation</strong>: an inner packet (Layer 2 frame or Layer 3 packet) is encrypted and wrapped inside an outer IP/UDP transport header. 
            Modern Linux kernel networking relies on <strong>WireGuard</strong> (Noise protocol framework) for fast VPNs and <strong>VXLAN</strong> (RFC 7348, 24-bit VNI) for Kubernetes Overlay CNIs (Flannel/Calico).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        {(['wireguard', 'ipsec', 'vxlan', 'quiz'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'wireguard' ? '🔒 WireGuard Flow' : tab === 'ipsec' ? '🛡️ IPsec Modes' : tab === 'vxlan' ? '🌐 VXLAN Overlay' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {/* ── WireGuard Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'wireguard' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying}
            currentStep={animStep}
            totalSteps={VPN_STEPS.length}
            speed={speed}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep((s) => Math.min(s + 1, VPN_STEPS.length - 1))}
            onStepBack={() => setAnimStep((s) => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed}
            stepLabel={currentStep.label}
          />

          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6 space-y-3">
            {VPN_STEPS.map((step, idx) => {
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
                    <div className="text-xs text-slate-400 mt-0.5">Outer: {step.outerHeader}</div>
                  </div>
                  {step.encrypted && (
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                      ChaCha20-Poly1305 🔒
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={animStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-strong rounded-xl p-5 border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white mb-1" style={{ color: currentStep.color }}>{currentStep.label}</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">{currentStep.description}</p>
              <div className="border-t border-white/[0.06] pt-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Info size={11} /> Technical Encapsulation Detail</p>
                <p className="text-xs text-slate-400 font-mono">{currentStep.technicalDetail}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── IPsec Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'ipsec' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5 border border-blue-500/20 space-y-2">
              <h3 className="text-sm font-bold text-blue-400">Transport Mode</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Only the IP payload (TCP/UDP data) is encrypted. The original IP header remains unencrypted. 
                Used for host-to-host direct communications.
              </p>
            </div>

            <div className="glass rounded-xl p-5 border border-purple-500/20 space-y-2">
              <h3 className="text-sm font-bold text-purple-400">Tunnel Mode (Site-to-Site VPN)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The ENTIRE original IP packet (header + payload) is encrypted and encapsulated inside a NEW outer IP header. 
                Used for connecting remote corporate branch offices or AWS Transit Gateway tunnels.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── VXLAN Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'vxlan' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">VXLAN Overlay Networks (RFC 7348)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              VXLAN encapsulates Layer 2 Ethernet frames inside UDP packets (destination port 4789). It uses a 24-bit Virtual Network Identifier (VNI), supporting up to 16.7 million virtual networks (compared to 4,096 VLAN IDs).
            </p>
            <CodeBlock
              language="bash"
              filename="vxlan-header-structure.txt"
              code={`+-----------------------+-----------------------+-----------------------+
| Outer Ethernet Header | Outer IP (Host A -> B)| Outer UDP (Port 4789) |
+-----------------------+-----------------------+-----------------------+
| VXLAN Header (24-bit VNI)| Inner Ethernet Header| Inner IP Payload (Pod)|
+-----------------------+-----------------------+-----------------------+`}
            />
          </div>
        </div>
      )}

      {/* ── Quiz Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'quiz' && <Quiz topicId="vpn-tunnels" />}

      {/* Commands */}
      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">VPN & Tunnel CLI Commands</span></div>
      <CodeBlock
        language="bash"
        filename="vpn-commands.sh"
        code={`# WireGuard status check
sudo wg show

# Generate WireGuard key pair
wg genkey | tee privatekey | wg pubkey > publickey

# Create a Linux VXLAN interface (VNI 100 on UDP 4789)
sudo ip link add dev vxlan100 type vxlan id 100 dstport 4789 local 192.168.1.10 remote 192.168.1.20 dev eth0
sudo ip link set dev vxlan100 up

# Inspect strongSwan / IPsec tunnels
sudo ipsec statusall
sudo ip xfrm state list    # Inspect Linux kernel IPsec SA state`}
      />

      <div className="mt-8">
        <ReferencePanel references={REFERENCES} />
      </div>

      <TopicFooterNav currentTopicId="vpn-tunnels" />
    </div>
  );
}
