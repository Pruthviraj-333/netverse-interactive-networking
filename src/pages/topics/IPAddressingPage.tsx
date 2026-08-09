import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Binary, ShieldCheck, Info } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import TopicFooterNav from '../../components/common/TopicFooterNav';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 791 – Internet Protocol (IPv4)', url: 'https://www.rfc-editor.org/rfc/rfc791', type: 'rfc', rfcNumber: 791, description: 'Original IPv4 specification' },
  { title: 'RFC 1918 – Private Address Allocation', url: 'https://www.rfc-editor.org/rfc/rfc1918', type: 'rfc', rfcNumber: 1918, description: 'Private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)' },
  { title: 'RFC 4632 – Classless Inter-domain Routing (CIDR)', url: 'https://www.rfc-editor.org/rfc/rfc4632', type: 'rfc', rfcNumber: 4632 },
  { title: 'RFC 8200 – Internet Protocol, Version 6 (IPv6)', url: 'https://www.rfc-editor.org/rfc/rfc8200', type: 'rfc', rfcNumber: 8200 },
  { title: 'RFC 5735 – Special-Use IPv4 Addresses', url: 'https://www.rfc-editor.org/rfc/rfc5735', type: 'rfc', rfcNumber: 5735 },
];

const IPV4_CLASSES = [
  { name: 'Class A', range: '1.0.0.0 – 126.255.255.255', defaultMask: '255.0.0.0 (/8)', networkBits: '8', hostBits: '24', maxHosts: '16,777,214', leadingBits: '0', useCase: 'Very large organizations, ISPs', color: '#3b82f6' },
  { name: 'Class B', range: '128.0.0.0 – 191.255.255.255', defaultMask: '255.255.0.0 (/16)', networkBits: '16', hostBits: '16', maxHosts: '65,534', leadingBits: '10', useCase: 'Medium to large enterprises, universities', color: '#10b981' },
  { name: 'Class C', range: '192.0.0.0 – 223.255.255.255', defaultMask: '255.255.255.0 (/24)', networkBits: '24', hostBits: '8', maxHosts: '254', leadingBits: '110', useCase: 'Small businesses, home networks', color: '#f59e0b' },
  { name: 'Class D', range: '224.0.0.0 – 239.255.255.255', defaultMask: 'N/A (Multicast)', networkBits: 'N/A', hostBits: 'N/A', maxHosts: 'N/A', leadingBits: '1110', useCase: 'Multicast traffic (OSPF, RIPv2, video streams)', color: '#8b5cf6' },
  { name: 'Class E', range: '240.0.0.0 – 255.255.255.254', defaultMask: 'N/A (Experimental)', networkBits: 'N/A', hostBits: 'N/A', maxHosts: 'N/A', leadingBits: '1111', useCase: 'Reserved by IANA for future/experimental use', color: '#ec4899' },
];

const SPECIAL_RANGES = [
  { range: '10.0.0.0/8', type: 'Private (RFC 1918)', scope: 'Internal Networks', notes: '16,777,216 addresses. Standard for large enterprise VPCs.' },
  { range: '172.16.0.0/12', type: 'Private (RFC 1918)', scope: 'Internal Networks', notes: '172.16.0.0–172.31.255.255. Commonly used in Docker bridge networks.' },
  { range: '192.168.0.0/16', type: 'Private (RFC 1918)', scope: 'Internal Networks', notes: '65,536 addresses. Standard for home Wi-Fi routers and small LANs.' },
  { range: '127.0.0.0/8', type: 'Loopback (RFC 5735)', scope: 'Host Local', notes: '127.0.0.1 (localhost). Traffic never leaves the local network interface card.' },
  { range: '169.254.0.0/16', type: 'APIPA / Link-Local', scope: 'Link Local', notes: 'Auto-assigned by OS when DHCP server is unreachable.' },
  { range: '100.64.0.0/10', type: 'Carrier-Grade NAT (RFC 6598)', scope: 'ISP Level', notes: 'Shared address space for ISPs providing NAT to multiple subscribers.' },
  { range: '192.0.2.0/24', type: 'Documentation (TEST-NET-1)', scope: 'Docs & Examples', notes: 'Reserved strictly for code samples and textbook documentation.' },
  { range: '224.0.0.0/4', type: 'Multicast (Class D)', scope: 'Multicast Group', notes: 'Used to send packets to multiple subscribed receivers simultaneously.' },
  { range: '255.255.255.255/32', type: 'Limited Broadcast', scope: 'Local Subnet', notes: 'Sent to all devices on the local broadcast domain. Routers do NOT forward.' },
];

export default function IPAddressingPage() {
  const [activeTab, setActiveTab] = useState<'structure' | 'classes' | 'special' | 'quiz'>('structure');
  const [testIp, setTestIp] = useState('192.168.1.100');
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('ip-addressing'); }, [markTopicViewed]);

  const parseOctets = (ipStr: string) => {
    const parts = ipStr.split('.').map(p => parseInt(p, 10));
    if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
      return parts;
    }
    return [192, 168, 1, 100];
  };

  const currentOctets = parseOctets(testIp);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">IP Addressing & CIDR</h1>
            <p className="text-sm text-slate-500 mt-0.5">Network Layer · RFC 791 · RFC 4632 · IPv4 & IPv6 Architecture</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={3} size="sm" />
            <span className="badge-green">Beginner</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple explanation: </span>
            An IP address is the digital mailing address of a connected device. Just as a physical postal address specifies a Country, City, Street, and House number, an IP address identifies both the **Network** the device belongs to and the specific **Host** device on that network.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical explanation (RFC 791 & RFC 4632): </span>
            An IPv4 address is a 32-bit unsigned binary integer expressed in dot-decimal notation (4 × 8-bit octets separated by dots, e.g., `192.168.1.1`). Classless Inter-Domain Routing (CIDR) replaced legacy Classful addressing (Class A/B/C) by allowing arbitrary prefix lengths (`/0` to `/32`) to denote the boundary between Network bits and Host bits.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        {(['structure', 'classes', 'special', 'quiz'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'structure' ? '🌐 IPv4/IPv6 Structure' : tab === 'classes' ? '🏷️ Classful vs CIDR' : tab === 'special' ? '🔒 Private & Special IPs' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Structure ─────────────────────────────────────────────────── */}
      {activeTab === 'structure' && (
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 border border-white/[0.06] space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Binary size={18} className="text-blue-400" />
              Interactive Binary Octet Explorer
            </h3>
            <p className="text-xs text-slate-400">
              Type any IPv4 address to inspect its 32-bit binary structure across all 4 octets.
            </p>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400">IPv4 Address:</span>
              <input
                type="text"
                value={testIp}
                onChange={(e) => setTestIp(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500/50 w-48"
                placeholder="192.168.1.100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {currentOctets.map((octet, idx) => {
                const binaryStr = octet.toString(2).padStart(8, '0');
                return (
                  <div key={idx} className="glass rounded-xl p-4 border border-blue-500/20 text-center space-y-2">
                    <div className="text-xs text-slate-500 font-mono">Octet {idx + 1}</div>
                    <div className="text-2xl font-bold text-blue-400 font-mono">{octet}</div>
                    <div className="flex justify-center gap-1 pt-1">
                      {binaryStr.split('').map((bit, bitIdx) => (
                        <span
                          key={bitIdx}
                          className="w-5 h-6 rounded text-[11px] font-mono font-bold flex items-center justify-center border"
                          style={{
                            backgroundColor: bit === '1' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.03)',
                            borderColor: bit === '1' ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.06)',
                            color: bit === '1' ? '#60a5fa' : '#64748b',
                          }}
                        >
                          {bit}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center font-mono text-xs text-slate-400 pt-2 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
              Binary: <span className="text-blue-300">{currentOctets.map(o => o.toString(2).padStart(8, '0')).join('.')}</span> (32 total bits)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-3">
              <h4 className="text-sm font-bold text-white">IPv4 (32-Bit)</h4>
              <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <li>• **Total Address Space**: 2^32 = 4,294,967,296 addresses.</li>
                <li>• **Notation**: Dot-decimal (e.g. `192.168.1.1`).</li>
                <li>• **Allocation**: Fully depleted at IANA level in 2011; managed via NAT and CGN.</li>
              </ul>
            </div>

            <div className="glass rounded-xl p-5 border border-purple-500/20 space-y-3">
              <h4 className="text-sm font-bold text-purple-400">IPv6 (128-Bit)</h4>
              <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <li>• **Total Address Space**: 2^128 ≈ 3.4 × 10^38 addresses (340 undecillion).</li>
                <li>• **Notation**: 8 hex blocks separated by colons (e.g., `2001:0db8:85a3:0000:0000:8a2e:0370:7334`).</li>
                <li>• **Features**: Built-in IPsec support, zero broadcast (uses multicast), stateless autoconfiguration (SLAAC).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Classes vs CIDR ───────────────────────────────────────────── */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-bold text-white">Legacy Classful Architecture (RFC 791)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              In the early internet (1981–1993), IP addresses were divided into fixed Classes A, B, and C based on the leading bits of the first octet. This was extremely inefficient: an organization needing 300 IP addresses had to receive a Class B block with 65,534 IPs, wasting over 99% of assigned addresses.
            </p>
          </div>

          <div className="overflow-x-auto glass rounded-xl p-4">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">1st Octet Range</th>
                  <th className="py-2.5 px-3">Default Mask</th>
                  <th className="py-2.5 px-3">Net / Host Bits</th>
                  <th className="py-2.5 px-3">Max Usable Hosts</th>
                  <th className="py-2.5 px-3">Primary Use Case</th>
                </tr>
              </thead>
              <tbody>
                {IPV4_CLASSES.map((c) => (
                  <tr key={c.name} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-bold" style={{ color: c.color }}>{c.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-200">{c.range}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{c.defaultMask}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{c.networkBits} / {c.hostBits}</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">{c.maxHosts}</td>
                    <td className="py-3 px-3 text-slate-400">{c.useCase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass rounded-xl p-5 border border-emerald-500/20 space-y-2">
            <h3 className="text-sm font-bold text-emerald-400">Classless Inter-Domain Routing (CIDR — RFC 4632)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Introduced in 1993, CIDR abolished rigid classes. Instead of fixed `/8`, `/16`, or `/24` boundaries, CIDR allows the prefix length (e.g. `/22`, `/27`, `/30`) to be placed anywhere from `/0` to `/32`. Prefix length `/N` indicates that the first N bits are the Network identifier, leaving 32 - N bits for Host addresses.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab 3: Special Ranges ────────────────────────────────────────────── */}
      {activeTab === 'special' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-2">RFC 1918 Private IP Ranges & Special Reserved Blocks</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Private IP addresses are non-routable on the public internet. Routers on internet backbones automatically drop packets with private destination IPs. NAT (Network Address Translation) is used to translate private IPs to public IPs when accessing the web.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SPECIAL_RANGES.map((r) => (
                <div key={r.range} className="glass rounded-xl p-4 border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-blue-400">{r.range}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">{r.scope}</span>
                  </div>
                  <div className="text-xs font-semibold text-white">{r.type}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{r.notes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Quiz ──────────────────────────────────────────────────────── */}
      {activeTab === 'quiz' && <Quiz topicId="ip-addressing" />}

      {/* Commands Section */}
      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux IP Inspection Commands</span></div>
      <CodeBlock
        language="bash"
        filename="ip-commands.sh"
        code={`# Display all IP addresses assigned to network interfaces (Linux)
ip addr show
ip -4 addr show dev eth0      # show IPv4 only

# Check public WAN IP address via curl
curl https://ifconfig.me
curl https://api.ipify.org

# Inspect Linux routing table with CIDR prefixes
ip route show

# View IPv6 addresses assigned to interfaces
ip -6 addr show`}
      />

      <div className="mt-8">
        <ReferencePanel references={REFERENCES} />
      </div>

      <TopicFooterNav currentTopicId="ip-addressing" />
    </div>
  );
}
