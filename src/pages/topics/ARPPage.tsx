import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Radio, Info, AlertCircle } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

interface ARPStep {
  id: string;
  label: string;
  description: string;
  technicalDetail: string;
  message: string;
  type: 'broadcast' | 'unicast' | 'cache';
  from: string;
  to: string;
  fromIP: string;
  fromMAC: string;
  toIP?: string;
  toMAC?: string;
  color: string;
}

const ARP_STEPS: ARPStep[] = [
  {
    id: 'check-cache',
    label: 'Step 1: Check ARP Cache',
    description: 'Host A wants to send a packet to 192.168.1.20. Before sending anything, it checks its ARP cache for an existing IP→MAC mapping.',
    technicalDetail: 'ARP cache entries have a timeout (typically 60s on Linux, configurable via /proc/sys/net/ipv4/neigh/eth0/base_reachable_time_ms). Incomplete entries expire after 3s. ip neigh show displays the cache.',
    message: 'ARP Cache Lookup: 192.168.1.20?',
    type: 'cache',
    from: 'Host A',
    to: 'ARP Cache',
    fromIP: '192.168.1.10',
    fromMAC: 'AA:BB:CC:11:22:33',
    color: '#8b5cf6',
  },
  {
    id: 'arp-request',
    label: 'Step 2: ARP Request (Broadcast)',
    description: 'No cache entry found. Host A broadcasts an ARP Request to FF:FF:FF:FF:FF:FF asking "Who has 192.168.1.20? Tell 192.168.1.10". ALL hosts on the segment receive this frame.',
    technicalDetail: 'ARP Request (RFC 826): Ethernet dst=FF:FF:FF:FF:FF:FF (broadcast), EtherType=0x0806 (ARP). ARP payload: Hardware Type=1 (Ethernet), Protocol Type=0x0800 (IPv4), Opcode=1 (Request), Sender MAC=AA:BB:CC:11:22:33, Sender IP=192.168.1.10, Target MAC=00:00:00:00:00:00 (unknown), Target IP=192.168.1.20.',
    message: 'ARP Request: Who has 192.168.1.20? Tell 192.168.1.10 [FF:FF:FF:FF:FF:FF BROADCAST]',
    type: 'broadcast',
    from: 'Host A',
    to: 'ALL (Broadcast)',
    fromIP: '192.168.1.10',
    fromMAC: 'AA:BB:CC:11:22:33',
    toIP: '192.168.1.20',
    toMAC: 'FF:FF:FF:FF:FF:FF',
    color: '#f59e0b',
  },
  {
    id: 'arp-ignored',
    label: 'Step 3: Other Hosts Ignore',
    description: 'Hosts C, D, and others receive the broadcast. Each checks: is 192.168.1.20 my IP? No — so they silently discard the ARP Request.',
    technicalDetail: 'All hosts in the broadcast domain receive the frame. Only the target IP owner must respond. However, all hosts update their ARP cache with the sender mapping (192.168.1.10 → AA:BB:CC:11:22:33) as a side effect — optimisation per RFC 826.',
    message: 'Other hosts: "Not my IP" → discard',
    type: 'cache',
    from: 'Host C/D',
    to: '/dev/null',
    fromIP: '192.168.1.30',
    fromMAC: 'DD:EE:FF:00:11:22',
    color: '#475569',
  },
  {
    id: 'arp-reply',
    label: 'Step 4: ARP Reply (Unicast)',
    description: 'Host B (192.168.1.20) recognises its own IP. It sends a unicast ARP Reply directly to Host A\'s MAC address: "192.168.1.20 is at CC:DD:EE:44:55:66".',
    technicalDetail: 'ARP Reply (RFC 826): Ethernet dst=AA:BB:CC:11:22:33 (unicast, NOT broadcast), EtherType=0x0806. ARP payload: Opcode=2 (Reply), Sender MAC=CC:DD:EE:44:55:66, Sender IP=192.168.1.20, Target MAC=AA:BB:CC:11:22:33, Target IP=192.168.1.10. ARP Replies are unicast — only the requester needs the answer.',
    message: 'ARP Reply: 192.168.1.20 is at CC:DD:EE:44:55:66 [UNICAST to AA:BB:CC:11:22:33]',
    type: 'unicast',
    from: 'Host B',
    to: 'Host A',
    fromIP: '192.168.1.20',
    fromMAC: 'CC:DD:EE:44:55:66',
    toIP: '192.168.1.10',
    toMAC: 'AA:BB:CC:11:22:33',
    color: '#10b981',
  },
  {
    id: 'cache-update',
    label: 'Step 5: Update ARP Cache',
    description: 'Host A receives the reply and updates its ARP cache: 192.168.1.20 → CC:DD:EE:44:55:66. Now it can build an Ethernet frame directly to Host B.',
    technicalDetail: 'ARP cache entry is marked REACHABLE. base_reachable_time = 30–60s (kernel default). After expiry: entry goes STALE, then DELAY, then PROBE (sends unicast ARP to verify). Garbage collected after gc_stale_time. ip neigh add to add static entries.',
    message: 'Cache: 192.168.1.20 → CC:DD:EE:44:55:66 (REACHABLE, TTL ~60s)',
    type: 'cache',
    from: 'Host A',
    to: 'ARP Cache',
    fromIP: '192.168.1.10',
    fromMAC: 'AA:BB:CC:11:22:33',
    color: '#10b981',
  },
  {
    id: 'ip-packet',
    label: 'Step 6: IP Packet Delivered',
    description: 'Host A now builds an Ethernet frame: dst MAC = CC:DD:EE:44:55:66, src MAC = AA:BB:CC:11:22:33. The IP packet (dst 192.168.1.20) is encapsulated inside. The switch forwards it to Host B.',
    technicalDetail: 'The IP destination address does NOT change (still 192.168.1.20). Only the Ethernet frame\'s MAC addresses are used for local delivery. Cross-subnet: the dst MAC would be the default gateway\'s MAC, not the remote host\'s MAC — the gateway then repeats this ARP process on the other subnet.',
    message: 'Ethernet Frame → dst MAC: CC:DD:EE:44:55:66 → [IP pkt dst:192.168.1.20]',
    type: 'unicast',
    from: 'Host A',
    to: 'Host B',
    fromIP: '192.168.1.10',
    fromMAC: 'AA:BB:CC:11:22:33',
    toIP: '192.168.1.20',
    toMAC: 'CC:DD:EE:44:55:66',
    color: '#3b82f6',
  },
];

const REFERENCES: Reference[] = [
  { title: 'RFC 826 – An Ethernet Address Resolution Protocol', url: 'https://www.rfc-editor.org/rfc/rfc826', type: 'rfc', rfcNumber: 826, description: 'Original ARP specification (1982)' },
  { title: 'RFC 5227 – IPv4 Address Conflict Detection (Gratuitous ARP)', url: 'https://www.rfc-editor.org/rfc/rfc5227', type: 'rfc', rfcNumber: 5227 },
  { title: 'Linux Neighbor Discovery (ARP)', url: 'https://docs.kernel.org/networking/neighbour.html', type: 'linux', description: 'Linux kernel neighbour cache documentation' },
];

export default function ARPPage() {
  const [activeTab, setActiveTab] = useState<'animation' | 'gratuitous' | 'quiz'>('animation');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('arp'); }, [markTopicViewed]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep((s) => {
          if (s >= ARP_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('arp'); return s; }
          return s + 1;
        });
      }, Math.round(1400 / speed));
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, markAnimationCompleted]);

  const currentStep = ARP_STEPS[animStep];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Network size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">ARP — Address Resolution Protocol</h1>
            <p className="text-sm text-slate-500 mt-0.5">Data Link / Network Bridge · RFC 826</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-amber">Data Link L2</span>
            <span className="badge-green">Beginner</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            ARP is the shouting in a room. Your computer shouts "Who has 192.168.1.20?" to everyone on the local network.
            Only the computer with that IP quietly whispers back: "That's me — here's my MAC address."
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (RFC 826): </span>
            ARP resolves IPv4 addresses to Ethernet MAC addresses within a broadcast domain.
            Requests are sent as Ethernet broadcasts (dst FF:FF:FF:FF:FF:FF). Replies are unicast.
            Results are cached in the ARP table (Neighbour Cache in Linux) with a reachability timer.
            ARP only operates within a single broadcast domain — for cross-subnet communication,
            the host ARPs for the gateway, not the remote host.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['animation', 'gratuitous', 'quiz'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'animation' ? '🔍 ARP Flow' : tab === 'gratuitous' ? '📢 Gratuitous ARP' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'animation' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying} currentStep={animStep} totalSteps={ARP_STEPS.length} speed={speed}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep((s) => Math.min(s + 1, ARP_STEPS.length - 1))}
            onStepBack={() => setAnimStep((s) => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed} stepLabel={currentStep.label}
          />

          {/* Network diagram */}
          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Host A', ip: '192.168.1.10', mac: 'AA:BB:CC:11:22:33', icon: '💻', active: currentStep.from === 'Host A' },
                { label: 'Switch', ip: '', mac: '', icon: '🔀', active: false },
                { label: 'Host B', ip: '192.168.1.20', mac: 'CC:DD:EE:44:55:66', icon: '🖥️', active: currentStep.from === 'Host B' || currentStep.to === 'Host B' },
              ].map((host) => (
                <div key={host.label} className="text-center">
                  <motion.div
                    animate={host.active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="glass rounded-xl p-3 inline-block"
                    style={host.active ? { borderColor: currentStep.color, boxShadow: `0 0 16px ${currentStep.color}30` } : {}}
                  >
                    <div className="text-3xl mb-1">{host.icon}</div>
                    <div className="text-sm font-semibold text-white">{host.label}</div>
                    {host.ip && <div className="text-[11px] text-slate-400 font-mono">{host.ip}</div>}
                    {host.mac && <div className="text-[10px] text-slate-600 font-mono">{host.mac}</div>}
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Packet visualiser */}
            <AnimatePresence mode="wait">
              <motion.div
                key={animStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border px-4 py-3 font-mono text-xs text-slate-300 leading-relaxed"
                style={{ borderColor: `${currentStep.color}40`, backgroundColor: `${currentStep.color}08` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {currentStep.type === 'broadcast' && (
                    <span className="badge-amber"><Radio size={10} /> Broadcast</span>
                  )}
                  {currentStep.type === 'unicast' && (
                    <span className="badge-green">Unicast</span>
                  )}
                  {currentStep.type === 'cache' && (
                    <span className="badge-violet">Local</span>
                  )}
                  <span className="text-slate-400">{currentStep.from} → {currentStep.to}</span>
                </div>
                <div style={{ color: currentStep.color }}>{currentStep.message}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step detail */}
          <AnimatePresence mode="wait">
            <motion.div key={animStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-white flex-1">{currentStep.label}</h3>
                <OSILayerBadge layer={2} size="sm" active />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{currentStep.description}</p>
              <div className="border-t border-white/[0.06] pt-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Info size={10} /> RFC 826 Detail</p>
                <p className="text-xs text-slate-400 leading-relaxed">{currentStep.technicalDetail}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'gratuitous' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Radio size={16} className="text-amber-400" /> Gratuitous ARP (GARP)
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              A Gratuitous ARP is an ARP Request where the <strong className="text-white">sender IP = target IP</strong>.
              It is NOT asking for a MAC address — it is announcing the sender's own IP→MAC mapping to the network.
            </p>
            <div className="glass rounded-lg px-4 py-3 font-mono text-xs text-amber-300 mb-4">
              ARP Request: Who has 192.168.1.10? Tell 192.168.1.10<br />
              (sender IP = target IP = 192.168.1.10)
            </div>
            <div className="space-y-3">
              {[
                { title: '1. Duplicate IP Detection', desc: 'When a host joins the network, it sends GARP for its own IP. If anyone replies, there is an IP conflict (RFC 5227). Linux: arping -D checks this.' },
                { title: '2. MAC Address Change', desc: 'After a NIC is replaced (new MAC), GARP forces all hosts to update their ARP caches with the new mapping immediately.' },
                { title: '3. HA Cluster / VRRP Failover', desc: 'When a backup router takes over a virtual IP, it sends GARP so all hosts update their cache to the backup\'s MAC. Used in keepalived, VRRP, Kubernetes LoadBalancer.' },
                { title: '4. Initial Boot Announcement', desc: 'Some OS implementations send GARP on interface up to populate other hosts\' caches proactively, reducing ARP traffic on first communication.' },
              ].map((item) => (
                <div key={item.title} className="glass rounded-lg p-3">
                  <div className="text-sm font-medium text-amber-300 mb-1">{item.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-5 border border-rose-500/20">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-400" /> ARP Spoofing / Poisoning
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              ARP has no authentication — any host can send a GARP claiming to be any IP. An attacker can poison ARP caches
              to redirect traffic through their machine (Man-in-the-Middle attack). Defences:
              Dynamic ARP Inspection (DAI) on switches, static ARP entries, IPv6 Neighbour Discovery Protocol (NDP) with
              SEND (RFC 3971), and network monitoring.
            </p>
            <div className="mt-3 px-3 py-2 rounded-lg bg-rose-500/5 text-xs text-rose-300">
              ⚠️ ARP spoofing is the reason HTTPS is critical — even if traffic is redirected, TLS prevents decryption.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="arp" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock
        language="bash"
        filename="arp-commands.sh"
        code={`# View ARP/Neighbour cache
ip neigh show
ip neigh show dev eth0

# Add static ARP entry
sudo ip neigh add 192.168.1.20 lladdr CC:DD:EE:44:55:66 dev eth0

# Delete an ARP entry
sudo ip neigh del 192.168.1.20 dev eth0

# Flush entire ARP cache
sudo ip neigh flush dev eth0

# Legacy arp command (still available on many systems)
arp -n

# Send a Gratuitous ARP (useful for forcing cache update)
sudo arping -A -I eth0 192.168.1.10   # Announcement mode
sudo arping -U -I eth0 192.168.1.10   # Unsolicited ARP

# Check for duplicate IP (returns 1 if duplicate found)
sudo arping -D -I eth0 192.168.1.10

# Capture ARP traffic
sudo tcpdump -i eth0 -n arp

# ARP table on Windows
arp -a`}
      />

      <div className="mt-8">
        <ReferencePanel references={REFERENCES} />
      </div>
    </div>
  );
}
