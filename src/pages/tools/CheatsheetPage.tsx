import React, { useState } from 'react';
import { BookOpen, Copy, CheckCircle2 } from 'lucide-react';

const WELL_KNOWN_PORTS = [
  { port: 20, proto: 'TCP', service: 'FTP-Data', layer: 'Application' },
  { port: 21, proto: 'TCP', service: 'FTP-Control', layer: 'Application' },
  { port: 22, proto: 'TCP', service: 'SSH', layer: 'Application' },
  { port: 23, proto: 'TCP', service: 'Telnet', layer: 'Application' },
  { port: 25, proto: 'TCP', service: 'SMTP', layer: 'Application' },
  { port: 53, proto: 'TCP/UDP', service: 'DNS', layer: 'Application' },
  { port: 67, proto: 'UDP', service: 'DHCP Server', layer: 'Application' },
  { port: 68, proto: 'UDP', service: 'DHCP Client', layer: 'Application' },
  { port: 80, proto: 'TCP', service: 'HTTP', layer: 'Application' },
  { port: 110, proto: 'TCP', service: 'POP3', layer: 'Application' },
  { port: 123, proto: 'UDP', service: 'NTP', layer: 'Application' },
  { port: 143, proto: 'TCP', service: 'IMAP', layer: 'Application' },
  { port: 179, proto: 'TCP', service: 'BGP', layer: 'Application' },
  { port: 389, proto: 'TCP', service: 'LDAP', layer: 'Application' },
  { port: 443, proto: 'TCP', service: 'HTTPS', layer: 'Application' },
  { port: 445, proto: 'TCP', service: 'SMB / Samba', layer: 'Application' },
  { port: 3306, proto: 'TCP', service: 'MySQL', layer: 'Application' },
  { port: 5432, proto: 'TCP', service: 'PostgreSQL', layer: 'Application' },
  { port: 6443, proto: 'TCP', service: 'Kubernetes API', layer: 'Application' },
  { port: 8080, proto: 'TCP', service: 'HTTP Alt / Dev', layer: 'Application' },
];

const IP_RANGES = [
  { range: '10.0.0.0/8', name: 'RFC 1918 Private (Class A)', hosts: '16,777,214', use: 'Large enterprise / cloud VPC' },
  { range: '172.16.0.0/12', name: 'RFC 1918 Private (Class B)', hosts: '1,048,574', use: 'Medium enterprise' },
  { range: '192.168.0.0/16', name: 'RFC 1918 Private (Class C)', hosts: '65,534', use: 'Home/SOHO networks' },
  { range: '127.0.0.0/8', name: 'Loopback (RFC 5735)', hosts: '16,777,214', use: 'localhost (127.0.0.1)' },
  { range: '169.254.0.0/16', name: 'APIPA / Link-Local (RFC 3927)', hosts: '65,024', use: 'No DHCP available fallback' },
  { range: '100.64.0.0/10', name: 'Shared / CGNAT (RFC 6598)', hosts: '4,194,304', use: 'ISP carrier-grade NAT' },
  { range: '0.0.0.0/0', name: 'Default Route', hosts: 'All', use: 'Catch-all gateway route' },
  { range: '255.255.255.255/32', name: 'Limited Broadcast', hosts: '1', use: 'Broadcast to local subnet' },
];

const TCP_FLAGS = [
  { flag: 'SYN', bit: 'Bit 1', hex: '0x02', use: 'Synchronize sequence numbers — used in connection setup (SYN, SYN-ACK)' },
  { flag: 'ACK', bit: 'Bit 4', hex: '0x10', use: 'Acknowledgment field valid — carried in all packets after initial SYN' },
  { flag: 'FIN', bit: 'Bit 0', hex: '0x01', use: 'No more data from sender — initiates graceful 4-way close' },
  { flag: 'RST', bit: 'Bit 2', hex: '0x04', use: 'Reset connection — abrupt termination, invalid segment received' },
  { flag: 'PSH', bit: 'Bit 3', hex: '0x08', use: 'Push function — deliver data to application immediately, bypass buffering' },
  { flag: 'URG', bit: 'Bit 5', hex: '0x20', use: 'Urgent pointer significant — data should be processed before other data' },
  { flag: 'ECE', bit: 'Bit 6', hex: '0x40', use: 'ECN-Echo — RFC 3168, signals congestion experienced to sender' },
  { flag: 'CWR', bit: 'Bit 7', hex: '0x80', use: 'Congestion Window Reduced — RFC 3168, sender confirms ECN response' },
];

const SUBNET_QUICK_REF = [
  { cidr: '/32', mask: '255.255.255.255', hosts: '1', use: 'Single host, loopback' },
  { cidr: '/31', mask: '255.255.255.254', hosts: '2', use: 'Point-to-point link (RFC 3021)' },
  { cidr: '/30', mask: '255.255.255.252', hosts: '2', use: 'WAN links (2 usable)' },
  { cidr: '/29', mask: '255.255.255.248', hosts: '6', use: 'Small server block' },
  { cidr: '/28', mask: '255.255.255.240', hosts: '14', use: 'Small subnet' },
  { cidr: '/27', mask: '255.255.255.224', hosts: '30', use: '30 host subnet' },
  { cidr: '/26', mask: '255.255.255.192', hosts: '62', use: '62 host subnet' },
  { cidr: '/25', mask: '255.255.255.128', hosts: '126', use: 'Half of /24' },
  { cidr: '/24', mask: '255.255.255.0', hosts: '254', use: 'Standard LAN / VPC subnet' },
  { cidr: '/23', mask: '255.255.254.0', hosts: '510', use: 'Dual /24 block' },
  { cidr: '/22', mask: '255.255.252.0', hosts: '1,022', use: 'AWS default VPC subnet size' },
  { cidr: '/16', mask: '255.255.0.0', hosts: '65,534', use: 'Large internal network' },
  { cidr: '/8', mask: '255.0.0.0', hosts: '16.7M', use: 'Entire Class A block' },
];

type Section = 'ports' | 'ips' | 'tcp-flags' | 'subnets';

export default function CheatsheetPage() {
  const [activeSection, setActiveSection] = useState<Section>('ports');
  const [portFilter, setPortFilter] = useState('');
  const [copied, setCopied] = useState('');

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const filteredPorts = WELL_KNOWN_PORTS.filter(p =>
    portFilter === '' ||
    p.port.toString().includes(portFilter) ||
    p.service.toLowerCase().includes(portFilter.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 animate-in">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Network Cheatsheet
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">RFC-Accurate Quick Reference</p>
            </div>
          </div>
          <span className="badge-violet shrink-0">Tool</span>
        </div>
        <div className="glass rounded-xl p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Your go-to reference for well-known ports, IP address ranges, TCP flags, and subnet quick reference. All values are RFC-grounded and production-accurate.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {([
          { id: 'ports', label: '🔌 Well-Known Ports' },
          { id: 'ips', label: '📍 IP Ranges' },
          { id: 'tcp-flags', label: '🚩 TCP Flags' },
          { id: 'subnets', label: '📊 Subnet Reference' },
        ] as { id: Section; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              activeSection === id
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-lg shadow-violet-500/10'
                : 'glass border-white/[0.06] text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeSection === 'ports' && (
        <div className="space-y-4">
          <input type="text" value={portFilter} onChange={e => setPortFilter(e.target.value)}
            placeholder="Filter by port number or service name..."
            className="w-full glass rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono outline-none border border-white/[0.1] focus:border-violet-500 transition-colors"
          />
          <div className="glass-strong rounded-2xl overflow-x-auto border border-white/[0.06]">
            <table className="w-full text-xs min-w-[500px]">
              <thead className="border-b border-white/[0.06]">
                <tr className="text-slate-400 text-[10px] uppercase tracking-wider">
                  {['Port', 'Protocol', 'Service', 'Copy'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredPorts.map(p => (
                  <tr key={p.port} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-violet-400">{p.port}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{p.proto}</td>
                    <td className="px-4 py-2.5 text-white font-medium">{p.service}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => copy(String(p.port), String(p.port))} className="opacity-50 hover:opacity-100 transition-opacity">
                        {copied === String(p.port) ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-400" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'ips' && (
        <div className="glass-strong rounded-2xl overflow-x-auto border border-white/[0.06]">
          <table className="w-full text-xs min-w-[550px]">
            <thead className="border-b border-white/[0.06]">
              <tr className="text-slate-400 text-[10px] uppercase tracking-wider">
                {['CIDR Range', 'Name', 'Max Hosts', 'Use Case'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {IP_RANGES.map(r => (
                <tr key={r.range} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 font-mono font-bold text-blue-400">{r.range}</td>
                  <td className="px-4 py-2.5 text-white font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 font-mono text-emerald-400">{r.hosts}</td>
                  <td className="px-4 py-2.5 text-slate-400">{r.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === 'tcp-flags' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TCP_FLAGS.map(f => (
            <div key={f.flag} className="glass rounded-xl p-4 border border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-rose-400 w-8">{f.flag}</span>
                <span className="font-mono text-xs text-slate-400">{f.hex}</span>
                <span className="font-mono text-xs text-slate-500 ml-auto">{f.bit}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{f.use}</p>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'subnets' && (
        <div className="glass-strong rounded-2xl overflow-x-auto border border-white/[0.06]">
          <table className="w-full text-xs min-w-[500px]">
            <thead className="border-b border-white/[0.06]">
              <tr className="text-slate-400 text-[10px] uppercase tracking-wider">
                {['CIDR', 'Subnet Mask', 'Usable Hosts', 'Common Use'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {SUBNET_QUICK_REF.map(s => (
                <tr key={s.cidr} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 font-mono font-bold text-cyan-400">{s.cidr}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-300">{s.mask}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-emerald-400">{s.hosts}</td>
                  <td className="px-4 py-2.5 text-slate-400">{s.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
