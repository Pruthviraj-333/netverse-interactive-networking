import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'IEEE 802.3 Ethernet Standard', url: 'https://standards.ieee.org/ieee/802.3/7071/', type: 'official' },
  { title: 'IEEE 802.1Q VLAN Tagging', url: 'https://standards.ieee.org/ieee/802.1Q/6844/', type: 'official' },
  { title: 'RFC 894 — IP over Ethernet', url: 'https://www.rfc-editor.org/rfc/rfc894', type: 'rfc', rfcNumber: 894 },
];

const FRAME_FIELDS = [
  { name: 'Preamble', bytes: '7 B', hex: '0xAA×7', color: '#64748b', desc: '7 bytes of alternating 1/0 bits (0xAA). Allows receiving PHY hardware to synchronize its clock before data arrives.' },
  { name: 'SFD', bytes: '1 B', hex: '0xAB', color: '#475569', desc: 'Start Frame Delimiter — 1 byte (0xAB). The trailing 11 bit-pattern signals end of preamble and start of frame.' },
  { name: 'Dst MAC', bytes: '6 B', hex: 'FF:FF:FF:FF:FF:FF', color: '#3b82f6', desc: '48-bit destination MAC. Broadcast (FF:FF:FF:FF:FF:FF), multicast (bit 0 of first byte = 1), or unicast.' },
  { name: 'Src MAC', bytes: '6 B', hex: '52:54:00:12:34:56', color: '#10b981', desc: '48-bit sender MAC. Switches learn this to populate the CAM (Content Addressable Memory) forwarding table.' },
  { name: 'EtherType', bytes: '2 B', hex: '0x0800', color: '#8b5cf6', desc: 'Identifies upper-layer protocol: 0x0800 = IPv4, 0x86DD = IPv6, 0x0806 = ARP, 0x8100 = 802.1Q VLAN tag.' },
  { name: 'Payload', bytes: '46–1500 B', hex: 'IP Packet', color: '#f59e0b', desc: 'Encapsulated L3 PDU. Minimum 46 bytes (padded). Maximum 1500 bytes (standard MTU) / 9000 (Jumbo frames).' },
  { name: 'FCS', bytes: '4 B', hex: 'CRC-32', color: '#ef4444', desc: 'Frame Check Sequence — CRC-32 over full frame. Receiver recalculates; frame dropped if mismatch (bit error).' },
];

const VLAN_STEPS = [
  { id: 'recv', label: '1. Untagged Frame Arrives at Access Port', desc: 'Host sends standard Ethernet frame (no VLAN tag). Switch receives it on an access port configured for VLAN 10.', color: '#3b82f6' },
  { id: 'tag', label: '2. Switch Inserts 802.1Q Tag', desc: 'Switch inserts 4-byte 802.1Q tag after Source MAC: TPID (0x8100) + 3-bit PCP + 1-bit DEI + 12-bit VLAN ID (10).', color: '#8b5cf6' },
  { id: 'trunk', label: '3. Tagged Frame Traverses Trunk Link', desc: 'Tagged frame crosses trunk link between switches, preserving VLAN ID. Multiple VLANs share one physical link.', color: '#10b981' },
  { id: 'strip', label: '4. Egress Access Port Strips Tag', desc: 'Destination switch strips 802.1Q tag before delivering to host. Host receives standard untagged Ethernet frame.', color: '#f59e0b' },
];

export default function EthernetPage() {
  const [activeTab, setActiveTab] = useState<'anatomy' | 'vlan' | 'mtu' | 'quiz'>('anatomy');
  const [selectedField, setSelectedField] = useState(0);
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('ethernet'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep(s => {
          if (s >= VLAN_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('ethernet'); return s; }
          return s + 1;
        });
      }, Math.round(1400 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const currentField = FRAME_FIELDS[selectedField];
  const currentStep = VLAN_STEPS[animStep];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Zap size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Ethernet & Frames</h1>
            <p className="text-sm text-slate-500 mt-0.5">Data Link Layer · IEEE 802.3 · RFC 894</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={2} size="sm" />
            <span className="badge-green">Beginner</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            Ethernet frames are the "envelopes" that carry data on local networks. Every packet is wrapped in a frame with MAC addresses before travelling across physical cables or Wi-Fi.
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (IEEE 802.3): </span>
            An Ethernet II frame consists of a 7-byte Preamble, 1-byte SFD, 6-byte Destination MAC, 6-byte Source MAC, 2-byte EtherType, 46–1500 byte payload, and 4-byte FCS (CRC-32). Minimum frame size is 64 bytes; maximum is 1518 bytes (standard) or 9022 bytes (Jumbo Frames).
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['anatomy', 'vlan', 'mtu', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'anatomy' ? '🔬 Frame Anatomy' : tab === 'vlan' ? '🏷️ VLAN 802.1Q' : tab === 'mtu' ? '📏 MTU' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'anatomy' && (
        <div className="space-y-5">
          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6 space-y-4">
            <p className="text-xs font-mono text-slate-500">Click any field to inspect (not to scale)</p>
            <div className="flex rounded-xl overflow-hidden h-14 border border-white/[0.08]">
              {FRAME_FIELDS.map((f, i) => {
                const isPayload = f.bytes.includes('–');
                const flex = isPayload ? 7 : 1;
                return (
                  <button key={f.name} onClick={() => setSelectedField(i)}
                    style={{
                      flex,
                      backgroundColor: `${f.color}${selectedField === i ? '40' : '18'}`,
                      borderRight: i < FRAME_FIELDS.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      borderBottom: selectedField === i ? `3px solid ${f.color}` : '3px solid transparent',
                    }}
                    className="flex flex-col items-center justify-center transition-all hover:brightness-125 gap-0.5">
                    <span className="text-[10px] font-bold text-white truncate px-1">{f.name}</span>
                    <span className="text-[9px] font-mono text-slate-400">{f.bytes}</span>
                  </button>
                );
              })}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={selectedField} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass-strong rounded-xl p-5 space-y-2 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: currentField.color }} />
                    <h3 className="text-sm font-bold text-white">{currentField.name}</h3>
                  </div>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">{currentField.bytes}</span>
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">{currentField.hex}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{currentField.desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {activeTab === 'vlan' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying} currentStep={animStep} totalSteps={VLAN_STEPS.length} speed={speed}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep(s => Math.min(s + 1, VLAN_STEPS.length - 1))}
            onStepBack={() => setAnimStep(s => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed} stepLabel={currentStep.label}
          />
          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6 space-y-3">
            {VLAN_STEPS.map((step, idx) => {
              const isCurrent = idx === animStep;
              const isPast = idx < animStep;
              return (
                <motion.div key={step.id} animate={{ opacity: idx > animStep ? 0.25 : 1 }}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3"
                  style={{ borderColor: isCurrent ? step.color : isPast ? `${step.color}30` : 'rgba(255,255,255,0.04)', backgroundColor: isCurrent ? `${step.color}12` : 'transparent', boxShadow: isCurrent ? `0 0 16px ${step.color}20` : 'none' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: `${step.color}20`, color: step.color }}>{idx + 1}</div>
                  <span className="text-sm font-medium text-slate-200">{step.label}</span>
                </motion.div>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={animStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-xl p-5 border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white mb-2" style={{ color: currentStep.color }}>{currentStep.label}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{currentStep.desc}</p>
            </motion.div>
          </AnimatePresence>
          <div className="glass rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">802.1Q Tag (4 bytes inserted after Src MAC)</h4>
            <div className="grid grid-cols-4 gap-2">
              {[{ f: 'TPID', b: '16-bit', v: '0x8100', c: '#8b5cf6' }, { f: 'PCP', b: '3-bit', v: 'Priority 0-7', c: '#3b82f6' }, { f: 'DEI', b: '1-bit', v: 'Drop Eligible', c: '#10b981' }, { f: 'VLAN ID', b: '12-bit', v: 'VLAN 1-4094', c: '#f59e0b' }].map(x => (
                <div key={x.f} className="glass rounded-lg p-2.5 text-center space-y-0.5">
                  <div className="text-xs font-bold" style={{ color: x.c }}>{x.f}</div>
                  <div className="text-[10px] font-mono text-slate-400">{x.b}</div>
                  <div className="text-[10px] text-slate-500">{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mtu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Standard MTU', size: '1500 bytes', detail: 'IEEE 802.3 default payload limit. Excludes the 14-byte Ethernet header and 4-byte FCS.', color: '#3b82f6' },
              { title: 'Jumbo Frames', size: '9000 bytes', detail: 'Non-standard extension supported by most modern NICs and managed switches. Reduces CPU overhead in storage and data center workloads.', color: '#10b981' },
              { title: 'Minimum Frame', size: '64 bytes', detail: 'Minimum for CSMA/CD collision detection. Frames shorter than 64 bytes (payload < 46 bytes) are padded. "Runts" below 64 bytes are dropped.', color: '#f59e0b' },
            ].map(m => (
              <div key={m.title} className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
                <h3 className="text-sm font-bold text-white">{m.title}</h3>
                <div className="text-2xl font-mono font-bold" style={{ color: m.color }}>{m.size}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{m.detail}</p>
              </div>
            ))}
          </div>
          <div className="glass rounded-xl p-5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Path MTU Discovery (RFC 1191)</h4>
            <p className="text-xs text-slate-300 leading-relaxed">When a host sends packets with DF=1 (Don't Fragment) and a router on the path has a smaller MTU, the router drops the packet and returns ICMP Type 3 Code 4 (Fragmentation Needed). The sender reduces its packet size. Blocking ICMP breaks PMTUD, silently stalling large data transfers.</p>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="ethernet" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock language="bash" filename="ethernet.sh" code={`# View interface link details (speed, duplex, MTU)
ip link show eth0
ethtool eth0

# Enable jumbo frames (MTU 9000)
sudo ip link set eth0 mtu 9000

# Capture Ethernet frames with tcpdump
sudo tcpdump -i eth0 -e -n 'ether proto 0x0800'

# Add a VLAN sub-interface (VLAN ID 100)
sudo ip link add link eth0 name eth0.100 type vlan id 100
sudo ip link set eth0.100 up
ip -d link show eth0.100`} />
      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
