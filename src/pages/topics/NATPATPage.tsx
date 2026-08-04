import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Shuffle, Info } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 3022 – Traditional NAT', url: 'https://www.rfc-editor.org/rfc/rfc3022', type: 'rfc', rfcNumber: 3022 },
  { title: 'RFC 4787 – NAT for UDP', url: 'https://www.rfc-editor.org/rfc/rfc4787', type: 'rfc', rfcNumber: 4787 },
  { title: 'RFC 5382 – NAT for TCP', url: 'https://www.rfc-editor.org/rfc/rfc5382', type: 'rfc', rfcNumber: 5382 },
  { title: 'AWS NAT Gateway', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html', type: 'aws' },
  { title: 'iptables NAT (Linux netfilter)', url: 'https://www.netfilter.org/documentation/', type: 'linux' },
];

interface NATEntry {
  srcPrivate: string; srcPort: number;
  publicIP: string; mappedPort: number;
  dstIP: string; dstPort: number;
  protocol: string; state: string;
}

const NAT_TABLE: NATEntry[] = [
  { srcPrivate: '10.0.0.10', srcPort: 54321, publicIP: '203.0.113.5', mappedPort: 10001, dstIP: '142.250.64.46', dstPort: 443, protocol: 'TCP', state: 'ESTABLISHED' },
  { srcPrivate: '10.0.0.11', srcPort: 51234, publicIP: '203.0.113.5', mappedPort: 10002, dstIP: '8.8.8.8', dstPort: 53, protocol: 'UDP', state: 'ESTABLISHED' },
  { srcPrivate: '10.0.0.12', srcPort: 33456, publicIP: '203.0.113.5', mappedPort: 10003, dstIP: '104.18.32.47', dstPort: 80, protocol: 'TCP', state: 'TIME_WAIT' },
];

const NAT_TYPES = [
  {
    title: 'SNAT (Source NAT)',
    badge: 'Outbound',
    color: '#3b82f6',
    desc: 'Replaces the private source IP with the router\'s public IP as packets leave the network. All internal hosts share one public IP.',
    example: '10.0.0.10:54321 → 203.0.113.5:10001 → google.com:443',
    iptables: 'iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE',
    rfcNote: 'RFC 3022 §4 — Traditional Outbound NAT',
    cloudNote: 'AWS: NAT Gateway for private subnets. GCP: Cloud NAT. Azure: NAT Gateway.',
  },
  {
    title: 'DNAT (Destination NAT)',
    badge: 'Inbound',
    color: '#10b981',
    desc: 'Replaces the public destination IP with a private IP as packets enter the network. Used for port forwarding — expose internal services to the internet.',
    example: '1.2.3.4:80 → 203.0.113.5:80 → 10.0.0.20:8080',
    iptables: 'iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j DNAT --to-destination 10.0.0.20:8080',
    rfcNote: 'RFC 3022 §4 — Server exposure via port mapping',
    cloudNote: 'AWS: ALB/NLB listener rules. K8s: NodePort/LoadBalancer Services. iptables kube-proxy mode.',
  },
  {
    title: 'PAT / Masquerade',
    badge: 'Many→One',
    color: '#f59e0b',
    desc: 'Port Address Translation — a form of SNAT where the source port is also rewritten. Allows thousands of internal hosts to share ONE public IP by tracking unique (IP, port) pairs.',
    example: '10.0.0.10:54321 → :10001 / 10.0.0.11:54321 → :10002 (same public IP, different ports)',
    iptables: 'iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE  # auto-uses interface IP',
    rfcNote: 'PAT is NAPT (Network Address and Port Translation) per RFC 2663',
    cloudNote: 'Home routers, AWS NAT Gateway, every corporate network — PAT is ubiquitous.',
  },
];

export default function NATPATPage() {
  const [activeTab, setActiveTab] = useState<'types' | 'table' | 'quiz'>('types');
  const [selectedType, setSelectedType] = useState(0);
  const { markTopicViewed } = useProgress();
  useEffect(() => { markTopicViewed('nat'); }, [markTopicViewed]);

  const type = NAT_TYPES[selectedType];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shuffle size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">NAT & PAT — Network Address Translation</h1>
            <p className="text-sm text-slate-500 mt-0.5">Network Layer · RFC 3022 · RFC 4787</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={3} size="sm" />
            <span className="badge-amber">Intermediate</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            NAT is like a company's main phone number — callers dial one number (public IP), and the receptionist (NAT router) forwards the call to the right internal extension (private IP). IPv4 exhaustion means billions of devices share a tiny pool of public IPs using NAT.
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (RFC 3022): </span>
            NAT rewrites IP headers in transit. A NAT table (connection tracking) maps (src-IP, src-port, dst-IP, dst-port, protocol) tuples before and after translation. Linux implements NAT in netfilter using the PREROUTING (DNAT) and POSTROUTING (SNAT/MASQUERADE) hooks. PAT extends SNAT by also rewriting the source port, allowing ~65,535 simultaneous sessions per public IP.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['types', 'table', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'types' ? '🔀 NAT Types' : tab === 'table' ? '📋 NAT Table' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'types' && (
        <div className="space-y-5">
          {/* Type selector */}
          <div className="flex gap-2">
            {NAT_TYPES.map((t, i) => (
              <button key={t.title} onClick={() => setSelectedType(i)}
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all"
                style={{
                  borderColor: selectedType === i ? t.color : 'rgba(255,255,255,0.06)',
                  backgroundColor: selectedType === i ? `${t.color}12` : 'rgba(255,255,255,0.02)',
                }}>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded border" style={{ color: t.color, borderColor: `${t.color}30`, backgroundColor: `${t.color}10` }}>{t.badge}</span>
                <span className="text-slate-300 text-xs hidden sm:inline">{t.title}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={selectedType} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-2xl p-6 space-y-4" style={{ borderColor: `${type.color}25` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${type.color}15`, border: `1px solid ${type.color}30` }}>
                  {selectedType === 0 ? <ArrowRight size={20} style={{ color: type.color }} /> :
                   selectedType === 1 ? <ArrowLeft size={20} style={{ color: type.color }} /> :
                   <Shuffle size={20} style={{ color: type.color }} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{type.title}</h3>
                  <p className="text-xs" style={{ color: type.color }}>{type.rfcNote}</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{type.desc}</p>

              {/* Packet flow visualiser */}
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-2">Packet translation:</p>
                <div className="font-mono text-xs text-slate-300 leading-relaxed" style={{ color: type.color }}>
                  {type.example}
                </div>
              </div>

              <div className="space-y-2">
                <div className="glass rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">iptables rule:</p>
                  <code className="text-xs text-emerald-300 font-mono">{type.iptables}</code>
                </div>
                <div className="glass rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">☁️ Cloud / Kubernetes:</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{type.cloudNote}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Why NAT exists */}
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Why NAT Exists</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              IPv4 has only ~4.3 billion addresses (2³²). With 15+ billion internet-connected devices, addresses ran out (IANA exhausted in 2011). NAT was the stopgap: RFC 1918 private ranges (10.x, 172.16-31.x, 192.168.x) are reused privately everywhere. IPv6 (2¹²⁸ addresses) eliminates the need for NAT — but IPv4+NAT will persist for decades in legacy infrastructure.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'table' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">The NAT connection tracking table maps private (IP, port) pairs to public (IP, port) pairs. Linux: <code className="text-xs bg-white/[0.06] px-1 py-0.5 rounded">/proc/net/nf_conntrack</code></p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/[0.06] text-left">
                {['Private Src', 'Private Port', 'Public IP', 'Mapped Port', 'Destination', 'Dst Port', 'Proto', 'State'].map(h => (
                  <th key={h} className="text-[10px] text-slate-500 py-2 pr-3 font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {NAT_TABLE.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 text-electric-300">{row.srcPrivate}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{row.srcPort}</td>
                    <td className="py-2.5 pr-3 text-emerald-300">{row.publicIP}</td>
                    <td className="py-2.5 pr-3 text-emerald-400">{row.mappedPort}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{row.dstIP}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{row.dstPort}</td>
                    <td className="py-2.5 pr-3 text-amber-300">{row.protocol}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${row.state === 'ESTABLISHED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {row.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-amber-400/80 flex items-center gap-1.5"><Info size={11} /> PAT Port Exhaustion Warning</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Each public IP supports max ~65,535 simultaneous mapped ports. High-traffic servers using a single NAT IP can hit port exhaustion. AWS NAT Gateway scales this by automatically using multiple IPs.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="nat" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock language="bash" filename="nat-commands.sh" code={`# View current iptables NAT rules
sudo iptables -t nat -L -n -v

# MASQUERADE (outbound SNAT — auto uses interface IP)
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# Port forwarding: external port 80 → internal 10.0.0.20:8080 (DNAT)
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 \\
  -j DNAT --to-destination 10.0.0.20:8080

# Enable IP forwarding (required for routing/NAT)
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward
# Persist: add net.ipv4.ip_forward=1 to /etc/sysctl.conf

# View Linux connection tracking table (NAT state)
sudo cat /proc/net/nf_conntrack
sudo conntrack -L

# Count active NAT connections
sudo conntrack -L | wc -l

# View NAT on AWS (VPC)
aws ec2 describe-nat-gateways
aws ec2 describe-nat-gateway-addresses`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
