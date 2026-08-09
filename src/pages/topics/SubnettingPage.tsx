import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, AlertCircle, Split, Grid } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import TopicFooterNav from '../../components/common/TopicFooterNav';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import { calculateSubnet, isValidIPv4, parseCIDR } from '../../utils/subnet';
import type { Reference, SubnetResult } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 4632 – Classless Inter-domain Routing (CIDR)', url: 'https://www.rfc-editor.org/rfc/rfc4632', type: 'rfc', rfcNumber: 4632 },
  { title: 'RFC 3021 – /31 Prefixes for Point-to-Point Links', url: 'https://www.rfc-editor.org/rfc/rfc3021', type: 'rfc', rfcNumber: 3021 },
  { title: 'RFC 1918 – Private Address Allocation', url: 'https://www.rfc-editor.org/rfc/rfc1918', type: 'rfc', rfcNumber: 1918 },
  { title: 'AWS VPC Subnetting Design', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html', type: 'aws' },
];

const SUBNET_CHEATSHEET = [
  { cidr: '/8',  mask: '255.0.0.0',       hosts: '16,777,214', block: '16.7M', useCase: 'Class A Default / Huge Backbone' },
  { cidr: '/16', mask: '255.255.0.0',     hosts: '65,534',     block: '65.5k', useCase: 'Class B Default / Large Enterprise VPC' },
  { cidr: '/24', mask: '255.255.255.0',   hosts: '254',        block: '256',   useCase: 'Class C Default / Standard Office Subnet' },
  { cidr: '/25', mask: '255.255.255.128', hosts: '126',        block: '128',   useCase: 'Split /24 in half (128 addresses)' },
  { cidr: '/26', mask: '255.255.255.192', hosts: '62',         block: '64',    useCase: 'Medium department / K8s node subnet' },
  { cidr: '/27', mask: '255.255.255.224', hosts: '30',         block: '32',    useCase: 'Small team / Database cluster' },
  { cidr: '/28', mask: '255.255.255.240', hosts: '14',         block: '16',    useCase: 'Microservices tier / DMZ' },
  { cidr: '/29', mask: '255.255.255.248', hosts: '6',          block: '8',     useCase: 'Small point-to-multipoint links' },
  { cidr: '/30', mask: '255.255.255.252', hosts: '2',          block: '4',     useCase: 'Legacy Point-to-Point router link' },
  { cidr: '/31', mask: '255.255.255.254', hosts: '2 (RFC 3021)', block: '2',   useCase: 'Modern P2P links (no broadcast needed)' },
  { cidr: '/32', mask: '255.255.255.255', hosts: '1',          block: '1',     useCase: 'Single Host / Loopback / Host Route' },
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

export default function SubnettingPage() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'vlsm' | 'reference' | 'quiz'>('calculator');
  const [ip, setIp] = useState('192.168.1.0');
  const [cidr, setCidr] = useState(24);
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [error, setError] = useState('');
  const [cidrInput, setCidrInput] = useState('192.168.1.0/24');
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('subnetting'); }, [markTopicViewed]);

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

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Calculator size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Subnetting & Network Calculation</h1>
            <p className="text-sm text-slate-500 mt-0.5">Network Layer · Subnet Masks · FLSM & VLSM · Host Range Formulas</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={3} size="sm" />
            <span className="badge-amber">Intermediate</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-semibold">Simple explanation: </span>
            Subnetting is the practice of dividing a large network into smaller, isolated sub-networks (subnets). It improves security, reduces broadcast traffic noise, and prevents IP address waste.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-semibold">Technical explanation: </span>
            Given a network block with CIDR prefix <code className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-xs">/N</code>, the total number of host addresses is <code className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-xs">2<sup>32 - N</sup></code>. For <code className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-xs">N ≤ 30</code>, the usable host count is <code className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-xs">2<sup>32 - N</sup> - 2</code>, reserving the first address for the <strong className="text-white font-semibold">Network ID</strong> (all host bits 0) and the last address for the <strong className="text-white font-semibold">Broadcast Address</strong> (all host bits 1).
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar mb-6">
        {(['calculator', 'vlsm', 'reference', 'quiz'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'calculator' ? '🧮 Subnet Calculator' : tab === 'vlsm' ? '⚡ FLSM vs VLSM' : tab === 'reference' ? '📊 Subnet Mask Reference' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Calculator ────────────────────────────────────────────────── */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div className="glass rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Input Parameters</h3>

              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">CIDR Notation (e.g. 192.168.1.0/24)</label>
                <input
                  type="text"
                  value={cidrInput}
                  onChange={(e) => handleCIDRInput(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-emerald-500/60 focus:bg-white/[0.06] transition-all"
                  placeholder="e.g. 10.0.0.0/8"
                />
              </div>

              <div className="text-center text-xs text-slate-600">— or enter separately —</div>

              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">IP Address</label>
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => { setIp(e.target.value); setCidrInput(`${e.target.value}/${cidr}`); }}
                  className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-emerald-500/60 focus:bg-white/[0.06] transition-all"
                  placeholder="e.g. 192.168.1.0"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs text-slate-500">Prefix Length</label>
                  <span className="text-emerald-400 font-mono font-bold text-sm">/{cidr}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={cidr}
                  onChange={(e) => { setCidr(+e.target.value); setCidrInput(`${ip}/${e.target.value}`); }}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>/0 (Internet)</span>
                  <span>/24 (Class C)</span>
                  <span>/32 (Host)</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
            </div>

            <div className="glass rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-2">Quick preset examples:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['10.0.0.0', 8], ['172.16.0.0', 12], ['192.168.1.0', 24],
                  ['192.168.1.0', 26], ['10.0.0.0', 30], ['10.0.0.1', 32],
                ].map(([exIp, exCidr]) => (
                  <button
                    key={`${exIp}/${exCidr}`}
                    onClick={() => { setIp(exIp as string); setCidr(exCidr as number); setCidrInput(`${exIp}/${exCidr}`); }}
                    className="text-[11px] font-mono badge-blue cursor-pointer hover:bg-emerald-500/20 transition-colors"
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
                  <h3 className="text-sm font-semibold text-white">Calculated Subnet Results</h3>
                  <div className="flex gap-2">
                    {result.isPrivate && <span className="badge-green text-[10px]">Private (RFC 1918)</span>}
                    <span className="badge-slate text-[10px]">Class {result.ipClass}</span>
                  </div>
                </div>

                <ResultRow label="CIDR Notation" value={result.cidrNotation} mono highlight />
                <ResultRow label="Subnet Mask" value={result.subnetMask} mono />
                <ResultRow label="Wildcard Mask" value={result.wildcardMask} mono />
                <ResultRow label="Network Address" value={result.networkAddress} mono />
                <ResultRow label="Broadcast Address" value={result.broadcastAddress} mono />
                <ResultRow label="First Usable Host" value={result.firstHost} mono />
                <ResultRow label="Last Usable Host" value={result.lastHost} mono />
                <ResultRow label="Total IP Addresses" value={result.totalHosts.toLocaleString()} mono />
                <ResultRow label="Usable Host Count" value={result.usableHosts.toLocaleString()} mono highlight />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Tab 2: FLSM vs VLSM ──────────────────────────────────────────────── */}
      {activeTab === 'vlsm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Grid size={16} className="text-blue-400" />
                FLSM (Fixed Length Subnet Masking)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                All subnets created from a parent block have the <strong className="text-white font-semibold">exact same subnet mask</strong> (e.g. splitting a <code className="font-mono text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded text-[11px]">/24</code> into 4 equal <code className="font-mono text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded text-[11px]">/26</code> subnets of 64 IPs each). Simple to manage, but wastes addresses if subnets require drastically different numbers of hosts.
              </p>
            </div>

            <div className="glass rounded-xl p-5 border border-emerald-500/20 space-y-2">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Split size={16} className="text-emerald-400" />
                VLSM (Variable Length Subnet Masking)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Subnets have <strong className="text-emerald-400 font-semibold">different prefix lengths</strong> tailored specifically to host count requirements (e.g. 50 hosts → <code className="font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded text-[11px]">/26</code>, 20 hosts → <code className="font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded text-[11px]">/27</code>, 2 router hosts → <code className="font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded text-[11px]">/30</code>). Maximizes address efficiency.
              </p>
            </div>
          </div>

          <div className="glass rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white">VLSM Allocation Example (Parent: 192.168.1.0/24)</h4>
            <div className="space-y-2 text-xs font-mono">
              {[
                { dept: 'Engineering Dept (50 Hosts)', cidr: '/26', range: '192.168.1.0 – 192.168.1.63', mask: '255.255.255.192', color: '#3b82f6' },
                { dept: 'Sales Dept (25 Hosts)', cidr: '/27', range: '192.168.1.64 – 192.168.1.95', mask: '255.255.255.224', color: '#10b981' },
                { dept: 'HR & Finance (10 Hosts)', cidr: '/28', range: '192.168.1.96 – 192.168.1.111', mask: '255.255.255.240', color: '#f59e0b' },
                { dept: 'Router Link (2 Hosts)', cidr: '/30', range: '192.168.1.112 – 192.168.1.115', mask: '255.255.255.252', color: '#8b5cf6' },
              ].map(s => (
                <div key={s.dept} className="glass rounded-lg p-3 flex items-center justify-between border" style={{ borderColor: `${s.color}30` }}>
                  <div>
                    <span className="font-bold text-white" style={{ color: s.color }}>{s.dept}</span>
                    <div className="text-slate-400 text-[11px] mt-0.5">{s.range}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">{s.cidr}</span>
                    <div className="text-slate-500 text-[10px]">{s.mask}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Reference ────────────────────────────────────────────────── */}
      {activeTab === 'reference' && (
        <div className="space-y-4">
          <div className="overflow-x-auto glass rounded-xl p-4">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 font-mono">
                  <th className="py-2.5 px-3">CIDR</th>
                  <th className="py-2.5 px-3">Subnet Mask</th>
                  <th className="py-2.5 px-3">Block Size</th>
                  <th className="py-2.5 px-3">Usable Hosts</th>
                  <th className="py-2.5 px-3">Primary Use Case</th>
                </tr>
              </thead>
              <tbody>
                {SUBNET_CHEATSHEET.map((row) => (
                  <tr key={row.cidr} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{row.cidr}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">{row.mask}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{row.block}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-300 font-bold">{row.hosts}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.useCase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 4: Quiz ──────────────────────────────────────────────────────── */}
      {activeTab === 'quiz' && <Quiz topicId="subnetting" />}

      {/* Commands */}
      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Subnetting CLI Tools</span></div>
      <CodeBlock
        language="bash"
        filename="subnet-tools.sh"
        code={`# Calculate IPv4 subnet details in Linux terminal (ipcalc tool)
ipcalc 192.168.1.0/24
ipcalc 10.0.0.0/16 255.255.255.0

# Calculate CIDR block ranges with sipcalc
sipcalc 172.16.10.0/22

# Python ipaddress module subnet calculation
python3 -c "import ipaddress; net = ipaddress.ip_network('192.168.1.0/26'); print(net.num_addresses, list(net.hosts())[0], list(net.hosts())[-1])"`}
      />

      <div className="mt-8">
        <ReferencePanel references={REFERENCES} />
      </div>

      <TopicFooterNav currentTopicId="subnetting" />
    </div>
  );
}
