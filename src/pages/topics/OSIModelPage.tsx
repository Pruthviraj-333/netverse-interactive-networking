import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, Info, ArrowDown, ArrowUp } from 'lucide-react';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import AnimationControls from '../../components/shared/AnimationControls';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { useProgress } from '../../stores';
import { osiLayerColor } from '../../utils/helpers';
import type { Reference } from '../../types';

// ─── OSI Layer data ───────────────────────────────────────────────────────────
const OSI_LAYERS = [
  {
    number: 7,
    name: 'Application',
    pdu: 'Data',
    role: 'Provides network services directly to user applications. Defines communication protocols and interface to the network.',
    protocols: ['HTTP/HTTPS', 'DNS', 'FTP', 'SMTP', 'SSH', 'DHCP', 'SNMP'],
    devices: ['Application Servers', 'Web Browsers', 'API Gateways'],
    techDetail: 'Layer 7 is not the application itself, but the interface the application uses to communicate over the network. REST APIs, gRPC, WebSocket all operate here.',
    realWorld: 'When your browser sends an HTTP GET request to google.com, it is creating a Layer 7 message.',
    cloudExample: 'AWS Application Load Balancer (ALB) operates at Layer 7 — it can inspect HTTP headers, cookies, and URLs to make routing decisions.',
  },
  {
    number: 6,
    name: 'Presentation',
    pdu: 'Data',
    role: 'Data translation, encryption, and compression. Ensures data is in a usable format for the Application layer.',
    protocols: ['TLS/SSL', 'JPEG', 'MPEG', 'ASCII', 'Unicode'],
    devices: ['Proxies (TLS termination)'],
    techDetail: 'TLS (Transport Layer Security) is often called a Layer 6/7 protocol. It handles encryption/decryption and certificate-based authentication. In practice, TLS sits between TCP and HTTP.',
    realWorld: 'When you visit https://github.com, TLS encrypts your HTTP traffic. The server decrypts it at this layer before passing plaintext to Layer 7.',
    cloudExample: 'AWS ACM (Certificate Manager) manages TLS certificates. Kubernetes Ingress controllers terminate TLS at this conceptual layer.',
  },
  {
    number: 5,
    name: 'Session',
    pdu: 'Data',
    role: 'Manages sessions: establishment, maintenance, synchronisation, and termination between applications.',
    protocols: ['NetBIOS', 'RPC', 'PPTP', 'L2TP'],
    devices: ['Session Managers'],
    techDetail: 'In modern TCP/IP, session management is handled implicitly by TCP connections. HTTP/2 multiplexes multiple streams over a single TCP connection — this is Layer 5 functionality.',
    realWorld: 'An SSH session. When your connection drops, SSH can resume (reconnect) — this session state is Layer 5.',
    cloudExample: 'gRPC streams, WebSockets, and HTTP/2 server push all involve Layer 5 session management.',
  },
  {
    number: 4,
    name: 'Transport',
    pdu: 'Segment (TCP) / Datagram (UDP)',
    role: 'End-to-end communication, flow control, error recovery, and port-based multiplexing.',
    protocols: ['TCP', 'UDP', 'SCTP', 'QUIC'],
    devices: ['Firewalls (stateful)', 'Load Balancers (L4)'],
    techDetail: 'TCP (RFC 9293) provides reliable, ordered, connection-oriented delivery. UDP (RFC 768) is connectionless, best-effort. Port numbers (0–65535) identify the specific service. Well-known ports: 80 (HTTP), 443 (HTTPS), 22 (SSH), 53 (DNS).',
    realWorld: 'TCP three-way handshake before data flows. UDP for DNS queries, video streaming, gaming.',
    cloudExample: 'AWS Network Load Balancer (NLB) operates at Layer 4. iptables/nftables rules on Linux work at Layer 3/4.',
  },
  {
    number: 3,
    name: 'Network',
    pdu: 'Packet',
    role: 'Logical addressing (IP), routing between networks, and path determination.',
    protocols: ['IPv4', 'IPv6', 'ICMP', 'BGP', 'OSPF', 'EIGRP', 'ARP*'],
    devices: ['Routers', 'Layer 3 Switches', 'Firewalls'],
    techDetail: 'IPv4 (RFC 791) uses 32-bit addresses; IPv6 (RFC 8200) uses 128-bit. Routing tables determine next-hop. TTL (Time To Live) prevents packets looping forever. ICMP (RFC 792) reports network errors (ping, traceroute).',
    realWorld: 'When a packet leaves your home router to reach google.com, it traverses multiple routers. Each router makes a Layer 3 forwarding decision based on the destination IP.',
    cloudExample: 'AWS Route Tables, VPC subnets, Azure Route Tables, GCP VPC routes — all Layer 3 constructs. Linux: ip route show.',
  },
  {
    number: 2,
    name: 'Data Link',
    pdu: 'Frame',
    role: 'Node-to-node delivery within the same network segment using MAC addresses. Error detection via CRC.',
    protocols: ['Ethernet (IEEE 802.3)', '802.11 (Wi-Fi)', 'PPP', 'VLAN (802.1Q)'],
    devices: ['Switches', 'Bridges', 'Network Interface Cards (NICs)'],
    techDetail: 'Ethernet frames include: Preamble (7 bytes), SFD (1 byte), Dst MAC (6 bytes), Src MAC (6 bytes), EtherType (2 bytes), Payload (46–1500 bytes), FCS/CRC (4 bytes). Max frame size (MTU) is 1500 bytes for standard Ethernet.',
    realWorld: 'Your laptop sends an ARP Request to learn the gateway MAC. The switch forwards frames by MAC table lookup. CRC detects bit errors on the wire.',
    cloudExample: 'AWS Elastic Network Interface (ENI) has a MAC. VLANs separate broadcast domains. Kubernetes pod-to-pod on the same node is a Layer 2 operation via a bridge.',
  },
  {
    number: 1,
    name: 'Physical',
    pdu: 'Bit / Symbol',
    role: 'Transmission of raw bit streams over a physical medium (copper, fibre, radio).',
    protocols: ['Ethernet (physical: 1000BASE-T, 10GBASE-SR)', '802.11 radio', 'Fibre optic'],
    devices: ['Hubs', 'Repeaters', 'Cables', 'NICs (physical)', 'Transceivers'],
    techDetail: 'Defines electrical/optical/radio characteristics: voltage levels, timing, modulation. Copper: Manchester encoding, PAM-4. Fibre: single-mode (long range, 1310/1550nm) vs multi-mode (short range, 850nm). Duplex: half (one direction at a time) vs full (simultaneous).',
    realWorld: 'The RJ45 cable connecting your switch. 10GBASE-SR fibre in a data centre. Wi-Fi radio signals.',
    cloudExample: 'AWS Direct Connect uses physical fibre to your data centre. In software (containers), Layer 1 is abstracted — veth pairs and bridges replace physical cables.',
  },
];

// ─── Encapsulation animation steps ───────────────────────────────────────────
const ENCAP_STEPS = [
  { layer: 7, action: 'encap', label: 'App creates HTTP request: "GET / HTTP/1.1"', header: 'HTTP Header + Payload' },
  { layer: 6, action: 'encap', label: 'TLS encrypts payload', header: 'TLS Record' },
  { layer: 5, action: 'encap', label: 'Session ID added', header: 'Session Data' },
  { layer: 4, action: 'encap', label: 'TCP adds src:port 54321, dst:port 443, SEQ, ACK', header: 'TCP Header' },
  { layer: 3, action: 'encap', label: 'IP adds src:10.0.0.1, dst:142.250.64.46, TTL:64', header: 'IP Header' },
  { layer: 2, action: 'encap', label: 'Ethernet adds src MAC, dst MAC (gateway), CRC', header: 'Ethernet Frame' },
  { layer: 1, action: 'encap', label: 'Bits transmitted as electrical/optical signals', header: 'Bits on wire' },
];

const REFERENCES: Reference[] = [
  { title: 'ISO/IEC 7498-1 – OSI Reference Model', url: 'https://www.iso.org/standard/20269.html', type: 'official', description: 'The original OSI model specification' },
  { title: 'RFC 791 – Internet Protocol (IPv4)', url: 'https://www.rfc-editor.org/rfc/rfc791', type: 'rfc', rfcNumber: 791, description: 'Layer 3 protocol specification' },
  { title: 'RFC 9293 – Transmission Control Protocol', url: 'https://www.rfc-editor.org/rfc/rfc9293', type: 'rfc', rfcNumber: 9293, description: 'Layer 4 TCP specification (2022 update)' },
  { title: 'Cisco OSI Model Reference', url: 'https://www.cisco.com/c/en/us/support/docs/routers/12400-series-internet-routers/8771-40.html', type: 'cisco', description: 'Cisco\'s OSI model overview' },
  { title: 'IEEE 802.3 Ethernet Standard', url: 'https://standards.ieee.org/ieee/802.3', type: 'official', description: 'Layer 2 Ethernet specification' },
];

export default function OSIModelPage() {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState<'explore' | 'encapsulation' | 'quiz'>('explore');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => {
    markTopicViewed('osi-model');
  }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep((s) => {
          if (s >= ENCAP_STEPS.length - 1) {
            setIsPlaying(false);
            markAnimationCompleted('osi-model');
            return s;
          }
          return s + 1;
        });
      }, Math.round(1200 / speed));
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const selectedLayerData = selectedLayer !== null
    ? OSI_LAYERS.find((l) => l.number === selectedLayer) ?? null
    : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Layers size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-gradient-violet">OSI Model</h1>
            <p className="text-sm text-slate-500 mt-0.5">Open Systems Interconnection · ISO/IEC 7498-1</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-green">Beginner</span>
            <span className="badge-violet">Fundamentals</span>
          </div>
        </div>

        {/* Simple explanation */}
        <div className="glass rounded-xl p-5 mb-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-white font-medium">Simple explanation: </span>
            Imagine mailing a letter. You write the message (Layer 7), put it in an envelope with an address (Layers 4–3),
            the post office adds routing labels (Layer 3), a truck delivers it (Layers 2–1).
            Each layer only "speaks" to the layer directly above and below it.
            The OSI model divides networking into 7 standardised layers so any vendor's product can interoperate with another's.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-white font-medium">Technical explanation: </span>
            ISO/IEC 7498-1 defines the OSI Reference Model as a conceptual framework for network communication.
            Each layer provides services to the layer above via a Service Access Point (SAP) and uses services from the layer below.
            Data is encapsulated at each layer (headers added going down), and decapsulated at the peer receiver (headers stripped going up).
            The model is descriptive — real TCP/IP protocols often span multiple OSI layers (e.g., TLS spans Layers 5–6).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        {(['explore', 'encapsulation', 'quiz'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}
          >
            {tab === 'explore' ? '🔍 Explore Layers' : tab === 'encapsulation' ? '📦 Encapsulation' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {/* ── Explore Layers Tab ───────────────────────────────────────────────── */}
      {activeTab === 'explore' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Layer stack */}
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Click a layer to explore</p>
            {OSI_LAYERS.map((layer) => {
              const color = osiLayerColor(layer.number);
              const active = selectedLayer === layer.number;

              return (
                <motion.button
                  key={layer.number}
                  onClick={() => setSelectedLayer(active ? null : layer.number)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: active ? color : 'rgba(255,255,255,0.06)',
                    backgroundColor: active ? `${color}12` : 'rgba(255,255,255,0.02)',
                    boxShadow: active ? `0 0 15px ${color}20` : 'none',
                  }}
                >
                  {/* Number badge */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg font-mono shrink-0 transition-all"
                    style={{
                      backgroundColor: active ? color : `${color}20`,
                      color: active ? '#fff' : color,
                    }}
                  >
                    {layer.number}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${active ? 'text-white' : 'text-slate-300'}`}>
                        {layer.name}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-mono border"
                        style={{ color: `${color}cc`, borderColor: `${color}30`, backgroundColor: `${color}10` }}
                      >
                        {layer.pdu.split(' ')[0]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{layer.protocols.slice(0, 3).join(', ')}</div>
                  </div>

                  <motion.div animate={{ rotate: active ? 180 : 0 }}>
                    <ChevronDown size={14} className="text-slate-500" />
                  </motion.div>
                </motion.button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="sticky top-4">
            <AnimatePresence mode="wait">
              {selectedLayerData ? (
                <motion.div
                  key={selectedLayerData.number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-strong rounded-2xl p-5 space-y-4"
                  style={{ borderColor: `${osiLayerColor(selectedLayerData.number)}30` }}
                >
                  <div className="flex items-center gap-3">
                    <OSILayerBadge layer={selectedLayerData.number} size="lg" active />
                    <div>
                      <h3 className="text-white font-bold">{selectedLayerData.name} Layer</h3>
                      <p className="text-xs text-slate-500">PDU: {selectedLayerData.pdu}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">{selectedLayerData.role}</p>

                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Protocols</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLayerData.protocols.map((p) => (
                        <span key={p} className="badge-slate text-xs">{p}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Devices</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLayerData.devices.map((d) => (
                        <span key={d} className="badge-blue text-xs">{d}</span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-3">
                    <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                      <Info size={11} /> Technical Detail
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">{selectedLayerData.techDetail}</p>
                  </div>

                  <div className="glass rounded-lg px-3 py-2.5">
                    <p className="text-xs text-slate-500 mb-1">☁️ Cloud / DevOps</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{selectedLayerData.cloudExample}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-2xl p-8 text-center"
                >
                  <Layers size={36} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Select a layer to explore its details, protocols, and cloud relevance.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Encapsulation Tab ────────────────────────────────────────────────── */}
      {activeTab === 'encapsulation' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-4 text-sm text-slate-300">
            <span className="text-white font-medium">Encapsulation</span> is the process of adding headers (and trailers)
            at each OSI layer as data travels down the stack before transmission.
            <span className="text-electric-400"> Decapsulation</span> is the reverse — headers are stripped at the receiver.
          </div>

          <AnimationControls
            isPlaying={isPlaying}
            currentStep={animStep}
            totalSteps={ENCAP_STEPS.length}
            speed={speed}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep((s) => Math.min(s + 1, ENCAP_STEPS.length - 1))}
            onStepBack={() => setAnimStep((s) => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed}
            stepLabel={ENCAP_STEPS[animStep]?.label}
          />

          {/* Visual encapsulation stack */}
          <div className="flex flex-col items-center space-y-2">
            {ENCAP_STEPS.slice(0, animStep + 1).map((step, i) => {
              const color = osiLayerColor(step.layer);
              const isActive = i === animStep;

              return (
                <motion.div
                  key={step.layer}
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="w-full max-w-lg rounded-xl border px-5 py-3 transition-all"
                  style={{
                    borderColor: isActive ? color : `${color}30`,
                    backgroundColor: isActive ? `${color}15` : `${color}05`,
                    boxShadow: isActive ? `0 0 20px ${color}25` : 'none',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono"
                        style={{ backgroundColor: isActive ? color : `${color}30`, color: isActive ? '#fff' : color }}
                      >
                        {step.layer}
                      </span>
                      <span className="text-sm font-medium" style={{ color: isActive ? '#fff' : `${color}cc` }}>
                        {step.header}
                      </span>
                    </div>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-slate-400 max-w-[50%] text-right"
                      >
                        {step.label}
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Arrows */}
            {animStep > 0 && (
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-electric-400">
                  <ArrowDown size={14} />
                  <span>Sender (encapsulate)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <ArrowUp size={14} />
                  <span>Receiver (decapsulate)</span>
                </div>
              </div>
            )}
          </div>

          {/* Mnemonic */}
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Mnemonic (top to bottom)</p>
            <div className="flex flex-wrap gap-2">
              {[
                ['A', 'All', 'Application'],
                ['P', 'People', 'Presentation'],
                ['S', 'Seem', 'Session'],
                ['T', 'To', 'Transport'],
                ['N', 'Need', 'Network'],
                ['D', 'Data', 'Data Link'],
                ['P', 'Processing', 'Physical'],
              ].map(([letter, word, layer]) => (
                <div key={layer} className="glass rounded-lg px-2.5 py-1.5 text-center">
                  <div className="text-electric-400 font-bold text-lg leading-none">{letter}</div>
                  <div className="text-slate-300 text-[11px]">{word}</div>
                  <div className="text-slate-600 text-[10px]">{layer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Quiz Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'quiz' && <Quiz topicId="osi-model" />}

      {/* Linux commands */}
      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <div className="space-y-3">
        <p className="text-sm text-slate-400">Observe OSI layers in action on Linux:</p>
        <CodeBlock
          language="bash"
          filename="linux-networking.sh"
          code={`# Layer 1/2 – Check interface and MAC address
ip link show eth0
ethtool eth0           # duplex, speed, link detected

# Layer 2 – ARP cache (IP → MAC mappings)
ip neigh show
arp -n

# Layer 3 – IP addresses and routing table
ip addr show
ip route show
ip route get 8.8.8.8   # which interface and next-hop for this destination

# Layer 4 – Active TCP/UDP connections and socket states
ss -tan                # TCP sockets (-t) all (-a) with numeric ports (-n)
ss -s                  # socket summary

# Layer 7 – DNS resolution (Application layer)
dig google.com A
dig +trace google.com  # follow full resolution path

# Packet capture across all layers (Wireshark CLI)
sudo tcpdump -i eth0 -n -v 'host 8.8.8.8'`}
        />
      </div>

      {/* References */}
      <div className="mt-8">
        <ReferencePanel references={REFERENCES} />
      </div>
    </div>
  );
}
