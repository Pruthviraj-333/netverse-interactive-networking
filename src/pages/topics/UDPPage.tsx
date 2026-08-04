import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, XCircle } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 768 – UDP', url: 'https://www.rfc-editor.org/rfc/rfc768', type: 'rfc', rfcNumber: 768, description: 'Original UDP specification (1980)' },
  { title: 'RFC 9293 – TCP', url: 'https://www.rfc-editor.org/rfc/rfc9293', type: 'rfc', rfcNumber: 9293 },
  { title: 'RFC 9000 – QUIC', url: 'https://www.rfc-editor.org/rfc/rfc9000', type: 'rfc', rfcNumber: 9000, description: 'QUIC transport protocol (runs over UDP)' },
  { title: 'RFC 9114 – HTTP/3 (over QUIC)', url: 'https://www.rfc-editor.org/rfc/rfc9114', type: 'rfc', rfcNumber: 9114 },
];

const COMPARISON = [
  { property: 'Connection', tcp: 'Connection-oriented (3-way handshake)', udp: 'Connectionless (no handshake)' },
  { property: 'Reliability', tcp: 'Guaranteed delivery (ACK + retransmit)', udp: 'Best-effort (no ACK, no retransmit)' },
  { property: 'Ordering', tcp: 'Ordered (SEQ numbers)', udp: 'Unordered (app must handle)' },
  { property: 'Flow Control', tcp: 'Window size (receiver-driven)', udp: 'None' },
  { property: 'Congestion Control', tcp: 'Slow-start, CUBIC, BBR', udp: 'None' },
  { property: 'Header Size', tcp: '20–60 bytes (options)', udp: '8 bytes fixed' },
  { property: 'Speed', tcp: 'Slower (overhead per segment)', udp: 'Faster (minimal overhead)' },
  { property: 'Error Detection', tcp: 'Checksum + retransmit', udp: 'Checksum only (optional in IPv4)' },
  { property: 'Duplex', tcp: 'Full-duplex', udp: 'Full-duplex' },
  { property: 'Broadcast/Multicast', tcp: 'Not supported', udp: 'Supported' },
];

const UDP_USE_CASES = [
  { name: 'DNS (RFC 1035)', why: 'Single query/response. Retry at app level. No need for connection overhead.', port: '53' },
  { name: 'DHCP (RFC 2131)', why: 'Client has no IP — cannot establish TCP. Broadcast-based discovery.', port: '67/68' },
  { name: 'QUIC / HTTP/3 (RFC 9000)', why: 'Implements reliability at app layer over UDP. Avoids TCP head-of-line blocking. 1-RTT or 0-RTT.', port: '443' },
  { name: 'Video Streaming (RTP)', why: 'Dropped frame = acceptable. Retransmit = worse. Low latency beats reliability.', port: '5004' },
  { name: 'Online Gaming', why: 'Position updates are time-sensitive. Stale retransmitted data is useless.', port: 'Variable' },
  { name: 'NTP (RFC 5905)', why: 'Single UDP packet exchange sufficient. Simplicity over reliability.', port: '123' },
  { name: 'SNMP (RFC 3411)', why: 'Simple polling/trap model. Connectionless fits monitoring paradigm.', port: '161/162' },
  { name: 'syslog (RFC 5424)', why: 'Log shipping. Acceptable to drop occasional log entry.', port: '514' },
];

export default function UDPPage() {
  const [activeTab, setActiveTab] = useState<'comparison' | 'header' | 'usecases' | 'quiz'>('comparison');
  const { markTopicViewed } = useProgress();
  useEffect(() => { markTopicViewed('udp'); }, [markTopicViewed]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Zap size={20} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">UDP — User Datagram Protocol</h1>
            <p className="text-sm text-slate-500 mt-0.5">Transport Layer · RFC 768 (1980)</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={4} size="sm" />
            <span className="badge-green">Beginner</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            UDP is like shouting across a room — fast, no handshake, no confirmation. TCP is like a phone call — you establish a connection first, then talk, and hang up properly. UDP sacrifices reliability for raw speed.
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (RFC 768): </span>
            UDP provides a minimal transport service: port multiplexing, checksum (optional in IPv4, mandatory in IPv6), and nothing else. No connection state, no ACKs, no retransmission, no flow control, no ordering. The 8-byte fixed header is the smallest possible transport header. Application-layer protocols built on UDP must implement their own reliability if needed (e.g., QUIC, DNS retry logic).
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['comparison', 'header', 'usecases', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'comparison' ? '⚡ TCP vs UDP' : tab === 'header' ? '📦 UDP Header' : tab === 'usecases' ? '✅ When UDP' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs font-semibold">
            <div className="text-slate-500">Property</div>
            <div className="text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> TCP (RFC 9293)
            </div>
            <div className="text-yellow-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" /> UDP (RFC 768)
            </div>
          </div>
          {COMPARISON.map((row, i) => (
            <motion.div key={row.property} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="grid grid-cols-3 gap-2 glass rounded-xl px-4 py-3">
              <div className="text-xs font-medium text-slate-400">{row.property}</div>
              <div className="text-xs text-slate-300 flex items-start gap-1.5">
                <CheckCircle size={12} className="text-blue-400 shrink-0 mt-0.5" />
                {row.tcp}
              </div>
              <div className="text-xs text-slate-300 flex items-start gap-1.5">
                {row.udp === 'None' || row.udp.startsWith('Not')
                  ? <XCircle size={12} className="text-rose-400 shrink-0 mt-0.5" />
                  : <CheckCircle size={12} className="text-yellow-400 shrink-0 mt-0.5" />}
                {row.udp}
              </div>
            </motion.div>
          ))}

          {/* QUIC callout */}
          <div className="glass rounded-xl p-5 border border-violet-500/20 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-violet text-xs">QUIC / HTTP/3</span>
              <span className="text-xs text-slate-500">RFC 9000 — The best of both worlds</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              QUIC (RFC 9000) runs over UDP but implements connection-oriented, reliable, encrypted, multiplexed transport entirely in userspace. It eliminates TCP's head-of-line blocking (a lost packet in stream 1 doesn't block stream 2), achieves 1-RTT or 0-RTT connection setup, and bakes in TLS 1.3. HTTP/3 (RFC 9114) runs exclusively over QUIC. Google, Cloudflare, and Meta use QUIC for the majority of their traffic.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'header' && (
        <div className="space-y-5">
          <p className="text-sm text-slate-400">UDP header is exactly 8 bytes — the smallest valid transport header. No options, no extensions.</p>

          {/* Visual header */}
          <div className="glass rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">UDP Header (RFC 768)</p>
            <div className="font-mono text-xs">
              <div className="text-slate-500 mb-1 ml-1">Bit:  0              15 16             31</div>
              {[
                { left: 'Source Port (16 bits)', right: 'Destination Port (16 bits)', lcol: '#3b82f6', rcol: '#8b5cf6' },
                { left: 'Length (16 bits)', right: 'Checksum (16 bits)', lcol: '#10b981', rcol: '#f59e0b' },
                { left: 'Data (variable)', right: '', lcol: '#64748b', rcol: '#64748b' },
              ].map((row, i) => (
                <div key={i} className="flex mb-1">
                  <div className="flex-1 text-center py-2 rounded-l border border-r-0" style={{ borderColor: `${row.lcol}30`, backgroundColor: `${row.lcol}10`, color: row.lcol }}>{row.left}</div>
                  {row.right && <div className="flex-1 text-center py-2 rounded-r border" style={{ borderColor: `${row.rcol}30`, backgroundColor: `${row.rcol}10`, color: row.rcol }}>{row.right}</div>}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-xs text-slate-500">Total header size: <span className="text-yellow-400 font-bold">8 bytes</span> (vs TCP minimum 20 bytes)</div>
          </div>

          {/* Field descriptions */}
          {[
            { field: 'Source Port', bits: 16, desc: 'Ephemeral port of the sender (1024–65535 for clients). Optional in UDP — can be 0 if no reply is needed.' },
            { field: 'Destination Port', bits: 16, desc: 'Well-known port of the target service. DNS=53, DHCP=67/68, NTP=123, QUIC=443.' },
            { field: 'Length', bits: 16, desc: 'Total length of UDP header + data in bytes. Minimum=8 (header only, no data). Max=65,535 bytes (but limited by IP MTU in practice).' },
            { field: 'Checksum', bits: 16, desc: 'Covers UDP header + data + a pseudo-header of IP addresses. Optional in IPv4 (0=disabled), mandatory in IPv6. Does NOT provide error correction — only detection.' },
          ].map(f => (
            <div key={f.field} className="glass rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-electric-300 text-sm font-medium">{f.field}</span>
                <span className="text-[10px] text-slate-500">{f.bits} bits</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'usecases' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Not everything needs TCP reliability. These protocols choose UDP deliberately for valid technical reasons.</p>
          {UDP_USE_CASES.map(u => (
            <div key={u.name} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-white">{u.name}</span>
                <span className="font-mono text-[10px] text-slate-500 border border-white/[0.06] rounded px-1.5 py-0.5">:{u.port}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{u.why}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="udp" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock language="bash" filename="udp-commands.sh" code={`# View UDP sockets
ss -uln            # UDP listening sockets
ss -uan            # all UDP sockets
ss -ulnp           # with process names

# Capture UDP traffic
sudo tcpdump -i eth0 -n udp
sudo tcpdump -i eth0 -n 'udp port 53'   # DNS only
sudo tcpdump -i eth0 -n 'udp port 123'  # NTP only

# Send UDP test packet (netcat)
echo "hello" | nc -u -w1 192.168.1.1 9999

# Listen for UDP
nc -ulp 9999

# DNS over UDP (standard)
dig google.com @8.8.8.8 +notcp

# DNS over TCP (forced — for large responses or AXFR)
dig google.com @8.8.8.8 +tcp

# Check QUIC / HTTP3 support
curl --http3 https://cloudflare.com -I 2>&1 | head -5`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
