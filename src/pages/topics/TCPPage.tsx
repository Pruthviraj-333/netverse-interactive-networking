import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Info, ArrowRight } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import TopicFooterNav from '../../components/common/TopicFooterNav';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

// ─── TCP Handshake animation steps ────────────────────────────────────────────
interface TCPStep {
  id: string;
  label: string;
  description: string;
  technicalDetail: string;
  from: 'client' | 'server';
  message: string;
  flags: string[];
  seq?: number;
  ack?: number;
  state: { client: string; server: string };
  color: string;
  phase: 'connect' | 'data' | 'close';
}

const TCP_STEPS: TCPStep[] = [
  // ── Connection establishment ──────────────────────────────────────────────
  {
    id: 'syn',
    label: 'SYN — Connection Initiation',
    description: 'Client sends SYN (Synchronize) to the server. This initiates connection establishment and advertises the client\'s Initial Sequence Number (ISN).',
    technicalDetail: 'RFC 9293 §3.5: The client picks a random ISN (e.g., ISN_C=1000). The SYN flag is set. SYN consumes one sequence number. No data is sent yet. The client enters SYN-SENT state.',
    from: 'client',
    message: 'SYN',
    flags: ['SYN'],
    seq: 1000,
    state: { client: 'SYN_SENT', server: 'LISTEN' },
    color: '#3b82f6',
    phase: 'connect',
  },
  {
    id: 'syn-ack',
    label: 'SYN-ACK — Server Acknowledges',
    description: 'Server acknowledges the client\'s SYN and sends its own SYN. Both SYN and ACK flags are set. The server sends its own ISN.',
    technicalDetail: 'Server ACK = ISN_C + 1 = 1001 (acknowledging SYN). Server picks its own ISN_S = 5000. SYN-ACK consumes one sequence number. Server transitions from LISTEN → SYN-RECEIVED. Client transitions SYN-SENT → ESTABLISHED upon receiving SYN-ACK.',
    from: 'server',
    message: 'SYN-ACK',
    flags: ['SYN', 'ACK'],
    seq: 5000,
    ack: 1001,
    state: { client: 'ESTABLISHED', server: 'SYN_RECEIVED' },
    color: '#10b981',
    phase: 'connect',
  },
  {
    id: 'ack',
    label: 'ACK — Connection Established',
    description: 'Client acknowledges the server\'s SYN. After this ACK, the connection is fully established in ESTABLISHED state on both sides. Data transfer can begin.',
    technicalDetail: 'Client ACK = ISN_S + 1 = 5001. ACK does NOT consume a sequence number (no data). Client SEQ = ISN_C + 1 = 1001 (after SYN). Both sides enter ESTABLISHED state. The three-way handshake is complete per RFC 9293 §3.5.',
    from: 'client',
    message: 'ACK',
    flags: ['ACK'],
    seq: 1001,
    ack: 5001,
    state: { client: 'ESTABLISHED', server: 'ESTABLISHED' },
    color: '#10b981',
    phase: 'connect',
  },
  // ── Data transfer ────────────────────────────────────────────────────────
  {
    id: 'data',
    label: 'Data Transfer',
    description: 'After establishment, both sides can send data. TCP segments carry application data with sequence and acknowledgment numbers for ordered, reliable delivery.',
    technicalDetail: 'PSH flag tells receiver to deliver data to application immediately. Data size is limited by MSS (Maximum Segment Size) ≈ MTU - IP header - TCP header = 1500-20-20 = 1460 bytes. Window size controls how much unacknowledged data can be in flight (flow control).',
    from: 'client',
    message: 'HTTP GET / (PSH+ACK)',
    flags: ['PSH', 'ACK'],
    seq: 1001,
    ack: 5001,
    state: { client: 'ESTABLISHED', server: 'ESTABLISHED' },
    color: '#8b5cf6',
    phase: 'data',
  },
  // ── Connection termination ────────────────────────────────────────────────
  {
    id: 'fin1',
    label: 'FIN — Active Close Initiated',
    description: 'The active closer (client or server) sends FIN to indicate it has no more data to send. This is a graceful, half-close — the other side can still send data.',
    technicalDetail: 'FIN consumes one sequence number. The sending side enters FIN-WAIT-1. The receiving side can still send data — TCP is full-duplex. RFC 9293 §3.10.7: Four-way handshake for termination. Each direction is closed independently.',
    from: 'client',
    message: 'FIN',
    flags: ['FIN', 'ACK'],
    seq: 1100,
    ack: 5201,
    state: { client: 'FIN_WAIT_1', server: 'ESTABLISHED' },
    color: '#f59e0b',
    phase: 'close',
  },
  {
    id: 'fin-ack',
    label: 'ACK — Passive Close Acknowledges FIN',
    description: 'Server acknowledges the client\'s FIN. The client-to-server direction is now closed. Server can still send data. Client enters FIN-WAIT-2.',
    technicalDetail: 'ACK = FIN seq + 1. Server enters CLOSE-WAIT. Client enters FIN-WAIT-2. The server application must now close its own send side (calling close() in the OS).',
    from: 'server',
    message: 'ACK',
    flags: ['ACK'],
    seq: 5201,
    ack: 1101,
    state: { client: 'FIN_WAIT_2', server: 'CLOSE_WAIT' },
    color: '#f59e0b',
    phase: 'close',
  },
  {
    id: 'fin2',
    label: 'FIN — Server Closes Its Direction',
    description: 'Server sends its own FIN, closing the server-to-client direction. Server enters LAST-ACK waiting for the client\'s final ACK.',
    technicalDetail: 'Server application calls close(). Kernel sends FIN. Server enters LAST-ACK. If the server sends FIN very quickly after the ACK, steps fin-ack and fin2 may be combined into a single FIN-ACK packet, making termination appear three-way.',
    from: 'server',
    message: 'FIN',
    flags: ['FIN', 'ACK'],
    seq: 5201,
    ack: 1101,
    state: { client: 'FIN_WAIT_2', server: 'LAST_ACK' },
    color: '#f59e0b',
    phase: 'close',
  },
  {
    id: 'fin-final',
    label: 'ACK — TIME_WAIT Begins',
    description: 'Client sends final ACK. Client enters TIME_WAIT for 2×MSL (60–120 seconds) before the socket is fully closed. Server enters CLOSED upon receiving this ACK.',
    technicalDetail: 'RFC 9293 §3.10.7: TIME_WAIT exists for two reasons: (1) ensure the final ACK reaches the server — if lost, server retransmits FIN and client resends ACK; (2) allow old duplicate segments from this connection to expire before a new connection with the same 4-tuple. MSL = 30–60s typically.',
    from: 'client',
    message: 'ACK (final)',
    flags: ['ACK'],
    seq: 1101,
    ack: 5202,
    state: { client: 'TIME_WAIT → CLOSED', server: 'CLOSED' },
    color: '#f43f5e',
    phase: 'close',
  },
];

const TCP_FLAGS_INFO = [
  { flag: 'SYN', bit: 1, desc: 'Synchronize sequence numbers — initiates connection', color: '#3b82f6' },
  { flag: 'ACK', bit: 1, desc: 'Acknowledgment field is significant — confirms receipt', color: '#10b981' },
  { flag: 'FIN', bit: 1, desc: 'No more data from sender — initiates graceful close', color: '#f59e0b' },
  { flag: 'RST', bit: 1, desc: 'Reset the connection — abortive close, no handshake', color: '#f43f5e' },
  { flag: 'PSH', bit: 1, desc: 'Push data to application immediately, bypass buffer', color: '#8b5cf6' },
  { flag: 'URG', bit: 1, desc: 'Urgent pointer field significant (rarely used)', color: '#64748b' },
  { flag: 'ECE', bit: 1, desc: 'ECN Echo — Explicit Congestion Notification (RFC 3168)', color: '#06b6d4' },
  { flag: 'CWR', bit: 1, desc: 'Congestion Window Reduced — respond to ECN (RFC 3168)', color: '#06b6d4' },
];

const REFERENCES: Reference[] = [
  { title: 'RFC 9293 – Transmission Control Protocol (2022)', url: 'https://www.rfc-editor.org/rfc/rfc9293', type: 'rfc', rfcNumber: 9293, description: 'Current TCP specification, obsoletes RFC 793' },
  { title: 'RFC 3168 – ECN for IP and TCP', url: 'https://www.rfc-editor.org/rfc/rfc3168', type: 'rfc', rfcNumber: 3168 },
  { title: 'RFC 1122 – Requirements for Internet Hosts', url: 'https://www.rfc-editor.org/rfc/rfc1122', type: 'rfc', rfcNumber: 1122 },
  { title: 'Linux TCP implementation (net/ipv4/tcp.c)', url: 'https://elixir.bootlin.com/linux/latest/source/net/ipv4/tcp.c', type: 'linux' },
];

function PacketBadge({ flags, seq, ack, color }: { flags: string[]; seq?: number; ack?: number; color: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs"
      style={{ borderColor: `${color}40`, backgroundColor: `${color}12`, color }}
    >
      <div className="flex gap-1">
        {flags.map((f) => (
          <span key={f} className="px-1 py-0.5 rounded text-[10px] font-bold border"
            style={{ borderColor: `${color}60`, backgroundColor: `${color}20` }}>
            {f}
          </span>
        ))}
      </div>
      {seq !== undefined && <span className="text-slate-400">SEQ={seq}</span>}
      {ack !== undefined && <span className="text-slate-400">ACK={ack}</span>}
    </div>
  );
}

export default function TCPPage() {
  const [activeTab, setActiveTab] = useState<'handshake' | 'flags' | 'quiz'>('handshake');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('tcp'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep((s) => {
          if (s >= TCP_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('tcp'); return s; }
          return s + 1;
        });
      }, Math.round(1400 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const currentStep = TCP_STEPS[animStep];
  const phaseLabels = { connect: '🤝 Handshake', data: '📦 Data', close: '👋 Termination' };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Activity size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-gradient">TCP — Transmission Control Protocol</h1>
            <p className="text-sm text-slate-500 mt-0.5">Transport Layer · RFC 9293 (2022)</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-blue">Transport L4</span>
            <span className="badge-amber">Intermediate</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            TCP is like certified mail — it guarantees the parcel arrives, in order, exactly once.
            Before sending anything, both sides exchange three messages to agree on the connection (handshake).
            When done, four messages are exchanged to close gracefully.
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (RFC 9293): </span>
            TCP is a connection-oriented, reliable, full-duplex, byte-stream protocol.
            It uses sequence numbers for ordered delivery, ACKs for reliability, window sizes for flow control,
            and a slow-start/congestion-avoidance algorithm for network stability.
            A TCP connection is uniquely identified by a 4-tuple: (src IP, src port, dst IP, dst port).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        {(['handshake', 'flags', 'quiz'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'handshake' ? '🤝 Connection Lifecycle' : tab === 'flags' ? '🚩 TCP Flags' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {/* ── Handshake Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'handshake' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying}
            currentStep={animStep}
            totalSteps={TCP_STEPS.length}
            speed={speed}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep((s) => Math.min(s + 1, TCP_STEPS.length - 1))}
            onStepBack={() => setAnimStep((s) => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed}
            stepLabel={currentStep.label}
          />

          {/* Canvas */}
          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6 overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Client / Server headers */}
              <div className="grid grid-cols-3 mb-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 glass rounded-lg px-4 py-2">
                    <span className="text-2xl">💻</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Client</div>
                      <div className="text-[10px] font-mono" style={{ color: currentStep.state.client === 'ESTABLISHED' ? '#10b981' : '#f59e0b' }}>
                        {currentStep.state.client}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-xs text-slate-600 uppercase tracking-widest">
                    {phaseLabels[currentStep.phase]}
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 glass rounded-lg px-4 py-2">
                    <span className="text-2xl">🖥️</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Server</div>
                      <div className="text-[10px] font-mono" style={{ color: currentStep.state.server === 'ESTABLISHED' ? '#10b981' : '#f59e0b' }}>
                        {currentStep.state.server}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline lines */}
              <div className="flex gap-2">
                <div className="w-px bg-white/[0.08] mx-auto" style={{ minHeight: `${TCP_STEPS.length * 52}px` }} />
                <div className="flex-1 space-y-2">
                  {TCP_STEPS.map((step, idx) => {
                    const isPast = idx < animStep;
                    const isCurrent = idx === animStep;

                    return (
                      <motion.div
                        key={step.id}
                        animate={{ opacity: idx > animStep ? 0.2 : 1 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-3 items-center gap-2"
                      >
                        {/* Client side */}
                        <div className="flex justify-end">
                          {step.from === 'client' && (
                            <motion.div
                              initial={isCurrent ? { x: -20, opacity: 0 } : false}
                              animate={{ x: 0, opacity: 1 }}
                            >
                              <PacketBadge flags={step.flags} seq={step.seq} ack={step.ack} color={step.color} />
                            </motion.div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-1 w-full">
                            <div className="flex-1 h-px" style={{ backgroundColor: isCurrent ? step.color : isPast ? `${step.color}40` : 'rgba(255,255,255,0.05)' }} />
                            <ArrowRight
                              size={14}
                              style={{
                                color: isCurrent ? step.color : isPast ? `${step.color}60` : '#1e293b',
                                transform: step.from === 'server' ? 'scaleX(-1)' : 'none',
                              }}
                            />
                            <div className="flex-1 h-px" style={{ backgroundColor: isCurrent ? step.color : isPast ? `${step.color}40` : 'rgba(255,255,255,0.05)' }} />
                          </div>
                        </div>

                        {/* Server side */}
                        <div className="flex justify-start">
                          {step.from === 'server' && (
                            <motion.div
                              initial={isCurrent ? { x: 20, opacity: 0 } : false}
                              animate={{ x: 0, opacity: 1 }}
                            >
                              <PacketBadge flags={step.flags} seq={step.seq} ack={step.ack} color={step.color} />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="w-px bg-white/[0.08] mx-auto" />
              </div>
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
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-white">{currentStep.label}</h3>
                <OSILayerBadge layer={4} size="sm" active />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{currentStep.description}</p>
              <div className="border-t border-white/[0.06] pt-3">
                <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1"><Info size={10} /> Technical (RFC 9293)</p>
                <p className="text-xs text-slate-400 leading-relaxed">{currentStep.technicalDetail}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Flags Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'flags' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">TCP control bits in the 14-bit Flags field (RFC 9293 §3.1). Each is a single bit in the TCP header.</p>
          <div className="grid gap-2">
            {TCP_FLAGS_INFO.map((f) => (
              <div key={f.flag} className="glass rounded-xl px-4 py-3 flex items-start gap-3">
                <div
                  className="w-10 h-7 rounded font-bold font-mono text-xs flex items-center justify-center border shrink-0"
                  style={{ borderColor: `${f.color}40`, backgroundColor: `${f.color}15`, color: f.color }}
                >
                  {f.flag}
                </div>
                <div>
                  <p className="text-sm text-slate-300">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* TCP Header diagram */}
          <div className="glass rounded-xl p-4 mt-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">TCP Header Structure (RFC 9293 §3.1)</p>
            <div className="font-mono text-xs text-slate-400 leading-loose overflow-x-auto">
              <pre>{`
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Acknowledgment Number                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Data |       |C|E|U|A|P|R|S|F|                               |
| Offset| Rsrvd |W|C|R|C|S|S|Y|I|            Window             |
|       |       |R|E|G|K|H|T|N|N|                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|           Checksum            |         Urgent Pointer        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Options                    |    Padding    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                             data                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
              `.trim()}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Quiz Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'quiz' && <Quiz topicId="tcp" />}

      {/* Linux commands */}
      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock
        language="bash"
        filename="tcp-commands.sh"
        code={`# View TCP connections and socket states
ss -tan                    # TCP all sockets, numeric
ss -tnp                    # TCP, with process info
ss -tan state ESTABLISHED  # only ESTABLISHED
ss -tan state TIME-WAIT    # TIME_WAIT sockets (after close)

# netstat (older, may not be installed)
netstat -tn

# Count TIME_WAIT sockets (common in high-traffic servers)
ss -tan | grep TIME-WAIT | wc -l

# Capture TCP handshake with tcpdump
sudo tcpdump -i eth0 -n 'tcp[tcpflags] & (tcp-syn) != 0'

# Full TCP session capture to file
sudo tcpdump -i eth0 -n -w /tmp/tcp.pcap port 443

# Tune TIME_WAIT (NOT recommended to disable — see RFC 9293)
cat /proc/sys/net/ipv4/tcp_tw_reuse   # reuse TIME_WAIT sockets

# Check TCP window scaling and congestion algorithm
sysctl net.ipv4.tcp_window_scaling
sysctl net.ipv4.tcp_congestion_control   # usually 'cubic' or 'bbr'

# Test TCP connection manually
nc -zv google.com 443    # test TCP connectivity to port 443`}
      />

      <div className="mt-8">
        <ReferencePanel references={REFERENCES} />
      </div>

      <TopicFooterNav currentTopicId="tcp" />
    </div>
  );
}

