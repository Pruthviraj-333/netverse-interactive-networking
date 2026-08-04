import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ArrowRight, CheckCircle, Info } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 1122 – Requirements for Internet Hosts – Communication Layers', url: 'https://www.rfc-editor.org/rfc/rfc1122', type: 'rfc', rfcNumber: 1122 },
  { title: 'RFC 1123 – Requirements for Internet Hosts – Application and Support', url: 'https://www.rfc-editor.org/rfc/rfc1123', type: 'rfc', rfcNumber: 1123 },
  { title: 'ISO/IEC 7498-1: Open Systems Interconnection', url: 'https://www.iso.org/standard/20269.html', type: 'official' },
];

const TCPIP_LAYERS = [
  {
    tcpLayer: '4. Application',
    osiEquivalent: 'Layer 7 (App), Layer 6 (Pres), Layer 5 (Session)',
    pdu: 'Data / Payload',
    protocols: ['HTTP/HTTPS', 'DNS', 'DHCP', 'SSH', 'TLS', 'gRPC', 'BGP'],
    color: '#8b5cf6',
    desc: 'Provides high-level communications protocols for end-user processes and application software. Combines OSI Layers 5, 6, and 7.',
    kernel: 'Userspace (Browser, Nginx, sshd). Interfaces via Socket API (sys_connect, sys_sendto).',
  },
  {
    tcpLayer: '3. Transport',
    osiEquivalent: 'Layer 4 (Transport)',
    pdu: 'Segment (TCP) / Datagram (UDP)',
    protocols: ['TCP', 'UDP', 'QUIC', 'SCTP'],
    color: '#3b82f6',
    desc: 'Provides host-to-host communication services. Handles port multiplexing, error control, flow control, and optional reliability.',
    kernel: 'Linux Kernel Network Stack (tcp_v4_rcv, udp_rcv, socket buffer sk_buff handling).',
  },
  {
    tcpLayer: '2. Internet',
    osiEquivalent: 'Layer 3 (Network)',
    pdu: 'Packet / IP Datagram',
    protocols: ['IPv4', 'IPv6', 'ICMP', 'ARP (L2/L3 bridge)', 'IPsec'],
    color: '#10b981',
    desc: 'Handles logical addressing (IPs), packet routing across heterogeneous networks, fragmentation, and error signaling.',
    kernel: 'Linux Kernel IP Stack (ip_rcv, ip_forward, netfilter/iptables, routing table lookup).',
  },
  {
    tcpLayer: '1. Network Access (Link)',
    osiEquivalent: 'Layer 2 (Data Link) & Layer 1 (Physical)',
    pdu: 'Frame (L2) / Bits (L1)',
    protocols: ['Ethernet (802.3)', 'Wi-Fi (802.11)', 'PPP', 'VLAN (802.1Q)'],
    color: '#f59e0b',
    desc: 'Covers physical hardware transmission, MAC addressing, framing, collision detection, and network interface card (NIC) drivers.',
    kernel: 'NIC Driver, eBPF / XDP driver hook, dev_queue_xmit, ring buffer rx/tx.',
  },
];

export default function TCPIPModelPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'pdus' | 'quiz'>('matrix');
  const [selectedLayer, setSelectedLayer] = useState<number>(0);
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('tcpip-model'); }, [markTopicViewed]);

  const current = TCPIP_LAYERS[selectedLayer];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Layers size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">TCP/IP Model vs OSI Model</h1>
            <p className="text-sm text-slate-500 mt-0.5">Architecture · RFC 1122</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-violet">4-Layer Architecture</span>
            <span className="badge-green">Beginner</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            The OSI Model is an ideal 7-layer textbook concept. The TCP/IP Model is the pragmatic 4-layer architecture that actually runs the global internet today.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (RFC 1122): </span>
            The TCP/IP model simplifies network protocol design into 4 functional layers: **Application**, **Transport**, **Internet**, and **Network Access**. Unlike OSI, TCP/IP combines OSI layers 5-7 into a unified Application layer and combines OSI layers 1-2 into Network Access.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['matrix', 'pdus', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'matrix' ? '📊 Model Matrix' : tab === 'pdus' ? '📦 PDU & Encapsulation' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {TCPIP_LAYERS.map((layer, i) => (
              <button key={layer.tcpLayer} onClick={() => setSelectedLayer(i)}
                className={`text-left p-4 rounded-xl border transition-all ${selectedLayer === i ? 'glass-strong shadow-lg' : 'glass opacity-70 hover:opacity-100'}`}
                style={{ borderColor: selectedLayer === i ? layer.color : 'rgba(255,255,255,0.06)' }}>
                <div className="text-xs font-mono font-bold mb-1" style={{ color: layer.color }}>{layer.tcpLayer}</div>
                <div className="text-xs text-slate-400 truncate">{layer.osiEquivalent}</div>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={selectedLayer} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-2xl p-6 space-y-4 border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white" style={{ color: current.color }}>{current.tcpLayer} Layer</h3>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/[0.06] text-slate-300">PDU: {current.pdu}</span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{current.desc}</p>

              <div className="glass rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Equivalent OSI Layers</div>
                <div className="text-xs text-slate-200 font-mono">{current.osiEquivalent}</div>
              </div>

              <div className="glass rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Protocols</div>
                <div className="flex flex-wrap gap-1.5">
                  {current.protocols.map(p => (
                    <span key={p} className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.06]">{p}</span>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Linux Kernel Location</div>
                <div className="text-xs text-emerald-300 font-mono">{current.kernel}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'pdus' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Data unit naming changes as it flows down the TCP/IP stack (Encapsulation):</p>
          <div className="space-y-3">
            {[
              { layer: 'Application', pdu: 'Data / Payload', header: 'Application Headers (HTTP, DNS)', color: '#8b5cf6' },
              { layer: 'Transport', pdu: 'Segment (TCP) / Datagram (UDP)', header: '+ TCP/UDP Header (Ports, Sequence)', color: '#3b82f6' },
              { layer: 'Internet', pdu: 'Packet / IP Datagram', header: '+ IP Header (Source/Dest IP, TTL)', color: '#10b981' },
              { layer: 'Network Access', pdu: 'Frame', header: '+ Ethernet Header (MACs, EtherType) & FCS Trailer', color: '#f59e0b' },
            ].map(item => (
              <div key={item.layer} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold" style={{ color: item.color }}>{item.layer} Layer</div>
                  <div className="text-sm font-semibold text-white">{item.pdu}</div>
                </div>
                <div className="text-xs font-mono text-slate-400">{item.header}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="tcpip-model" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Networking Inspection</span></div>
      <CodeBlock language="bash" filename="tcpip-inspection.sh" code={`# Application Layer — Sockets
ss -tulpn              # List active listening sockets & processes

# Transport Layer — Socket Statistics & TCP State
ss -s                  # Summary statistics of TCP/UDP sockets
netstat -s             # SNMP counters for TCP/UDP errors

# Internet Layer — Routing & IP Interface
ip addr show           # View IP addresses (L3)
ip route show          # View Kernel Routing Table (L3)

# Network Access Layer — Links & MACs
ip link show           # View Network Interfaces (L2)
ip neighbor show       # View ARP / Neighbor Cache (L2->L3 mapping)
ethtool eth0           # View physical link speed/duplex (L1)`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
