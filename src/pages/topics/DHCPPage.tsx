import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Info, Radio } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

interface DHCPStep {
  id: string;
  label: string;
  msgType: string;
  from: string;
  to: string;
  fromIcon: string;
  toIcon: string;
  type: 'broadcast' | 'unicast';
  description: string;
  technicalDetail: string;
  packet: string;
  color: string;
}

const DHCP_STEPS: DHCPStep[] = [
  {
    id: 'discover',
    label: 'Step 1 — DHCPDISCOVER',
    msgType: 'DHCPDISCOVER',
    from: 'Client', to: 'Broadcast',
    fromIcon: '💻', toIcon: '📡',
    type: 'broadcast',
    description: 'Client has no IP. It broadcasts a DHCPDISCOVER on the network asking "Is there a DHCP server? I need an IP address."',
    technicalDetail: 'UDP: src=0.0.0.0:68, dst=255.255.255.255:67. Ethernet dst=FF:FF:FF:FF:FF:FF. DHCP Option 53=1 (Discover). Client sends its MAC in the chaddr field. xid (transaction ID) is random and used to match offer/request/ack. RFC 2131 §3.1.',
    packet: 'UDP 0.0.0.0:68 → 255.255.255.255:67  [DHCPDISCOVER]  xid=0xA1B2C3D4  chaddr=AA:BB:CC:11:22:33',
    color: '#f59e0b',
  },
  {
    id: 'offer',
    label: 'Step 2 — DHCPOFFER',
    msgType: 'DHCPOFFER',
    from: 'DHCP Server', to: 'Client',
    fromIcon: '🖥️', toIcon: '💻',
    type: 'broadcast',
    description: 'DHCP server reserves an IP and responds with a DHCPOFFER containing the offered IP, subnet mask, gateway, DNS, and lease time.',
    technicalDetail: 'UDP: src=192.168.1.1:67, dst=255.255.255.255:68 (broadcast — client has no IP yet). DHCP Option 53=2 (Offer), Option 51=lease time (86400s), Option 1=mask, Option 3=router, Option 6=DNS. The offered IP is in the yiaddr field. RFC 2132 defines all options.',
    packet: 'UDP 192.168.1.1:67 → 255.255.255.255:68  [DHCPOFFER]  yiaddr=192.168.1.100  lease=86400s  mask=255.255.255.0  gw=192.168.1.1  dns=8.8.8.8',
    color: '#3b82f6',
  },
  {
    id: 'request',
    label: 'Step 3 — DHCPREQUEST',
    msgType: 'DHCPREQUEST',
    from: 'Client', to: 'Broadcast',
    fromIcon: '💻', toIcon: '📡',
    type: 'broadcast',
    description: 'Client accepts the offer and broadcasts DHCPREQUEST — broadcast so all DHCP servers know which offer was accepted (others release their reserved IPs).',
    technicalDetail: 'Still broadcast (src=0.0.0.0:68 → 255.255.255.255:67) even though client knows the server IP. Option 53=3 (Request), Option 54=server identifier (192.168.1.1), Option 50=requested IP (192.168.1.100). RFC 2131 §3.1 step 3.',
    packet: 'UDP 0.0.0.0:68 → 255.255.255.255:67  [DHCPREQUEST]  Option54=192.168.1.1  Option50=192.168.1.100',
    color: '#f59e0b',
  },
  {
    id: 'ack',
    label: 'Step 4 — DHCPACK',
    msgType: 'DHCPACK',
    from: 'DHCP Server', to: 'Client',
    fromIcon: '🖥️', toIcon: '💻',
    type: 'broadcast',
    description: 'Server confirms the lease with DHCPACK. Client now owns 192.168.1.100 for the lease duration. It immediately sends a Gratuitous ARP to check for IP conflicts.',
    technicalDetail: 'RFC 2131 §3.1: After receiving ACK, client MUST perform an ARP probe (RFC 5227) to verify no duplicate. If conflict detected → DHCPDECLINE + restart DORA. Lease renewal: client sends DHCPREQUEST at T1 (50% of lease) and T2 (87.5%). On expiry with no renewal → must stop using IP.',
    packet: 'UDP 192.168.1.1:67 → 255.255.255.255:68  [DHCPACK]  yiaddr=192.168.1.100  lease=86400s  T1=43200s  T2=75600s',
    color: '#10b981',
  },
];

const DHCP_OPTIONS = [
  { code: 1,   name: 'Subnet Mask',       example: '255.255.255.0' },
  { code: 3,   name: 'Default Gateway',   example: '192.168.1.1' },
  { code: 6,   name: 'DNS Servers',       example: '8.8.8.8, 8.8.4.4' },
  { code: 12,  name: 'Hostname',          example: 'client-hostname' },
  { code: 15,  name: 'Domain Name',       example: 'corp.example.com' },
  { code: 28,  name: 'Broadcast Address', example: '192.168.1.255' },
  { code: 42,  name: 'NTP Servers',       example: '192.168.1.10' },
  { code: 51,  name: 'Lease Time',        example: '86400 (24h)' },
  { code: 53,  name: 'DHCP Message Type', example: '1=Discover 2=Offer 3=Request 5=ACK' },
  { code: 54,  name: 'Server Identifier', example: '192.168.1.1' },
  { code: 121, name: 'Classless Static Routes', example: 'RFC 3442 — overrides option 3' },
];

const REFERENCES: Reference[] = [
  { title: 'RFC 2131 – DHCP', url: 'https://www.rfc-editor.org/rfc/rfc2131', type: 'rfc', rfcNumber: 2131, description: 'Core DHCP specification' },
  { title: 'RFC 2132 – DHCP Options', url: 'https://www.rfc-editor.org/rfc/rfc2132', type: 'rfc', rfcNumber: 2132, description: 'All DHCP option codes' },
  { title: 'RFC 5227 – ARP Probe for IP Conflict', url: 'https://www.rfc-editor.org/rfc/rfc5227', type: 'rfc', rfcNumber: 5227 },
  { title: 'RFC 951 – BOOTP (DHCP ancestor)', url: 'https://www.rfc-editor.org/rfc/rfc951', type: 'rfc', rfcNumber: 951 },
  { title: 'AWS DHCP Options Sets', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_DHCP_Options.html', type: 'aws' },
  { title: 'Kubernetes DHCP (kubelet node IP)', url: 'https://kubernetes.io/docs/concepts/cluster-administration/networking/', type: 'k8s' },
];

export default function DHCPPage() {
  const [activeTab, setActiveTab] = useState<'animation' | 'options' | 'relay' | 'quiz'>('animation');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('dhcp'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep(s => {
          if (s >= DHCP_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('dhcp'); return s; }
          return s + 1;
        });
      }, Math.round(1400 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const currentStep = DHCP_STEPS[animStep];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Server size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">DHCP — Dynamic Host Configuration Protocol</h1>
            <p className="text-sm text-slate-500 mt-0.5">Application Layer · RFC 2131</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-violet">Application L7</span>
            <span className="badge-green">Beginner</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            When your laptop joins a network, it doesn't know its own IP address yet. DHCP is like checking into a hotel — you show up (Discover), the front desk offers you a room (Offer), you confirm the room (Request), and they hand you the key (Acknowledge). The whole process takes milliseconds.
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (RFC 2131): </span>
            DHCP uses a client-server model over UDP (client port 68, server port 67). The four-message DORA exchange (Discover, Offer, Request, Acknowledge) is all UDP broadcast because the client has no IP initially. The server leases an IP from its pool with a configurable lease time. Clients must renew at T1 (50% of lease) and T2 (87.5%). DHCP Relay Agents (RFC 3046) forward broadcasts across subnets so one server can serve multiple VLANs.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['animation', 'options', 'relay', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'animation' ? '📡 DORA Flow' : tab === 'options' ? '⚙️ DHCP Options' : tab === 'relay' ? '🔀 DHCP Relay' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'animation' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying} currentStep={animStep} totalSteps={DHCP_STEPS.length} speed={speed}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep(s => Math.min(s + 1, DHCP_STEPS.length - 1))}
            onStepBack={() => setAnimStep(s => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed} stepLabel={currentStep.label}
          />

          {/* DORA visual */}
          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Client', sub: '0.0.0.0 → 192.168.1.100', icon: '💻', active: currentStep.from === 'Client' },
                { label: 'Network', sub: 'Broadcast domain', icon: '📡', active: false },
                { label: 'DHCP Server', sub: '192.168.1.1', icon: '🖥️', active: currentStep.from === 'DHCP Server' },
              ].map(h => (
                <div key={h.label} className="text-center">
                  <motion.div animate={h.active ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.4 }}
                    className="glass rounded-xl p-3 inline-block"
                    style={h.active ? { borderColor: currentStep.color, boxShadow: `0 0 16px ${currentStep.color}30` } : {}}>
                    <div className="text-2xl mb-1">{h.icon}</div>
                    <div className="text-xs font-semibold text-white">{h.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{h.sub}</div>
                  </motion.div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {DHCP_STEPS.map((step, idx) => {
                const isPast = idx < animStep;
                const isCurrent = idx === animStep;
                return (
                  <motion.div key={step.id} animate={{ opacity: idx > animStep ? 0.2 : 1 }} transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3"
                    style={{
                      borderColor: isCurrent ? step.color : isPast ? `${step.color}30` : 'rgba(255,255,255,0.04)',
                      backgroundColor: isCurrent ? `${step.color}12` : isPast ? `${step.color}06` : 'transparent',
                      boxShadow: isCurrent ? `0 0 20px ${step.color}20` : 'none',
                    }}>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${step.type === 'broadcast' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                      {step.type === 'broadcast' ? '📡 BC' : '→ UC'}
                    </span>
                    <span className="font-mono text-sm font-bold" style={{ color: isCurrent ? step.color : '#64748b' }}>{step.msgType}</span>
                    <span className="text-xs text-slate-500">{step.from} → {step.to}</span>
                    {isCurrent && (
                      <motion.code initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto text-[10px] font-mono text-slate-400 max-w-[40%] truncate">
                        {step.packet.split('  ')[0]}
                      </motion.code>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={animStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-3 justify-between">
                <h3 className="text-base font-semibold text-white">{currentStep.label}</h3>
                <div className="flex gap-2 shrink-0">
                  <OSILayerBadge layer={7} size="sm" active />
                  <OSILayerBadge layer={4} size="sm" active />
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{currentStep.description}</p>
              <div className="border-t border-white/[0.06] pt-3">
                <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1"><Info size={10} /> Technical</p>
                <p className="text-xs text-slate-400 leading-relaxed">{currentStep.technicalDetail}</p>
              </div>
              <code className="block text-[10px] font-mono text-emerald-300 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2 leading-relaxed">
                {currentStep.packet}
              </code>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'options' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">DHCP Options (RFC 2132) are TLV-encoded fields appended to every DHCP message. They carry all configuration beyond just the IP address.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/[0.06]">
                <th className="text-xs text-slate-500 py-2 pr-4 font-medium text-left">Code</th>
                <th className="text-xs text-slate-500 py-2 pr-4 font-medium text-left">Option Name</th>
                <th className="text-xs text-slate-500 py-2 font-medium text-left">Example Value</th>
              </tr></thead>
              <tbody>
                {DHCP_OPTIONS.map(o => (
                  <tr key={o.code} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-4 font-mono text-electric-300 text-xs">{o.code}</td>
                    <td className="py-2.5 pr-4 text-slate-300 text-xs">{o.name}</td>
                    <td className="py-2.5 font-mono text-xs text-slate-500">{o.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'relay' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3">DHCP Relay Agent (RFC 3046)</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              DHCP Discover/Request are UDP broadcasts — routers do NOT forward broadcasts between subnets by default.
              A DHCP Relay Agent (usually the router/L3 switch) intercepts the broadcast, wraps it in a unicast packet to the DHCP server, and relays the response back.
            </p>
            <div className="glass rounded-lg p-3 font-mono text-xs text-slate-400 space-y-1">
              <div className="text-emerald-400">Client (192.168.2.0/24) → Relay Agent (192.168.2.1) → DHCP Server (10.0.0.1)</div>
              <div>Relay adds giaddr (gateway interface address) = 192.168.2.1</div>
              <div>Server uses giaddr to pick the right IP pool (192.168.2.x range)</div>
              <div>Response unicast back to relay → relay broadcasts to client</div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">☁️ Cloud / Kubernetes</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'AWS VPC', value: 'AWS runs a managed DHCP server per VPC. DHCP Options Sets control DNS, NTP, hostname. Cannot disable DHCP in a VPC.', color: '#f97316' },
                { label: 'Azure', value: 'Azure VNET provides DHCP automatically. DNS settings in VNET configuration. No relay needed — managed service.', color: '#60a5fa' },
                { label: 'GCP', value: 'GCP VPC uses a metadata server (169.254.169.254) for DHCP and instance metadata.', color: '#34d399' },
                { label: 'Kubernetes', value: 'Nodes get IPs via DHCP from infra. Pods get IPs from CNI plugin (not DHCP — from IPAM pool like Calico/Cilium).', color: '#818cf8' },
              ].map(i => (
                <div key={i.label} className="glass rounded-lg p-3">
                  <div className="font-medium mb-1" style={{ color: i.color }}>{i.label}</div>
                  <div className="text-slate-400 leading-relaxed">{i.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="dhcp" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock language="bash" filename="dhcp-commands.sh" code={`# View current DHCP lease (systemd-networkd)
networkctl status eth0
cat /var/lib/systemd/network/eth0.lease

# Release and renew IP (dhclient)
sudo dhclient -r eth0          # release
sudo dhclient eth0             # request new lease

# View DHCP lease (dhclient)
cat /var/lib/dhcp/dhclient.leases

# Capture DHCP traffic (ports 67 and 68)
sudo tcpdump -i eth0 -n port 67 or port 68 -v

# Request DHCP with verbose output
sudo dhclient -v eth0

# Check DHCP server on Linux (isc-dhcp-server)
sudo systemctl status isc-dhcp-server
cat /etc/dhcp/dhcpd.conf

# AWS — view DHCP Options Set attached to VPC
aws ec2 describe-dhcp-options`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
