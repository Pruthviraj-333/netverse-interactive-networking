import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Search, AlertTriangle } from 'lucide-react';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import TopicFooterNav from '../../components/common/TopicFooterNav';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'IEEE 802 — MAC Address Standard', url: 'https://standards.ieee.org/products-programs/regauth/', type: 'official' },
  { title: 'RFC 7042 — IANA Considerations for MAC', url: 'https://www.rfc-editor.org/rfc/rfc7042', type: 'rfc', rfcNumber: 7042 },
];

// MAC address anatomy bit-level explanation
const MAC_BITS = [
  { bit: 'Bit 0 of Octet 1 (LSB)', name: 'Unicast / Multicast', values: ['0 = Unicast (single destination)', '1 = Multicast / Broadcast'], color: '#3b82f6' },
  { bit: 'Bit 1 of Octet 1', name: 'Globally / Locally Administered', values: ['0 = Globally Unique (burned-in by IEEE)', '1 = Locally Administered (spoofed/randomized)'], color: '#10b981' },
  { bit: 'Octets 1–3 (24 bits)', name: 'OUI — Organizationally Unique Identifier', values: ['Identifies the NIC manufacturer (IEEE registry)', 'e.g. 52:54:00 = QEMU virtual NIC, 00:1A:A0 = Dell'], color: '#8b5cf6' },
  { bit: 'Octets 4–6 (24 bits)', name: 'Device-Specific ID', values: ['Assigned by manufacturer uniquely per NIC', '16.7 million IDs available per OUI'], color: '#f59e0b' },
];

const SPECIAL_MACS = [
  { mac: 'FF:FF:FF:FF:FF:FF', name: 'Ethernet Broadcast', use: 'ARP Request, DHCP Discover — delivered to ALL hosts in broadcast domain.' },
  { mac: '01:00:5E:xx:xx:xx', name: 'IPv4 Multicast', use: 'Maps to IPv4 multicast group (224.x.x.x). Lower 23 bits copied from multicast IP.' },
  { mac: '33:33:xx:xx:xx:xx', name: 'IPv6 Multicast', use: 'Lower 32 bits copied from IPv6 multicast address for NDP/MLD.' },
  { mac: '00:00:00:00:00:00', name: 'Unset / Null MAC', use: 'Indicates no learned MAC — used in DHCP requests and uninitialized interfaces.' },
];

export default function MACAddressPage() {
  const [activeTab, setActiveTab] = useState<'anatomy' | 'cam' | 'security' | 'quiz'>('anatomy');
  const [selectedBit, setSelectedBit] = useState(0);
  const [macInput, setMacInput] = useState('52:54:00:12:34:56');
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('mac-address'); }, [markTopicViewed]);

  const parseMac = (mac: string) => {
    const parts = mac.replace(/-/g, ':').toUpperCase().split(':');
    if (parts.length !== 6 || parts.some(p => !/^[0-9A-F]{2}$/.test(p))) return null;
    const firstOctet = parseInt(parts[0], 16);
    return {
      oui: parts.slice(0, 3).join(':'),
      nic: parts.slice(3).join(':'),
      isMulticast: (firstOctet & 1) === 1,
      isLocallyAdmin: (firstOctet & 2) === 2,
      isBroadcast: mac.replace(/:/g, '').toUpperCase() === 'FFFFFFFFFFFF',
    };
  };

  const parsed = parseMac(macInput);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Cpu size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">MAC Addresses</h1>
            <p className="text-sm text-slate-500 mt-0.5">Data Link Layer · IEEE 802 · RFC 7042</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={2} size="sm" />
            <span className="badge-green">Beginner</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            A MAC address is a permanent 6-byte hardware ID burned into every NIC by the manufacturer. Switches use them like mailbox numbers to deliver frames to the right device on a LAN.
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (IEEE 802): </span>
            MAC addresses are 48-bit EUI-48 identifiers. Bit 0 of the first octet indicates unicast/multicast. Bit 1 indicates globally unique (OUI-assigned) vs locally administered. The upper 24 bits (OUI) identify the manufacturer; the lower 24 bits are device-specific. IPv4 multicast MACs are derived from the multicast IP address.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['anatomy', 'cam', 'security', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'anatomy' ? '🔬 Anatomy' : tab === 'cam' ? '📋 CAM Table' : tab === 'security' ? '⚠️ Attacks' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'anatomy' && (
        <div className="space-y-5">
          {/* Interactive MAC parser */}
          <div className="glass rounded-xl p-5 space-y-4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">MAC Address Inspector</label>
            <div className="flex items-center gap-3">
              <input
                type="text" value={macInput} onChange={e => setMacInput(e.target.value)}
                placeholder="e.g. 52:54:00:12:34:56"
                className="glass rounded-lg px-4 py-2 text-sm text-white font-mono outline-none border border-white/[0.1] focus:border-emerald-500 w-60"
              />
              <span className="text-xs text-slate-500">Try: FF:FF:FF:FF:FF:FF, 01:00:5E:7F:00:01</span>
            </div>
            {parsed ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="glass rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">OUI (Mfr)</div>
                  <div className="text-sm font-mono font-bold text-purple-400">{parsed.oui}</div>
                </div>
                <div className="glass rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Device ID</div>
                  <div className="text-sm font-mono font-bold text-blue-400">{parsed.nic}</div>
                </div>
                <div className="glass rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Type</div>
                  <div className={`text-sm font-bold ${parsed.isBroadcast ? 'text-amber-400' : parsed.isMulticast ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {parsed.isBroadcast ? '📢 Broadcast' : parsed.isMulticast ? '📡 Multicast' : '🎯 Unicast'}
                  </div>
                </div>
                <div className="glass rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Administered</div>
                  <div className={`text-sm font-bold ${parsed.isLocallyAdmin ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {parsed.isLocallyAdmin ? '⚙️ Local / Spoofed' : '🌐 IEEE Global'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-red-400 font-mono">Invalid MAC format. Use XX:XX:XX:XX:XX:XX</div>
            )}
          </div>

          {/* Bit-level breakdown */}
          <div className="space-y-3">
            {MAC_BITS.map((b, i) => (
              <button key={b.name} onClick={() => setSelectedBit(i)}
                className={`w-full text-left glass rounded-xl p-4 border transition-all ${selectedBit === i ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/[0.06]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold" style={{ color: b.color }}>{b.bit}</span>
                  <span className="text-xs font-semibold text-white">{b.name}</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-400">
                  {b.values.map(v => <span key={v}>• {v}</span>)}
                </div>
              </button>
            ))}
          </div>

          {/* Special MAC addresses */}
          <div className="glass rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Special / Reserved MAC Addresses</h4>
            <div className="space-y-2">
              {SPECIAL_MACS.map(m => (
                <div key={m.mac} className="flex items-start gap-3 glass p-3 rounded-lg">
                  <span className="font-mono text-xs text-emerald-300 shrink-0 pt-0.5">{m.mac}</span>
                  <div>
                    <div className="text-xs font-semibold text-white">{m.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{m.use}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cam' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">CAM Table — Content Addressable Memory</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Switches maintain a CAM table (also called MAC address table) mapping <code className="text-emerald-300">MAC → Port → VLAN → TTL</code>. When a frame arrives, the switch looks up the destination MAC. If found, frame is unicast to that port (cut-through or store-and-forward). If not found, frame is flooded to all ports in the VLAN (unknown unicast flooding).
            </p>
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead className="border-b border-white/[0.06]">
                  <tr className="text-slate-400 text-[10px] uppercase">
                    {['MAC Address', 'Port', 'VLAN', 'TTL', 'Type'].map(h => (
                      <th key={h} className="px-3 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {[
                    ['00:1A:2B:3C:4D:5E', 'Gi0/1', '10', '295s', 'Dynamic'],
                    ['52:54:00:12:34:56', 'Gi0/2', '10', '180s', 'Dynamic'],
                    ['AA:BB:CC:DD:EE:FF', 'Gi0/3', '20', '60s', 'Dynamic'],
                    ['00:00:00:00:00:01', 'Gi0/0', '1', '—', 'Static'],
                  ].map(row => (
                    <tr key={row[0]} className="hover:bg-white/[0.02]">
                      {row.map((cell, i) => (
                        <td key={i} className={`px-3 py-2 ${i === 0 ? 'text-emerald-300' : i === 4 ? (cell === 'Static' ? 'text-amber-400' : 'text-slate-300') : 'text-slate-300'}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          {[
            { title: 'MAC Spoofing', color: '#ef4444', desc: 'Attacker changes their NIC MAC to impersonate another device. Bypasses MAC-based access control (port security). Linux: ip link set dev eth0 address XX:XX:XX:XX:XX:XX' },
            { title: 'CAM Table Flooding (MAC Flooding Attack)', color: '#f59e0b', desc: 'Attacker sends thousands of frames with random source MACs, filling the switch CAM table. Once full, switch degrades to hub mode — flooding ALL frames to ALL ports. Attacker captures traffic. Mitigation: port security (max MAC limit per port).' },
            { title: 'ARP Spoofing / Poisoning', color: '#8b5cf6', desc: 'Attacker sends Gratuitous ARPs mapping victim IP to attacker MAC. Traffic redirected through attacker (MITM). Mitigation: Dynamic ARP Inspection (DAI) on managed switches, ArpWatch monitoring.' },
          ].map(a => (
            <div key={a.title} className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: a.color }} />
                <h3 className="text-sm font-bold text-white">{a.title}</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="mac-address" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock language="bash" filename="mac-commands.sh" code={`# View MAC address of all interfaces
ip link show
ip addr show

# Spoof MAC address (locally administered)
sudo ip link set dev eth0 address 02:42:AC:11:00:02

# View switch-style MAC table via ARP cache
ip neighbor show

# Show MAC on a specific interface
cat /sys/class/net/eth0/address

# Watch for ARP changes (detect spoofing)
sudo arpwatch -i eth0`} />
      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
      <TopicFooterNav currentTopicId="mac-address" />
    </div>
  );
}

