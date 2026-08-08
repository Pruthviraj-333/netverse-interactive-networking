import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ArrowRight, Play, Pause, RefreshCw, Server, Laptop, ShieldCheck, Router, Radio, HardDrive, Info, Layers, Sliders, CheckCircle2 } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import AnimationControls from '../../components/shared/AnimationControls';

interface JourneyStage {
  id: string;
  stageName: string;
  nodeName: string;
  nodeType: 'client' | 'router' | 'isp' | 'backbone' | 'cloud' | 'server';
  location: string;
  actionTitle: string;
  description: string;
  technicalDetail: string;
  layer: 'L7 App' | 'L4 Transport' | 'L3 Network' | 'L2 DataLink' | 'L1 Physical';
  headers: {
    l2: string;
    l3: string;
    l4: string;
    l7: string;
  };
  color: string;
}

export default function PacketJourneyPage() {
  // Customization State
  const [srcClientName, setSrcClientName] = useState('MacBook Client (NYC)');
  const [srcPrivateIp, setSrcPrivateIp] = useState('192.168.1.50');
  const [srcPublicNatIp, setSrcPublicNatIp] = useState('203.0.113.45');
  const [dstServerHost, setDstServerHost] = useState('api.github.com (140.82.121.4)');
  const [dstPort, setDstPort] = useState('443');
  const [dstLocation, setDstLocation] = useState('London Datacenter');
  
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preset Configurations
  const applyPreset = (preset: 'web' | 'db' | 'ssh') => {
    setIsPlaying(false);
    setAnimStep(0);
    if (preset === 'web') {
      setSrcClientName('MacBook Client (NYC)');
      setSrcPrivateIp('192.168.1.50');
      setSrcPublicNatIp('203.0.113.45');
      setDstServerHost('api.github.com (140.82.121.4)');
      setDstPort('443');
      setDstLocation('London Datacenter');
    } else if (preset === 'db') {
      setSrcClientName('App Pod A (Tokyo)');
      setSrcPrivateIp('10.0.1.25');
      setSrcPublicNatIp('198.51.100.12');
      setDstServerHost('db.aws.amazon.com (52.198.4.11)');
      setDstPort('5432');
      setDstLocation('Singapore AWS Datacenter');
    } else if (preset === 'ssh') {
      setSrcClientName('Dev Workstation (Berlin)');
      setSrcPrivateIp('172.16.4.10');
      setSrcPublicNatIp('192.0.2.88');
      setDstServerHost('bastion.internal (18.197.0.20)');
      setDstPort('22');
      setDstLocation('Frankfurt Cloud VPC');
    }
  };

  // Compute dynamic stages based on custom inputs
  const getStages = (): JourneyStage[] => {
    const cleanSrcPrivate = srcPrivateIp.trim() || '192.168.1.50';
    const cleanNatIp = srcPublicNatIp.trim() || '203.0.113.45';
    const cleanDstHost = dstServerHost.trim() || 'api.github.com (140.82.121.4)';
    const cleanPort = dstPort.trim() || '443';
    const cleanDstLoc = dstLocation.trim() || 'London Datacenter';
    const cleanSrcName = srcClientName.trim() || 'Client Device';

    return [
      {
        id: 'l7-l4-app-encap',
        stageName: '1. App & Transport Layer',
        nodeName: cleanSrcName,
        nodeType: 'client',
        location: `${cleanSrcPrivate}`,
        actionTitle: 'Payload Creation & TCP Segmentation',
        description: `Application on ${cleanSrcName} generates request payload bound for ${cleanDstHost}:${cleanPort}. TLS/Security layer encrypts data and TCP assigns ephemeral source port 54321.`,
        technicalDetail: `TCP Header: SrcPort=54321, DstPort=${cleanPort}, SEQ=1001, ACK=0, Window=65535, Flags=[SYN].`,
        layer: 'L4 Transport',
        headers: {
          l2: 'Pending ARP Resolution...',
          l3: `Src: ${cleanSrcPrivate} -> Dst: ${cleanDstHost}`,
          l4: `SrcPort: 54321 -> DstPort: ${cleanPort} [SYN]`,
          l7: `Encrypted Application Payload (${cleanPort === '443' ? 'HTTPS' : cleanPort === '22' ? 'SSH' : 'Database Protocol'})`,
        },
        color: '#3b82f6',
      },
      {
        id: 'l3-l2-arp-encap',
        stageName: '2. IP & Ethernet Encapsulation',
        nodeName: 'Client NIC (Network Adapter)',
        nodeType: 'client',
        location: 'MAC: aa:bb:cc:11:22:33',
        actionTitle: 'IP Packetization & ARP Gateway Lookup',
        description: `IP layer attaches L3 Header (Src IP: ${cleanSrcPrivate}, Dst: ${cleanDstHost}, TTL: 64). Host queries ARP table for local Gateway Router MAC address.`,
        technicalDetail: 'Ethernet II Frame assembled: Src MAC=aa:bb:cc:11:22:33, Dst MAC=00:11:22:aa:bb:cc (Default Gateway Router), EtherType=0x0800 (IPv4).',
        layer: 'L2 DataLink',
        headers: {
          l2: 'SrcMAC: aa:bb:cc:11:22:33 -> DstMAC: 00:11:22:aa:bb:cc (Gateway)',
          l3: `SrcIP: ${cleanSrcPrivate} -> DstIP: ${cleanDstHost} (TTL: 64)`,
          l4: `SrcPort: 54321 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#8b5cf6',
      },
      {
        id: 'home-router-snat',
        stageName: '3. Local Gateway & Source NAT',
        nodeName: 'Gateway Router (NAT)',
        nodeType: 'router',
        location: `Gateway (${cleanSrcPrivate} -> ${cleanNatIp})`,
        actionTitle: 'Source Network Address Translation (SNAT)',
        description: `Gateway router receives frame, validates CRC-32. Router performs SNAT: replaces private IP ${cleanSrcPrivate} with Public WAN IP ${cleanNatIp} in NAT mapping table.`,
        technicalDetail: `NAT Table Entry: ${cleanSrcPrivate}:54321 <-> ${cleanNatIp}:41002. Outgoing frame updated with router WAN MAC address.`,
        layer: 'L3 Network',
        headers: {
          l2: 'SrcMAC: router-wan-mac -> DstMAC: isp-pop-mac',
          l3: `SrcIP: ${cleanNatIp} [SNAT] -> DstIP: ${cleanDstHost} (TTL: 63)`,
          l4: `SrcPort: 41002 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#f59e0b',
      },
      {
        id: 'isp-edge-bgp',
        stageName: '4. ISP Core Edge Router',
        nodeName: 'ISP POP Router (AS Path)',
        nodeType: 'isp',
        location: 'ISP Core Backbone Edge',
        actionTitle: 'BGP Routing & Next-Hop Decision',
        description: `ISP edge router receives packet from modem/fiber termination. Inspects target IP ${cleanDstHost} against BGP table to choose shortest Autonomous System (AS) path.`,
        technicalDetail: 'BGP route lookup complete. TTL decremented from 63 to 62. Frame re-encapsulated with next-hop transit router MAC address.',
        layer: 'L3 Network',
        headers: {
          l2: 'SrcMAC: isp-edge-mac -> DstMAC: transit-core-mac',
          l3: `SrcIP: ${cleanNatIp} -> DstIP: ${cleanDstHost} (TTL: 62)`,
          l4: `SrcPort: 41002 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#10b981',
      },
      {
        id: 'subsea-backbone',
        stageName: '5. Internet Backbone Fiber Link',
        nodeName: 'Tier-1 Optical Repeater',
        nodeType: 'backbone',
        location: `Inter-city Optical Backbone to ${cleanDstLoc}`,
        actionTitle: 'High-Speed Photonic Transport (DWDM)',
        description: 'Packet traverses long-haul fiber optics via DWDM light pulses across high-speed internet backbone at ~200,000 km/s.',
        technicalDetail: 'Optical amplifiers boost photonic signals. Transmission latency ~30-50ms depending on physical fiber length.',
        layer: 'L1 Physical',
        headers: {
          l2: 'Optical Fiber Frame (OTN / SDH Framing)',
          l3: `SrcIP: ${cleanNatIp} -> DstIP: ${cleanDstHost} (TTL: 60)`,
          l4: `SrcPort: 41002 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#06b6d4',
      },
      {
        id: 'datacenter-edge-anycast',
        stageName: '6. Datacenter Border & DDoS Protection',
        nodeName: 'Cloud Anycast Border Router',
        nodeType: 'cloud',
        location: cleanDstLoc,
        actionTitle: 'Ingress Filtering & eBPF Inspection',
        description: `Packet arrives at destination Datacenter border router in ${cleanDstLoc}. Passed through high-speed eBPF/XDP firewall filter.`,
        technicalDetail: 'Kernel eBPF XDP hook evaluates 10M+ pps. Verified valid connection, encapsulated into internal Datacenter SDN (VXLAN Tunnel).',
        layer: 'L3 Network',
        headers: {
          l2: 'VXLAN Outer Header (VNI: 5001)',
          l3: `SrcIP: ${cleanNatIp} -> DstIP: ${cleanDstHost} (TTL: 58)`,
          l4: `SrcPort: 41002 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#ec4899',
      },
      {
        id: 'load-balancer-ingress',
        stageName: '7. Datacenter Ingress Load Balancer',
        nodeName: 'Ingress Load Balancer (Envoy)',
        nodeType: 'cloud',
        location: `${cleanDstLoc} (Internal SDN)`,
        actionTitle: 'Destination NAT & Pod Selection',
        description: `Load Balancer receives public target IP ${cleanDstHost}, selects active backend Worker Pod (10.244.3.89), and rewrites Destination IP (DNAT).`,
        technicalDetail: `DNAT execution: Dst IP changed from ${cleanDstHost} -> 10.244.3.89. Packet routed to worker pod container network interface.`,
        layer: 'L4 Transport',
        headers: {
          l2: 'SrcMAC: lb-mac -> DstMAC: pod-veth-mac',
          l3: `SrcIP: ${cleanNatIp} -> DstIP: 10.244.3.89 [DNAT] (TTL: 57)`,
          l4: `SrcPort: 41002 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#8b5cf6',
      },
      {
        id: 'server-demux-app',
        stageName: '8. Server Kernel Demux & App Delivery',
        nodeName: `Target Server App (${cleanDstHost})`,
        nodeType: 'server',
        location: `${cleanDstLoc} (Pod: 10.244.3.89)`,
        actionTitle: 'Frame Decapsulation & Socket Delivery',
        description: `Server NIC receives Ethernet frame, strips L2 header. Kernel verifies TCP checksums, matches listening socket port ${cleanPort}, and hands payload to server application!`,
        technicalDetail: `Decapsulation complete! Server app reads payload from socket buffer, processes request, and returns response packet back to ${cleanSrcName}! 🎉`,
        layer: 'L7 App',
        headers: {
          l2: '[Decapsulated & Verified]',
          l3: '[Decapsulated & Verified]',
          l4: `[Matched TCP Port ${cleanPort}]`,
          l7: 'Application Response Generated! 🎉',
        },
        color: '#10b981',
      },
    ];
  };

  const stages = getStages();

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep((s) => {
          if (s >= stages.length - 1) { setIsPlaying(false); return s; }
          return s + 1;
        });
      }, Math.round(1800 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, stages.length, clearTimer]);

  const currentStage = stages[animStep] || stages[0];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      {/* Title Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              End-to-End Internet Packet Journey Visualizer
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Customizable Source & Destination Packet Transport & Encapsulation Simulator</p>
          </div>
          <span className="ml-auto badge-blue">Interactive Visualizer</span>
        </div>
      </div>

      {/* Source & Destination Customization Bar */}
      <div className="glass rounded-2xl p-5 mb-6 space-y-4 border border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders size={14} className="text-blue-400" />
            <span>Customize Packet Source & Destination Endpoints</span>
          </h3>
          {/* Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">Quick Presets:</span>
            <button onClick={() => applyPreset('web')} className="px-2.5 py-1 rounded glass text-[10px] text-blue-400 hover:bg-blue-500/20 border border-blue-500/30">
              🌐 Web (HTTPS:443)
            </button>
            <button onClick={() => applyPreset('db')} className="px-2.5 py-1 rounded glass text-[10px] text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30">
              ☁️ Cloud DB (Postgres:5432)
            </button>
            <button onClick={() => applyPreset('ssh')} className="px-2.5 py-1 rounded glass text-[10px] text-amber-400 hover:bg-amber-500/20 border border-amber-500/30">
              🔒 SSH Admin (:22)
            </button>
          </div>
        </div>

        {/* Custom Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Source Controls */}
          <div className="glass p-3 rounded-xl space-y-2 border border-blue-500/20">
            <span className="text-blue-400 font-bold flex items-center gap-1"><Laptop size={12} /> Source Client Config</span>
            <div>
              <label className="text-[10px] text-slate-500 block">Device / Region Label</label>
              <input
                type="text"
                value={srcClientName}
                onChange={(e) => setSrcClientName(e.target.value)}
                className="w-full glass rounded px-2.5 py-1 text-white outline-none border border-white/10 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">Private IP</label>
                <input
                  type="text"
                  value={srcPrivateIp}
                  onChange={(e) => setSrcPrivateIp(e.target.value)}
                  className="w-full glass rounded px-2 py-1 text-slate-300 outline-none border border-white/10"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Public WAN NAT IP</label>
                <input
                  type="text"
                  value={srcPublicNatIp}
                  onChange={(e) => setSrcPublicNatIp(e.target.value)}
                  className="w-full glass rounded px-2 py-1 text-slate-300 outline-none border border-white/10"
                />
              </div>
            </div>
          </div>

          {/* Destination Controls */}
          <div className="glass p-3 rounded-xl space-y-2 border border-emerald-500/20 md:col-span-2">
            <span className="text-emerald-400 font-bold flex items-center gap-1"><Server size={12} /> Destination Target Config</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">Target Hostname / IP</label>
                <input
                  type="text"
                  value={dstServerHost}
                  onChange={(e) => setDstServerHost(e.target.value)}
                  className="w-full glass rounded px-2 py-1 text-white outline-none border border-white/10 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Target Port</label>
                <input
                  type="text"
                  value={dstPort}
                  onChange={(e) => setDstPort(e.target.value)}
                  className="w-full glass rounded px-2 py-1 text-slate-300 outline-none border border-white/10"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Datacenter / Region</label>
                <input
                  type="text"
                  value={dstLocation}
                  onChange={(e) => setDstLocation(e.target.value)}
                  className="w-full glass rounded px-2 py-1 text-slate-300 outline-none border border-white/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Playback Controls */}
      <div className="mb-6">
        <AnimationControls
          isPlaying={isPlaying}
          currentStep={animStep}
          totalSteps={stages.length}
          speed={speed}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onReset={() => { setIsPlaying(false); setAnimStep(0); }}
          onStepForward={() => setAnimStep((s) => Math.min(s + 1, stages.length - 1))}
          onStepBack={() => setAnimStep((s) => Math.max(s - 1, 0))}
          onSpeedChange={setSpeed}
          stepLabel={currentStage.stageName}
        />
      </div>

      {/* Topology Node Map */}
      <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-6">
          {stages.map((s, idx) => {
            const isCurrent = idx === animStep;
            const isPast = idx < animStep;
            return (
              <button
                key={s.id}
                onClick={() => { setIsPlaying(false); setAnimStep(idx); }}
                className="flex flex-col items-center p-2.5 rounded-xl border text-center transition-all"
                style={{
                  borderColor: isCurrent ? s.color : isPast ? `${s.color}40` : 'rgba(255,255,255,0.06)',
                  backgroundColor: isCurrent ? `${s.color}18` : 'transparent',
                  boxShadow: isCurrent ? `0 0 16px ${s.color}30` : 'none',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs mb-1.5 shrink-0"
                  style={{ backgroundColor: `${s.color}20`, color: s.color }}
                >
                  {idx + 1}
                </div>
                <span className="text-[10px] font-semibold text-white truncate max-w-full">{s.nodeName.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Packet Inspector & Headers */}
        <AnimatePresence mode="wait">
          <motion.div
            key={animStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Hop Header Bar */}
            <div className="glass-strong rounded-xl p-5 border border-white/[0.08] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentStage.color }} />
                  <h3 className="text-sm font-bold text-white">{currentStage.stageName}: {currentStage.actionTitle}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">{currentStage.nodeName}</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">{currentStage.location}</span>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{currentStage.description}</p>
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Technical Mechanism</span>
                <p className="text-xs font-mono text-cyan-300">{currentStage.technicalDetail}</p>
              </div>
            </div>

            {/* Live Packet Header Stack Inspector */}
            <div className="glass rounded-xl p-5 border border-white/[0.08] space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-purple-400" />
                <span>On-the-Wire Encapsulation Header Stack (Hop {animStep + 1})</span>
              </h4>

              <div className="space-y-2 font-mono text-xs">
                {/* L2 Header */}
                <div className="glass p-3 rounded-lg border-l-4 border-l-amber-500 flex items-center justify-between">
                  <span className="text-amber-400 font-bold">Layer 2 (Data Link)</span>
                  <span className="text-slate-300">{currentStage.headers.l2}</span>
                </div>
                {/* L3 Header */}
                <div className="glass p-3 rounded-lg border-l-4 border-l-emerald-500 flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">Layer 3 (Network)</span>
                  <span className="text-slate-300">{currentStage.headers.l3}</span>
                </div>
                {/* L4 Header */}
                <div className="glass p-3 rounded-lg border-l-4 border-l-blue-500 flex items-center justify-between">
                  <span className="text-blue-400 font-bold">Layer 4 (Transport)</span>
                  <span className="text-slate-300">{currentStage.headers.l4}</span>
                </div>
                {/* L7 Payload */}
                <div className="glass p-3 rounded-lg border-l-4 border-l-purple-500 flex items-center justify-between">
                  <span className="text-purple-400 font-bold">Layer 7 (Application)</span>
                  <span className="text-slate-300">{currentStage.headers.l7}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Linux Diagnostic CLI */}
      <div className="mt-8">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Linux Packet Inspection Commands</h3>
        <CodeBlock
          language="bash"
          filename="packet-trace.sh"
          code={`# 1. Trace IP routing hop-by-hop to custom destination
traceroute -I ${dstServerHost.split(' ')[0]}
mtr --report ${dstServerHost.split(' ')[0]}

# 2. View local interface routing table & default gateway MAC
ip route get ${srcPublicNatIp}
ip neighbor show   # ARP cache

# 3. Capture raw packet headers with tcpdump for port ${dstPort}
sudo tcpdump -i eth0 -nn -vvv 'tcp port ${dstPort}'`}
        />
      </div>
    </div>
  );
}
