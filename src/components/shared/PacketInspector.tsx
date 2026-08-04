import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Binary, Eye, Info, Layers } from 'lucide-react';

export type PacketProtocol = 'ethernet' | 'ipv4' | 'tcp' | 'udp' | 'icmp';

interface FieldSpec {
  name: string;
  bytes: string;
  value: string;
  hex: string;
  color: string;
  desc: string;
}

const HEADER_SPECS: Record<PacketProtocol, { title: string; size: string; fields: FieldSpec[] }> = {
  ethernet: {
    title: 'Ethernet II Frame Header',
    size: '14 Bytes (excluding 4-byte FCS)',
    fields: [
      { name: 'Destination MAC', bytes: 'Bytes 0-5 (6 bytes)', value: '00:1A:2B:3C:4D:5E', hex: '00 1a 2b 3c 4d 5e', color: '#3b82f6', desc: '48-bit hardware address of target network card or gateway router.' },
      { name: 'Source MAC', bytes: 'Bytes 6-11 (6 bytes)', value: '52:54:00:12:34:56', hex: '52 54 00 12 34 56', color: '#10b981', desc: '48-bit hardware address of transmitting network interface card (NIC).' },
      { name: 'EtherType', bytes: 'Bytes 12-13 (2 bytes)', value: '0x0800 (IPv4)', hex: '08 00', color: '#8b5cf6', desc: 'Indicates upper-layer protocol encapsulated inside frame payload (0x0800 = IPv4, 0x0806 = ARP, 0x86DD = IPv6).' },
    ],
  },
  ipv4: {
    title: 'IPv4 Header',
    size: '20 Bytes (without options)',
    fields: [
      { name: 'Version & IHL', bytes: 'Byte 0 (1 byte)', value: 'Ver: 4, IHL: 5 (20B)', hex: '45', color: '#3b82f6', desc: 'Version 4 (0x4). Internet Header Length = 5 dwords (20 bytes).' },
      { name: 'DSCP / ECN', bytes: 'Byte 1 (1 byte)', value: '0x00 (Default)', hex: '00', color: '#6366f1', desc: 'Differentiated Services Code Point (QoS) and Explicit Congestion Notification.' },
      { name: 'Total Length', bytes: 'Bytes 2-3 (2 bytes)', value: '1500 Bytes', hex: '05 dc', color: '#ec4899', desc: 'Total IP datagram size including header and payload.' },
      { name: 'Identification', bytes: 'Bytes 4-5 (2 bytes)', value: '0x1c2d (7213)', hex: '1c 2d', color: '#f59e0b', desc: 'Unique ID for reassembling fragmented IP packets.' },
      { name: 'Flags & Fragment Offset', bytes: 'Bytes 6-7 (2 bytes)', value: 'DF=1, MF=0, Offset=0', hex: '40 00', color: '#eab308', desc: 'Flags: Don\'t Fragment (DF=1) prevents router fragmentation.' },
      { name: 'Time to Live (TTL)', bytes: 'Byte 8 (1 byte)', value: '64 Hops', hex: '40', color: '#ef4444', desc: 'Hop count limit decremented by each router. Prevents infinite routing loops.' },
      { name: 'Protocol', bytes: 'Byte 9 (1 byte)', value: '6 (TCP)', hex: '06', color: '#10b981', desc: 'Transport protocol inside IP payload (6 = TCP, 17 = UDP, 1 = ICMP).' },
      { name: 'Header Checksum', bytes: 'Bytes 10-11 (2 bytes)', value: '0xa4b2 (Valid)', hex: 'a4 b2', color: '#06b6d4', desc: '16-bit 1\'s complement checksum for IPv4 header integrity.' },
      { name: 'Source IP', bytes: 'Bytes 12-15 (4 bytes)', value: '192.168.1.50', hex: 'c0 a8 01 32', color: '#3b82f6', desc: '32-bit IPv4 address of origin host.' },
      { name: 'Destination IP', bytes: 'Bytes 16-19 (4 bytes)', value: '93.184.216.34', hex: '5d b8 d8 22', color: '#8b5cf6', desc: '32-bit IPv4 address of target destination host.' },
    ],
  },
  tcp: {
    title: 'TCP Header',
    size: '20 Bytes (without options)',
    fields: [
      { name: 'Source Port', bytes: 'Bytes 0-1 (2 bytes)', value: '54321', hex: 'd4 31', color: '#3b82f6', desc: '16-bit ephemeral source port allocated by client OS.' },
      { name: 'Destination Port', bytes: 'Bytes 2-3 (2 bytes)', value: '443 (HTTPS)', hex: '01 bb', color: '#8b5cf6', desc: '16-bit target service port (443 = HTTPS, 80 = HTTP, 22 = SSH).' },
      { name: 'Sequence Number', bytes: 'Bytes 4-7 (4 bytes)', value: '1000', hex: '00 00 03 e8', color: '#10b981', desc: '32-bit sequence number of the first data octet in this segment.' },
      { name: 'Acknowledgment Number', bytes: 'Bytes 8-11 (4 bytes)', value: '5001', hex: '00 00 13 89', color: '#06b6d4', desc: '32-bit next sequence number expected from peer.' },
      { name: 'Data Offset & Control Flags', bytes: 'Bytes 12-13 (2 bytes)', value: 'ACK, PSH (Offset: 20B)', hex: '50 18', color: '#ec4899', desc: 'Control flags: SYN, ACK, FIN, RST, PSH, URG.' },
      { name: 'Window Size', bytes: 'Bytes 14-15 (2 bytes)', value: '65535 Bytes', hex: 'ff ff', color: '#f59e0b', desc: 'Flow control receive window buffer size.' },
      { name: 'Checksum', bytes: 'Bytes 16-17 (2 bytes)', value: '0x3a1b', hex: '3a 1b', color: '#ef4444', desc: 'Integrity checksum over TCP pseudo-header, header, and data.' },
    ],
  },
  udp: {
    title: 'UDP Header',
    size: '8 Bytes Fixed',
    fields: [
      { name: 'Source Port', bytes: 'Bytes 0-1 (2 bytes)', value: '5353', hex: '14 e9', color: '#3b82f6', desc: '16-bit source port.' },
      { name: 'Destination Port', bytes: 'Bytes 2-3 (2 bytes)', value: '53 (DNS)', hex: '00 35', color: '#8b5cf6', desc: '16-bit destination port.' },
      { name: 'Length', bytes: 'Bytes 4-5 (2 bytes)', value: '42 Bytes', hex: '00 2a', color: '#10b981', desc: 'Total UDP length (header 8B + payload 34B).' },
      { name: 'Checksum', bytes: 'Bytes 6-7 (2 bytes)', value: '0x2c4e', hex: '2c 4e', color: '#ec4899', desc: 'Optional 16-bit checksum over pseudo-header and UDP payload.' },
    ],
  },
  icmp: {
    title: 'ICMP Header',
    size: '8 Bytes Base',
    fields: [
      { name: 'Type', bytes: 'Byte 0 (1 byte)', value: '8 (Echo Request)', hex: '08', color: '#ef4444', desc: 'ICMP Message Type (8 = Ping Request, 0 = Ping Reply, 11 = Time Exceeded).' },
      { name: 'Code', bytes: 'Byte 1 (1 byte)', value: '0', hex: '00', color: '#f59e0b', desc: 'Sub-code providing additional diagnostic details.' },
      { name: 'Checksum', bytes: 'Bytes 2-3 (2 bytes)', value: '0x4f12', hex: '4f 12', color: '#10b981', desc: 'Checksum for ICMP header and payload.' },
      { name: 'Identifier & Sequence', bytes: 'Bytes 4-7 (4 bytes)', value: 'ID: 1, Seq: 1', hex: '00 01 00 01', color: '#3b82f6', desc: 'Matches ping requests to ping responses.' },
    ],
  },
};

export default function PacketInspector({ protocol = 'ipv4' }: { protocol?: PacketProtocol }) {
  const [selectedProto, setSelectedProto] = useState<PacketProtocol>(protocol);
  const [activeField, setActiveField] = useState<number>(0);

  const spec = HEADER_SPECS[selectedProto];
  const field = spec.fields[activeField] || spec.fields[0];

  return (
    <div className="glass-strong rounded-2xl p-6 border border-white/[0.08] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <Binary size={20} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Packet Inspector — {spec.title}</h3>
        </div>
        <div className="flex gap-1.5">
          {(['ethernet', 'ipv4', 'tcp', 'udp', 'icmp'] as const).map(p => (
            <button key={p} onClick={() => { setSelectedProto(p); setActiveField(0); }}
              className={`text-xs font-mono uppercase px-2.5 py-1 rounded-lg border transition-all ${selectedProto === p ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'glass border-white/[0.06] text-slate-400 hover:text-slate-200'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-mono text-slate-400 flex justify-between">
          <span>{spec.title} ({spec.size})</span>
          <span>Click field to inspect hex & RFC spec</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {spec.fields.map((f, i) => {
            const isActive = i === activeField;
            return (
              <button key={f.name} onClick={() => setActiveField(i)}
                className={`text-left p-3 rounded-xl border transition-all ${isActive ? 'glass-strong shadow-lg' : 'glass opacity-75 hover:opacity-100'}`}
                style={{ borderColor: isActive ? f.color : 'rgba(255,255,255,0.06)' }}>
                <div className="text-[10px] font-mono text-slate-400">{f.bytes}</div>
                <div className="text-xs font-bold text-white truncate" style={{ color: f.color }}>{f.name}</div>
                <div className="text-[11px] font-mono text-slate-300 truncate mt-1">{f.value}</div>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeField} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="glass rounded-xl p-5 space-y-3 border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white" style={{ color: field.color }}>{field.name}</h4>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">Raw Hex: {field.hex}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{field.desc}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
