import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Binary, AlertCircle } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { useProgress } from '../../stores';
import { calculateSubnet, isValidIPv4, toBinaryDotted, parseCIDR } from '../../utils/subnet';
import type { Reference, SubnetResult } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 791 – Internet Protocol (IPv4)', url: 'https://www.rfc-editor.org/rfc/rfc791', type: 'rfc', rfcNumber: 791 },
  { title: 'RFC 1918 – Private Address Allocation', url: 'https://www.rfc-editor.org/rfc/rfc1918', type: 'rfc', rfcNumber: 1918 },
  { title: 'RFC 4632 – Classless Inter-domain Routing (CIDR)', url: 'https://www.rfc-editor.org/rfc/rfc4632', type: 'rfc', rfcNumber: 4632 },
  { title: 'RFC 3021 – /31 Prefixes for Point-to-Point Links', url: 'https://www.rfc-editor.org/rfc/rfc3021', type: 'rfc', rfcNumber: 3021 },
  { title: 'RFC 5735 – Special-Use IPv4 Addresses', url: 'https://www.rfc-editor.org/rfc/rfc5735', type: 'rfc', rfcNumber: 5735 },
  { title: 'RFC 8200 – Internet Protocol, Version 6 (IPv6)', url: 'https://www.rfc-editor.org/rfc/rfc8200', type: 'rfc', rfcNumber: 8200 },
  { title: 'AWS VPC and Subnets', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/how-it-works.html', type: 'aws' },
  { title: 'Kubernetes Network Concepts', url: 'https://kubernetes.io/docs/concepts/cluster-administration/networking/', type: 'k8s' },
];

const SPECIAL_RANGES = [
  { range: '10.0.0.0/8',        type: 'Private (RFC 1918)',        notes: '16,777,216 addresses' },
  { range: '172.16.0.0/12',     type: 'Private (RFC 1918)',        notes: '172.16.0.0–172.31.255.255' },
  { range: '192.168.0.0/16',    type: 'Private (RFC 1918)',        notes: '65,536 addresses' },
  { range: '127.0.0.0/8',       type: 'Loopback (RFC 5735)',       notes: '127.0.0.1 most common' },
  { range: '169.254.0.0/16',    type: 'APIPA / Link-local (RFC 3927)', notes: 'Auto-assigned when DHCP fails' },
  { range: '100.64.0.0/10',     type: 'Shared / CGN (RFC 6598)',   notes: 'Carrier-Grade NAT' },
  { range: '192.0.2.0/24',      type: 'Documentation (RFC 5737)', notes: 'TEST-NET-1, not routable' },
  { range: '198.51.100.0/24',   type: 'Documentation (RFC 5737)', notes: 'TEST-NET-2' },
  { range: '203.0.113.0/24',    type: 'Documentation (RFC 5737)', notes: 'TEST-NET-3' },
  { range: '224.0.0.0/4',       type: 'Multicast (RFC 5771)',      notes: 'Class D — not for hosts' },
  { range: '240.0.0.0/4',       type: 'Reserved (RFC 1112)',       notes: 'Class E — experimental' },
  { range: '255.255.255.255/32', type: 'Limited Broadcast',        notes: 'Routers do not forward' },
];

function ResultRow({ label, value, mono = false, highlight = false }: {
  label: string; value: string; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0 ${highlight ? 'text-electric-300' : ''}`}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono' : ''} ${highlight ? 'text-electric-300 font-semibold' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

function BinaryOctet({ decimal, highlight }: { decimal: number; highlight: 'network' | 'host' | 'none'; start: number; end: number }) {
  const bits = decimal.toString(2).padStart(8, '0').split('');
  return (
    <div className="flex gap-0.5">
      {bits.map((bit, i) => (
        <span
          key={i}
          className="w-5 h-5 rounded text-[11px] font-mono font-bold flex items-center justify-center border"
          style={{
            backgroundColor: bit === '1' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.02)',
            borderColor: bit === '1' ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)',
            color: bit === '1' ? '#93c5fd' : '#64748b',
          }}
        >
          {bit}
        </span>
      ))}
    </div>
  );
}

export default function SubnettingPage() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'binary' | 'ranges' | 'quiz'>('calculator');
  const [ip, setIp] = useState('192.168.1.0');
  const [cidr, setCidr] = useState(24);
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [error, setError] = useState('');
  const [cidrInput, setCidrInput] = useState('192.168.1.0/24');
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('ip-addressing'); }, [markTopicViewed]);

  useEffect(() => {
    if (!isValidIPv4(ip) || cidr < 0 || cidr > 32) {
      setError('Enter a valid IPv4 address and prefix (0–32)');
      setResult(null);
      return;
    }
    setError('');
    setResult(calculateSubnet(ip, cidr));
  }, [ip, cidr]);

  const handleCIDRInput = (val: string) => {
    setCidrInput(val);
    const parsed = parseCIDR(val);
    if (parsed) { setIp(parsed.ip); setCidr(parsed.cidr); }
  };

  const octets = ip.split('.').map((o) => parseInt(o, 10)).filter((o) => !isNaN(o));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Calculator size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">IP Addressing &amp; Subnetting</h1>
            <p className="text-sm text-slate-500 mt-0.5">Network Layer · RFC 791 · RFC 1918 · RFC 4632</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-green">Network L3</span>
            <span className="badge-amber">Intermediate</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            An IP address is like a postal address — it tells the network where a device lives.
            A subnet is a neighbourhood: devices in the same subnet can talk directly;
            to reach another subnet, they go through a router (gateway).
            CIDR notation (/24) tells you how big the neighbourhood is.
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical: </span>
            IPv4 (RFC 791) uses 32-bit addresses in dotted-decimal notation. CIDR (RFC 4632) replaced classful addressing —
            a prefix length (/N) defines how many bits are the network portion. The subnet mask is all 1s in the network bits.
            Network address = IP AND mask. Broadcast = IP OR (NOT mask). Hosts = 2^(32-N) - 2 (for N ≤ 30).
            RFC 1918 reserves private ranges that require NAT (RFC 3022) to reach the internet.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['calculator', 'binary', 'ranges', 'quiz'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'calculator' ? '🧮 Subnet Calculator' : tab === 'binary' ? '🔢 Binary View' : tab === 'ranges' ? '📋 Special Ranges' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {/* ── Calculator ─────────────────────────────────────────────────────────── */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div className="glass rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Input</h3>

              {/* CIDR shortcut */}
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">CIDR Notation (e.g. 192.168.1.0/24)</label>
                <input
                  type="text"
                  value={cidrInput}
                  onChange={(e) => handleCIDRInput(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-electric-500/60 focus:bg-white/[0.06] transition-all"
                  placeholder="e.g. 10.0.0.0/8"
                  aria-label="CIDR notation input"
                />
              </div>

              <div className="text-center text-xs text-slate-600">— or enter separately —</div>

              {/* IP input */}
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">IP Address</label>
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => { setIp(e.target.value); setCidrInput(`${e.target.value}/${cidr}`); }}
                  className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-electric-500/60 focus:bg-white/[0.06] transition-all"
                  placeholder="e.g. 192.168.1.0"
                  aria-label="IP address"
                />
              </div>

              {/* CIDR slider */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs text-slate-500">Prefix Length</label>
                  <span className="text-electric-400 font-mono font-bold text-sm">/{cidr}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={cidr}
                  onChange={(e) => { setCidr(+e.target.value); setCidrInput(`${ip}/${e.target.value}`); }}
                  className="w-full accent-electric-500"
                  aria-label="CIDR prefix length"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>/0 (entire internet)</span>
                  <span>/24 (class C)</span>
                  <span>/32 (host)</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
            </div>

            {/* Quick picks */}
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-2">Quick examples:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['10.0.0.0', 8], ['172.16.0.0', 12], ['192.168.1.0', 24],
                  ['192.168.1.0', 26], ['10.0.0.0', 30], ['10.0.0.1', 32],
                ].map(([exIp, exCidr]) => (
                  <button
                    key={`${exIp}/${exCidr}`}
                    onClick={() => { setIp(exIp as string); setCidr(exCidr as number); setCidrInput(`${exIp}/${exCidr}`); }}
                    className="text-[11px] font-mono badge-blue cursor-pointer hover:bg-electric-500/20 transition-colors"
                  >
                    {exIp}/{exCidr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.cidrNotation}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-strong rounded-xl p-5 space-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Results</h3>
                  <div className="flex gap-2">
                    {result.isPrivate && <span className="badge-green text-[10px]">Private (RFC 1918)</span>}
                    <span className="badge-slate text-[10px]">Class {result.ipClass}</span>
                  </div>
                </div>

                <ResultRow label="CIDR" value={result.cidrNotation} mono highlight />
                <ResultRow label="Subnet Mask" value={result.subnetMask} mono />
                <ResultRow label="Wildcard Mask" value={result.wildcardMask} mono />
                <ResultRow label="Network Address" value={result.networkAddress} mono />
                <ResultRow label="Broadcast Address" value={result.broadcastAddress} mono />
                <ResultRow label="First Host" value={cidr <= 30 ? result.firstHost : 'N/A'} mono />
                <ResultRow label="Last Host" value={cidr <= 30 ? result.lastHost : 'N/A'} mono />
                <ResultRow label="Total Addresses" value={result.totalHosts.toLocaleString()} />
                <ResultRow label="Usable Hosts" value={result.usableHosts.toLocaleString()} highlight />

                {result.isPrivate && result.privateRange && (
                  <div className="pt-2 text-xs text-emerald-400/80 flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">ℹ️</span>
                    <span>{result.privateRange}</span>
                  </div>
                )}
                {cidr === 31 && (
                  <div className="pt-2 text-xs text-amber-400/80">
                    ⚡ /31: Point-to-point link per RFC 3021 — no broadcast, 2 usable hosts.
                  </div>
                )}
                {cidr === 32 && (
                  <div className="pt-2 text-xs text-amber-400/80">
                    ⚡ /32: Single host route — used for loopback, anycast, or host-specific routes.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Binary View ────────────────────────────────────────────────────────── */}
      {activeTab === 'binary' && (
        <div className="space-y-5">
          <p className="text-sm text-slate-400">
            Subnetting works by splitting the 32 bits into <span className="text-electric-300">network bits</span> (determined by the prefix) and <span className="text-slate-300">host bits</span>.
            Network address = all host bits set to 0. Broadcast = all host bits set to 1.
          </p>

          {result && (
            <div className="space-y-4">
              {/* IP binary */}
              {[
                { label: 'IP Address',    value: ip,                    color: '#60a5fa' },
                { label: 'Subnet Mask',   value: result.subnetMask,     color: '#f59e0b' },
                { label: 'Network Addr',  value: result.networkAddress,  color: '#10b981' },
                { label: 'Broadcast',     value: result.broadcastAddress, color: '#f43f5e' },
              ].map(({ label, value, color }) => {
                const octs = value.split('.').map((o) => parseInt(o, 10));
                return (
                  <div key={label} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color }}>{label}</span>
                      <span className="font-mono text-xs text-slate-300">{value}</span>
                    </div>
                    <div className="flex gap-3 items-center flex-wrap">
                      {octs.map((oct, i) => (
                        <React.Fragment key={i}>
                          <div className="space-y-1">
                            <div className="text-[10px] text-center text-slate-600 font-mono">{oct}</div>
                            <div className="flex gap-0.5">
                              {oct.toString(2).padStart(8, '0').split('').map((bit, b) => (
                                <span
                                  key={b}
                                  className="w-5 h-5 rounded text-[11px] font-mono font-bold flex items-center justify-center border"
                                  style={{
                                    backgroundColor: bit === '1' ? `${color}20` : 'rgba(255,255,255,0.02)',
                                    borderColor: bit === '1' ? `${color}40` : 'rgba(255,255,255,0.06)',
                                    color: bit === '1' ? color : '#475569',
                                  }}
                                >
                                  {bit}
                                </span>
                              ))}
                            </div>
                          </div>
                          {i < 3 && <span className="text-slate-600">.</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Prefix visual */}
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-2">Prefix boundary at bit {cidr}:</p>
                <div className="flex gap-0 font-mono text-[10px]">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 flex items-center justify-center border-r border-white/[0.04] font-bold"
                      style={{
                        backgroundColor: i < cidr ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.08)',
                        color: i < cidr ? '#93c5fd' : '#6ee7b7',
                      }}
                    >
                      {i < cidr ? 'N' : 'H'}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] mt-1 text-slate-600">
                  <span className="text-electric-400">Network ({cidr} bits)</span>
                  <span className="text-emerald-400">Host ({32 - cidr} bits)</span>
                </div>
              </div>
            </div>
          )}

          {!isValidIPv4(ip) && (
            <div className="text-sm text-slate-500 text-center py-8">Enter a valid IP in the Calculator tab first.</div>
          )}
        </div>
      )}

      {/* ── Special Ranges ─────────────────────────────────────────────────────── */}
      {activeTab === 'ranges' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Special-use IPv4 address ranges per IANA and IETF RFCs. None of these are routable as normal public addresses.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left">
                  <th className="text-xs text-slate-500 py-2 pr-4 font-medium">Range</th>
                  <th className="text-xs text-slate-500 py-2 pr-4 font-medium">Type</th>
                  <th className="text-xs text-slate-500 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {SPECIAL_RANGES.map((r) => (
                  <tr key={r.range} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-electric-300 text-xs">{r.range}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs text-slate-300">{r.type}</span>
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="ip-addressing" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock
        language="bash"
        filename="ip-commands.sh"
        code={`# Show all interfaces and IP addresses
ip addr show
ip -4 addr show    # IPv4 only
ip -6 addr show    # IPv6 only

# Show routing table
ip route show

# Which interface and next-hop for a destination?
ip route get 8.8.8.8

# Add an IP address
sudo ip addr add 192.168.1.100/24 dev eth0

# Delete an IP address
sudo ip addr del 192.168.1.100/24 dev eth0

# Add a static route
sudo ip route add 10.0.0.0/8 via 192.168.1.1

# ipcalc (install: apt install ipcalc)
ipcalc 192.168.1.0/24

# Python one-liner: subnet info
python3 -c "import ipaddress; n=ipaddress.ip_network('192.168.1.0/24'); print(n.network_address, n.broadcast_address, n.num_addresses)"`}
      />

      <div className="mt-8">
        <ReferencePanel references={REFERENCES} />
      </div>
    </div>
  );
}
