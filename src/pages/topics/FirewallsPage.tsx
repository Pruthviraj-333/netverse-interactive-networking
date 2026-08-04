import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Cpu, Layers } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'Linux Netfilter Framework', url: 'https://www.netfilter.org/', type: 'official' },
  { title: 'nftables wiki', url: 'https://wiki.nftables.org/', type: 'official' },
  { title: 'RFC 2979 – Behavior of Packet Filters', url: 'https://www.rfc-editor.org/rfc/rfc2979', type: 'rfc', rfcNumber: 2979 },
];

const NETFILTER_CHAINS = [
  { chain: 'PREROUTING', table: 'nat / mangle / raw', desc: 'Packets entering the NIC before any routing decision is made. Used for DNAT.' },
  { chain: 'INPUT', table: 'filter / mangle', desc: 'Packets destined for local processes running on this host.' },
  { chain: 'FORWARD', table: 'filter / mangle', desc: 'Packets routed through this host to another destination (router mode).' },
  { chain: 'OUTPUT', table: 'filter / nat / mangle', desc: 'Packets generated locally by applications on this host heading out.' },
  { chain: 'POSTROUTING', table: 'nat / mangle', desc: 'Packets leaving the NIC after routing decisions. Used for SNAT / Masquerade.' },
];

export default function FirewallsPage() {
  const [activeTab, setActiveTab] = useState<'netfilter' | 'stateful' | 'quiz'>('netfilter');
  const [selectedChain, setSelectedChain] = useState<number>(0);
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('firewalls'); }, [markTopicViewed]);

  const currentChain = NETFILTER_CHAINS[selectedChain];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">Firewalls & Linux Netfilter / iptables</h1>
            <p className="text-sm text-slate-500 mt-0.5">Network Security · L3/L4/L7 Packet Filtering</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={3} size="sm" />
            <OSILayerBadge layer={4} size="sm" />
            <span className="badge-amber">Intermediate</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            A Firewall is a security guard at a building entrance. It inspects incoming and outgoing network traffic based on security rules to allow or block packets.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical: </span>
            Linux implements packet filtering via the **Netfilter** kernel architecture. `iptables` and `nftables` are userspace utilities that configure Netfilter hooks. Netfilter inspects packets across 5 core chains (`PREROUTING`, `INPUT`, `FORWARD`, `OUTPUT`, `POSTROUTING`) using stateful connection tracking (`conntrack`).
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['netfilter', 'stateful', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'netfilter' ? '⚙️ Netfilter Chains' : tab === 'stateful' ? '🛡️ Stateful vs Stateless' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'netfilter' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {NETFILTER_CHAINS.map((c, i) => (
              <button key={c.chain} onClick={() => setSelectedChain(i)}
                className={`text-center p-3 rounded-xl border transition-all ${selectedChain === i ? 'glass-strong border-red-500/50 shadow-lg' : 'glass opacity-70 hover:opacity-100'}`}>
                <div className="text-xs font-mono font-bold text-red-400">{c.chain}</div>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={selectedChain} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-2xl p-6 space-y-4 border border-white/[0.06]">
              <h3 className="text-base font-bold text-white">{currentChain.chain} Chain</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{currentChain.desc}</p>
              <div className="text-xs font-mono text-slate-400 glass p-3 rounded-lg">
                Tables operating in this chain: <span className="text-amber-300">{currentChain.table}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'stateful' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
              <h3 className="text-sm font-bold text-white">Stateless Packet Filtering</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Inspects each packet in isolation based strictly on static fields (src/dst IP, port, protocol).</p>
              <ul className="text-xs text-slate-400 space-y-1 font-mono pt-2">
                <li>• Example: AWS Network ACLs (NACLs).</li>
                <li>• Requires explicit rules for BOTH outbound and return inbound traffic.</li>
              </ul>
            </div>

            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
              <h3 className="text-sm font-bold text-white">Stateful Packet Filtering</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Tracks active connection state using `conntrack` (NEW, ESTABLISHED, RELATED, INVALID).</p>
              <ul className="text-xs text-slate-400 space-y-1 font-mono pt-2">
                <li>• Example: AWS Security Groups, iptables stateful rules.</li>
                <li>• Return traffic for established connections is automatically allowed!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="firewalls" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Firewall Commands</span></div>
      <CodeBlock language="bash" filename="firewall-commands.sh" code={`# View current iptables rules with packet counters
sudo iptables -L -v -n --line-numbers

# Stateful Rule: Allow existing established & related connections
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow inbound SSH (22) and HTTPS (443)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Set Default Policy to DROP all unmatched incoming traffic
sudo iptables -P INPUT DROP

# Modern nftables status
sudo nft list ruleset`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
