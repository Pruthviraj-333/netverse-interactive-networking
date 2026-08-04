import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ArrowDown, ArrowUp, Info, Database, Wifi } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

// ─── DNS animation steps ──────────────────────────────────────────────────────
interface DNSStep {
  id: string;
  from: string;
  to: string;
  fromIcon: string;
  toIcon: string;
  label: string;
  description: string;
  technicalDetail: string;
  queryType?: string;
  response?: string;
  activeOSILayers: number[];
  direction: 'down' | 'up';
  color: string;
}

const DNS_STEPS: DNSStep[] = [
  {
    id: 'app',
    from: 'Application', to: 'OS Stub Resolver',
    fromIcon: '🌐', toIcon: '💻',
    label: 'Step 1: Application requests DNS',
    description: 'Your browser (or app) calls the operating system\'s DNS resolver function (e.g., getaddrinfo("google.com")). The OS handles DNS — the app does not contact DNS directly.',
    technicalDetail: 'glibc: getaddrinfo() → /etc/nsswitch.conf → checks "files" (/etc/hosts), then "dns" (stub resolver). Windows: DnsQueryEx() API.',
    queryType: 'getaddrinfo("google.com")',
    activeOSILayers: [7],
    direction: 'down',
    color: '#8b5cf6',
  },
  {
    id: 'hosts',
    from: 'OS Stub Resolver', to: '/etc/hosts',
    fromIcon: '💻', toIcon: '📄',
    label: 'Step 2: Check /etc/hosts',
    description: 'Before making any network request, the OS checks the local hosts file (/etc/hosts on Linux/macOS, C:\\Windows\\System32\\drivers\\etc\\hosts on Windows) for a static entry.',
    technicalDetail: '/etc/hosts format: "93.184.216.34 example.com". Checked BEFORE DNS by default. Controlled by /etc/nsswitch.conf (Linux) or registry (Windows). Common use: blocking ads, local dev overrides.',
    queryType: 'Check: /etc/hosts for google.com',
    response: 'Not found — proceed to DNS',
    activeOSILayers: [7],
    direction: 'down',
    color: '#06b6d4',
  },
  {
    id: 'local-cache',
    from: 'OS Stub Resolver', to: 'Local DNS Cache',
    fromIcon: '💻', toIcon: '🗄️',
    label: 'Step 3: Check OS cache',
    description: 'The OS resolver checks its in-memory DNS cache. If google.com was recently resolved and the TTL has not expired, the cached answer is returned immediately — no network request needed.',
    technicalDetail: 'Linux: systemd-resolved cache (resolvectl statistics). macOS: mDNSResponder. Windows: ipconfig /displaydns. TTL from the original DNS answer controls how long the entry lives.',
    queryType: 'Cache lookup: google.com',
    response: 'Cache miss — proceed to recursive resolver',
    activeOSILayers: [7],
    direction: 'down',
    color: '#10b981',
  },
  {
    id: 'recursive',
    from: 'OS Stub Resolver', to: 'Recursive Resolver',
    fromIcon: '💻', toIcon: '🔄',
    label: 'Step 4: Query Recursive Resolver',
    description: 'The stub resolver sends a DNS query to the configured recursive resolver (ISP DNS, 8.8.8.8, 1.1.1.1, or company DNS). This is a UDP packet to port 53 (or TCP for large responses).',
    technicalDetail: 'DNS query is UDP by default (RFC 1035). Query packet: Header (12 bytes), Question section (QNAME + QTYPE=A + QCLASS=IN). TCP fallback when response > 512 bytes or with EDNS0 (RFC 6891). DNS over TLS (RFC 7858) and DNS over HTTPS (RFC 8484) encrypt queries.',
    queryType: 'DNS Query: A google.com? (UDP port 53)',
    activeOSILayers: [7, 4, 3],
    direction: 'down',
    color: '#3b82f6',
  },
  {
    id: 'resolver-cache',
    from: 'Recursive Resolver', to: 'Resolver Cache',
    fromIcon: '🔄', toIcon: '🗄️',
    label: 'Step 5: Recursive Resolver Cache',
    description: 'The recursive resolver checks its own cache. ISP resolvers handle millions of queries — frequently accessed domains like google.com are almost always cached here.',
    technicalDetail: 'Recursive resolvers cache every response per TTL. A/AAAA records for google.com have TTL ~300s (5 min). NS records for .com TLD have TTL ~172800s (2 days). Negative cache (NXDOMAIN) is per RFC 2308.',
    queryType: 'Resolver cache lookup',
    response: 'Cache miss — start iterative resolution',
    activeOSILayers: [7],
    direction: 'down',
    color: '#10b981',
  },
  {
    id: 'root',
    from: 'Recursive Resolver', to: 'Root Nameserver',
    fromIcon: '🔄', toIcon: '🌍',
    label: 'Step 6: Query Root Nameserver',
    description: 'The recursive resolver knows the 13 root nameserver sets (a–m.root-servers.net) from its built-in root hints file. It queries a root server asking about google.com.',
    technicalDetail: 'There are 13 root NS addresses (A–M) but 1,800+ physical servers using anycast. The root does NOT know google.com\'s IP. It returns a referral: "Ask the .com TLD servers". Root servers operated by IANA, Verisign, Cogent, etc. Root hits are rare — resolver caches TLD NS records for 48h.',
    queryType: 'Query: Who knows about google.com?',
    response: 'Referral → .com TLD NS: a.gtld-servers.net',
    activeOSILayers: [7, 4, 3],
    direction: 'down',
    color: '#f59e0b',
  },
  {
    id: 'tld',
    from: 'Recursive Resolver', to: 'TLD Nameserver (.com)',
    fromIcon: '🔄', toIcon: '🏢',
    label: 'Step 7: Query TLD Nameserver',
    description: 'The recursive resolver queries the .com TLD nameserver (operated by Verisign). The TLD server knows which authoritative nameservers are responsible for google.com.',
    technicalDetail: 'IANA manages TLD delegation. .com TLD servers: a–m.gtld-servers.net. The TLD does not return the A record — it returns another referral: "The authoritative NS for google.com are ns1–ns4.google.com".',
    queryType: 'Query: Who is authoritative for google.com?',
    response: 'Referral → Auth NS: ns1.google.com, ns2.google.com',
    activeOSILayers: [7, 4, 3],
    direction: 'down',
    color: '#f97316',
  },
  {
    id: 'auth',
    from: 'Recursive Resolver', to: 'Authoritative Nameserver',
    fromIcon: '🔄', toIcon: '📋',
    label: 'Step 8: Query Authoritative Nameserver',
    description: 'The recursive resolver queries Google\'s authoritative nameserver. This server holds the actual DNS zone records for google.com and gives the definitive answer.',
    technicalDetail: 'Authoritative NS response has AA (Authoritative Answer) bit set in the DNS header. Returns: google.com. 300 IN A 142.250.64.46. May return multiple A records for load distribution. DNSSEC (RFC 4033) signs responses with RRSIG records.',
    queryType: 'Query: A record for google.com?',
    response: 'Answer: google.com. 300 IN A 142.250.64.46',
    activeOSILayers: [7, 4, 3],
    direction: 'down',
    color: '#f43f5e',
  },
  {
    id: 'response',
    from: 'Recursive Resolver', to: 'OS Stub Resolver',
    fromIcon: '🔄', toIcon: '💻',
    label: 'Step 9: Response travels back',
    description: 'The recursive resolver caches the answer (for 300 seconds / 5 minutes) and returns it to the OS stub resolver.',
    technicalDetail: 'The recursive resolver stores the response. TTL countdown begins. Response is a DNS Response packet: QR=1 (response), AA=0 (not authoritative — the recursive resolver is not auth for google.com), RA=1 (recursion available), ANCOUNT=1.',
    response: 'Answer: 142.250.64.46 (cached for 300s)',
    activeOSILayers: [7, 4, 3],
    direction: 'up',
    color: '#10b981',
  },
  {
    id: 'final',
    from: 'OS → Browser', to: 'TCP Connection to 142.250.64.46:443',
    fromIcon: '💻', toIcon: '🌐',
    label: 'Step 10: Application connects',
    description: 'The OS returns the IP to the browser. The browser now initiates a TCP connection (three-way handshake) to 142.250.64.46 on port 443 (HTTPS). DNS resolution is complete.',
    technicalDetail: 'Total DNS resolution time for a cold start: 50–300ms. With caching: <1ms. The resolved IP is passed to socket() → connect(). Browser may also use Happy Eyeballs (RFC 8305) to race IPv4 vs IPv6 connections.',
    response: 'IP: 142.250.64.46 → TCP SYN to :443',
    activeOSILayers: [7, 4, 3, 2, 1],
    direction: 'up',
    color: '#3b82f6',
  },
];

const REFERENCES: Reference[] = [
  { title: 'RFC 1034 – Domain Concepts and Facilities', url: 'https://www.rfc-editor.org/rfc/rfc1034', type: 'rfc', rfcNumber: 1034 },
  { title: 'RFC 1035 – Domain Implementation and Specification', url: 'https://www.rfc-editor.org/rfc/rfc1035', type: 'rfc', rfcNumber: 1035 },
  { title: 'RFC 4033 – DNS Security Introduction (DNSSEC)', url: 'https://www.rfc-editor.org/rfc/rfc4033', type: 'rfc', rfcNumber: 4033 },
  { title: 'RFC 8484 – DNS Queries over HTTPS (DoH)', url: 'https://www.rfc-editor.org/rfc/rfc8484', type: 'rfc', rfcNumber: 8484 },
  { title: 'RFC 7858 – DNS over TLS (DoT)', url: 'https://www.rfc-editor.org/rfc/rfc7858', type: 'rfc', rfcNumber: 7858 },
  { title: 'RFC 2308 – Negative Caching of DNS', url: 'https://www.rfc-editor.org/rfc/rfc2308', type: 'rfc', rfcNumber: 2308 },
  { title: 'AWS Route 53 Documentation', url: 'https://docs.aws.amazon.com/route53/', type: 'aws' },
  { title: 'Kubernetes DNS for Services and Pods', url: 'https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/', type: 'k8s' },
];

const DNS_RECORD_TYPES = [
  { type: 'A',     desc: 'Maps hostname → IPv4 address',                   rfc: 1035, example: 'google.com. 300 IN A 142.250.64.46' },
  { type: 'AAAA',  desc: 'Maps hostname → IPv6 address',                   rfc: 3596, example: 'google.com. 300 IN AAAA 2404:6800:4007::200e' },
  { type: 'CNAME', desc: 'Alias to another hostname (no IP, no apex)',     rfc: 1035, example: 'www.example.com. CNAME example.com.' },
  { type: 'MX',    desc: 'Mail exchange server with priority',             rfc: 1035, example: 'example.com. MX 10 mail.example.com.' },
  { type: 'NS',    desc: 'Delegates zone to nameserver',                   rfc: 1035, example: 'example.com. NS ns1.example.com.' },
  { type: 'PTR',   desc: 'Reverse DNS: IP → hostname',                    rfc: 1035, example: '46.64.250.142.in-addr.arpa. PTR google.com.' },
  { type: 'TXT',   desc: 'Arbitrary text (SPF, DKIM, DMARC, verification)',rfc: 1035, example: 'example.com. TXT "v=spf1 include:_spf.google.com ~all"' },
  { type: 'SOA',   desc: 'Start of Authority — zone metadata',            rfc: 1035, example: 'Serial, refresh, retry, expire, min-TTL' },
  { type: 'SRV',   desc: 'Service location: host + port + priority',      rfc: 2782, example: '_http._tcp.example.com. SRV 10 5 80 web.example.com.' },
];

export default function DNSPage() {
  const [activeTab, setActiveTab] = useState<'animation' | 'records' | 'quiz'>('animation');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('dns'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep((s) => {
          if (s >= DNS_STEPS.length - 1) {
            setIsPlaying(false);
            markAnimationCompleted('dns');
            return s;
          }
          return s + 1;
        });
      }, Math.round(1500 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const currentStep = DNS_STEPS[animStep];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-gradient">DNS Resolution</h1>
            <p className="text-sm text-slate-500 mt-0.5">Domain Name System · RFC 1034 / RFC 1035</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-green">Beginner</span>
            <span className="badge-blue">Application Layer</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            DNS is the internet's phone book. You know the name "google.com" but computers need an IP address like "142.250.64.46".
            DNS translates the name to the number — but instead of one big book, it's a distributed hierarchy of millions of servers.
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-white font-medium">Technical: </span>
            DNS (RFC 1034/1035) is a hierarchical, distributed naming system. Resolution uses a two-phase process:
            (1) <em>Recursive resolution</em> — the stub resolver sends one query and expects a full answer;
            (2) <em>Iterative resolution</em> — the recursive resolver follows referrals from root → TLD → authoritative NS.
            Responses are cached per TTL to reduce load. Queries are UDP/53 by default; TCP/53 for large responses.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        {(['animation', 'records', 'quiz'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'animation' ? '🔄 Resolution Flow' : tab === 'records' ? '📋 Record Types' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {/* ── Animation Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'animation' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying}
            currentStep={animStep}
            totalSteps={DNS_STEPS.length}
            speed={speed}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep((s) => Math.min(s + 1, DNS_STEPS.length - 1))}
            onStepBack={() => setAnimStep((s) => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed}
            stepLabel={currentStep.label}
          />

          {/* Main animation canvas */}
          <div className="canvas-bg rounded-2xl overflow-hidden border border-white/[0.06] p-6">
            {/* Flow diagram */}
            <div className="flex flex-col items-center space-y-2">
              {DNS_STEPS.map((step, idx) => {
                const isPast = idx < animStep;
                const isCurrent = idx === animStep;
                const isFuture = idx > animStep;

                return (
                  <div key={step.id} className="w-full max-w-2xl">
                    <motion.div
                      animate={{
                        opacity: isFuture ? 0.25 : 1,
                        scale: isCurrent ? 1.02 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3"
                      style={{
                        borderColor: isCurrent ? step.color : isPast ? `${step.color}30` : 'rgba(255,255,255,0.04)',
                        backgroundColor: isCurrent ? `${step.color}12` : isPast ? `${step.color}06` : 'rgba(255,255,255,0.02)',
                        boxShadow: isCurrent ? `0 0 20px ${step.color}20` : 'none',
                      }}
                    >
                      {/* Direction arrow */}
                      <div
                        className="shrink-0"
                        style={{ color: isCurrent ? step.color : 'rgba(255,255,255,0.2)' }}
                      >
                        {step.direction === 'down'
                          ? <ArrowDown size={16} />
                          : <ArrowUp size={16} />}
                      </div>

                      {/* From → To */}
                      <div className="flex items-center gap-1.5 text-sm shrink-0">
                        <span>{step.fromIcon}</span>
                        <span style={{ color: isCurrent ? '#e2e8f0' : '#64748b' }}>{step.from}</span>
                        <span className="text-slate-600">→</span>
                        <span>{step.toIcon}</span>
                        <span style={{ color: isCurrent ? step.color : '#64748b' }}>{step.to}</span>
                      </div>

                      {/* Query / Response badge */}
                      {isCurrent && step.queryType && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-auto text-[11px] font-mono bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 max-w-[30%] truncate"
                          title={step.queryType}
                        >
                          {step.queryType}
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Step connector line */}
                    {idx < DNS_STEPS.length - 1 && (
                      <div className="flex justify-center my-0.5">
                        <div
                          className="w-px h-3 transition-all duration-500"
                          style={{ backgroundColor: idx < animStep ? `${step.color}50` : 'rgba(255,255,255,0.05)' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current step detail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={animStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="glass-strong rounded-xl p-5 space-y-3"
              style={{ borderColor: `${currentStep.color}25` }}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-white">{currentStep.label}</h3>
                <div className="flex flex-wrap gap-1 shrink-0">
                  {currentStep.activeOSILayers.map((l) => (
                    <OSILayerBadge key={l} layer={l} size="sm" active />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{currentStep.description}</p>
              <div className="border-t border-white/[0.06] pt-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Info size={10} /> Technical Detail</p>
                <p className="text-xs text-slate-400 leading-relaxed">{currentStep.technicalDetail}</p>
              </div>
              {currentStep.response && (
                <div className="flex items-start gap-2 glass rounded-lg px-3 py-2">
                  <span className="text-emerald-400 text-xs font-medium shrink-0">Response:</span>
                  <code className="text-xs text-emerald-300">{currentStep.response}</code>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Cloud mapping */}
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">☁️ Cloud / Kubernetes DNS</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'AWS', value: 'Route 53 (authoritative + recursive resolver)', color: '#f97316' },
                { label: 'Azure', value: 'Azure DNS + Azure Private DNS Zones', color: '#60a5fa' },
                { label: 'GCP', value: 'Cloud DNS (managed authoritative)', color: '#34d399' },
                { label: 'Kubernetes', value: 'CoreDNS (cluster DNS resolver for service discovery)', color: '#818cf8' },
              ].map((item) => (
                <div key={item.label} className="glass rounded-lg p-2.5">
                  <div className="font-medium mb-1" style={{ color: item.color }}>{item.label}</div>
                  <div className="text-slate-400 leading-relaxed">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Record Types Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">DNS zone records — each record type serves a specific purpose. All defined in RFC 1035 unless noted.</p>
          <div className="grid gap-3">
            {DNS_RECORD_TYPES.map((record) => (
              <div key={record.type} className="glass rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-10 h-6 rounded font-bold font-mono text-xs flex items-center justify-center bg-electric-500/20 text-electric-300 border border-electric-500/30">
                      {record.type}
                    </span>
                    <span className="text-sm text-slate-300">{record.desc}</span>
                  </div>
                  <span className="badge-amber text-[10px] shrink-0">RFC {record.rfc}</span>
                </div>
                <code className="text-xs text-emerald-300 font-mono block mt-1">{record.example}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quiz Tab ──────────────────────────────────────────────────────────── */}
      {activeTab === 'quiz' && <Quiz topicId="dns" />}

      {/* Linux commands */}
      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock
        language="bash"
        filename="dns-commands.sh"
        code={`# Query A record for google.com
dig google.com A

# Full iterative resolution trace (follows the full path)
dig +trace google.com

# Query a specific nameserver
dig @8.8.8.8 google.com

# Reverse DNS lookup (PTR record)
dig -x 142.250.64.46

# Query MX records (mail servers)
dig google.com MX

# Query TXT records (SPF, DKIM, DMARC)
dig google.com TXT

# Check system resolver configuration
cat /etc/resolv.conf
resolvectl status            # systemd-resolved

# Flush DNS cache (systemd-resolved)
sudo resolvectl flush-caches

# View resolver statistics
resolvectl statistics

# nslookup (older tool, still common)
nslookup google.com
nslookup -type=MX google.com 8.8.8.8

# Capture DNS traffic
sudo tcpdump -i eth0 -n port 53`}
      />

      <div className="mt-8">
        <ReferencePanel references={REFERENCES} />
      </div>
    </div>
  );
}
