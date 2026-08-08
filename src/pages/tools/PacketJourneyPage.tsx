import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ArrowRight, Play, Pause, RefreshCw, Server, Laptop, ShieldCheck, Router, Radio, HardDrive, Info, Layers, Sliders, CheckCircle2, Cpu, Cable } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import AnimationControls from '../../components/shared/AnimationControls';

interface JourneyStage {
  id: string;
  stageName: string;
  nodeName: string;
  deviceCategory: string;
  mediaType: string;
  nodeType: 'client' | 'switch' | 'router' | 'isp' | 'backbone' | 'cloud' | 'server';
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
  icon: any;
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

  // Quick Presets
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

  // Compute dynamic stages
  const getStages = (): JourneyStage[] => {
    const cleanSrcPrivate = srcPrivateIp.trim() || '192.168.1.50';
    const cleanNatIp = srcPublicNatIp.trim() || '203.0.113.45';
    const cleanDstHost = dstServerHost.trim() || 'api.github.com (140.82.121.4)';
    const cleanPort = dstPort.trim() || '443';
    const cleanDstLoc = dstLocation.trim() || 'London Datacenter';
    const cleanSrcName = srcClientName.trim() || 'Client Device';

    return [
      {
        id: 'stage-1-client-host',
        stageName: '1. App & Transport Layer',
        nodeName: cleanSrcName,
        deviceCategory: 'End Host / Client Device',
        mediaType: 'Internal System Memory / OS Socket Buffer',
        nodeType: 'client',
        location: `${cleanSrcPrivate}`,
        actionTitle: 'Payload Creation & TCP Segmentation',
        description: `Application on ${cleanSrcName} constructs request payload for ${cleanDstHost}:${cleanPort}. TLS encrypts payload and TCP assigns ephemeral source port 54321.`,
        technicalDetail: `TCP Header attached: SrcPort=54321, DstPort=${cleanPort}, SEQ=1001, ACK=0, Window=65535, Flags=[SYN].`,
        layer: 'L4 Transport',
        headers: {
          l2: 'Pending Gateway ARP Resolution...',
          l3: `Src: ${cleanSrcPrivate} -> Dst: ${cleanDstHost}`,
          l4: `SrcPort: 54321 -> DstPort: ${cleanPort} [SYN]`,
          l7: `Encrypted Application Payload (${cleanPort === '443' ? 'HTTPS' : cleanPort === '22' ? 'SSH' : 'Database Protocol'})`,
        },
        color: '#3b82f6',
        icon: Laptop,
      },
      {
        id: 'stage-2-nic-switch',
        stageName: '2. Client NIC & Local L2 Switch',
        nodeName: 'Local Ethernet Switch',
        deviceCategory: 'Layer 2 Switching Device',
        mediaType: 'Cat6 Ethernet Cable / Wi-Fi Radio',
        nodeType: 'switch',
        location: 'Local LAN Network',
        actionTitle: 'L2 Ethernet Framing & MAC Forwarding',
        description: `Client NIC builds L2 Ethernet Frame (Src MAC: aa:bb:cc:11:22:33, Dst MAC: Default Gateway Router). Local L2 Switch inspects MAC table and forwards frame to Router port.`,
        technicalDetail: 'Switch inspects L2 MAC Destination (00:11:22:aa:bb:cc) and forwards packet across Port 4 directly to the Gateway Router.',
        layer: 'L2 DataLink',
        headers: {
          l2: 'SrcMAC: aa:bb:cc:11:22:33 -> DstMAC: 00:11:22:aa:bb:cc (Gateway)',
          l3: `SrcIP: ${cleanSrcPrivate} -> DstIP: ${cleanDstHost} (TTL: 64)`,
          l4: `SrcPort: 54321 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#8b5cf6',
        icon: Cpu,
      },
      {
        id: 'stage-3-router-snat',
        stageName: '3. Gateway Router (NAT)',
        nodeName: 'Home/Office Gateway Router',
        deviceCategory: 'Layer 3 Edge Router & NAT Gateway',
        mediaType: 'FTTH Fiber Modem / WAN Cable',
        nodeType: 'router',
        location: `Gateway (${cleanSrcPrivate} -> ${cleanNatIp})`,
        actionTitle: 'Source Network Address Translation (SNAT)',
        description: `Gateway router receives frame, verifies FCS CRC. Router performs SNAT: swaps private IP ${cleanSrcPrivate} for Public WAN IP ${cleanNatIp} in NAT mapping table.`,
        technicalDetail: `NAT Table Mapping: ${cleanSrcPrivate}:54321 <-> ${cleanNatIp}:41002. Outgoing frame encapsulated with ISP POP MAC address.`,
        layer: 'L3 Network',
        headers: {
          l2: 'SrcMAC: router-wan-mac -> DstMAC: isp-pop-mac',
          l3: `SrcIP: ${cleanNatIp} [SNAT] -> DstIP: ${cleanDstHost} (TTL: 63)`,
          l4: `SrcPort: 41002 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#f59e0b',
        icon: Router,
      },
      {
        id: 'stage-4-isp-bgp',
        stageName: '4. ISP POP Edge Router',
        nodeName: 'ISP POP Router (AS7018)',
        deviceCategory: 'Autonomous System Core Router',
        mediaType: 'Underground Fiber Optic Cable',
        nodeType: 'isp',
        location: 'ISP Regional Point of Presence',
        actionTitle: 'BGP Path Lookup & AS Routing',
        description: `ISP edge router receives packet from fiber modem. Router queries global BGP routing table for Dst IP ${cleanDstHost} to determine optimal next Autonomous System (AS).`,
        technicalDetail: 'BGP Route decision: Forward packet to Tier-1 Transit Provider (AS3356). TTL decremented from 63 to 62. L2 frame updated for next-hop router.',
        layer: 'L3 Network',
        headers: {
          l2: 'SrcMAC: isp-edge-mac -> DstMAC: transit-core-mac',
          l3: `SrcIP: ${cleanNatIp} -> DstIP: ${cleanDstHost} (TTL: 62)`,
          l4: `SrcPort: 41002 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#10b981',
        icon: Radio,
      },
      {
        id: 'stage-5-subsea-fiber',
        stageName: '5. Inter-Continental Subsea Cable',
        nodeName: 'Tier-1 Optical DWDM Repeater',
        deviceCategory: 'Subsea Photonic Optical Repeater',
        mediaType: 'Transatlantic Subsea Fiber Cable',
        nodeType: 'backbone',
        location: `Inter-city Optical Backbone to ${cleanDstLoc}`,
        actionTitle: 'High-Speed Optical Transmission (DWDM)',
        description: 'Packet travels across subsea fiber optic cables via Dense Wavelength Division Multiplexing (DWDM) light pulses at ~200,000 km/s.',
        technicalDetail: 'Subsea optical amplifiers boost laser signals on the ocean floor. Transmission latency ~30-50ms across the physical cable link.',
        layer: 'L1 Physical',
        headers: {
          l2: 'Optical Fiber Frame (OTN / SDH Framing)',
          l3: `SrcIP: ${cleanNatIp} -> DstIP: ${cleanDstHost} (TTL: 60)`,
          l4: `SrcPort: 41002 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#06b6d4',
        icon: Cable,
      },
      {
        id: 'stage-6-cloud-gateway',
        stageName: '6. Datacenter Anycast Gateway',
        nodeName: 'Cloud Anycast Border Router',
        deviceCategory: 'Datacenter Border & DDoS Filter',
        mediaType: 'Datacenter Core 100GbE Fiber',
        nodeType: 'cloud',
        location: cleanDstLoc,
        actionTitle: 'Ingress BGP Anycast & eBPF Filter',
        description: `Packet enters target Cloud Gateway in ${cleanDstLoc}. Passed through high-speed eBPF/XDP hardware firewall filter for DDoS verification.`,
        technicalDetail: 'Kernel eBPF XDP hook evaluates 10M+ pps. Verified clean, packet encapsulated into internal Datacenter SDN VXLAN Overlay.',
        layer: 'L3 Network',
        headers: {
          l2: 'VXLAN Outer Header (VNI: 5001)',
          l3: `SrcIP: ${cleanNatIp} -> DstIP: ${cleanDstHost} (TTL: 58)`,
          l4: `SrcPort: 41002 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#ec4899',
        icon: ShieldCheck,
      },
      {
        id: 'stage-7-load-balancer',
        stageName: '7. Datacenter Load Balancer',
        nodeName: 'Ingress Load Balancer (Envoy)',
        deviceCategory: 'L4/L7 Ingress Load Balancer Appliance',
        mediaType: 'Internal Virtual Ethernet (veth) / CNI Bridge',
        nodeType: 'cloud',
        location: `${cleanDstLoc} (Cluster Ingress)`,
        actionTitle: 'Destination NAT & Worker Selection',
        description: `Load Balancer terminates public target IP ${cleanDstHost}, selects backend Web Worker Pod (10.244.3.89), and performs Destination NAT (DNAT).`,
        technicalDetail: `DNAT execution: Dst IP updated from ${cleanDstHost} -> 10.244.3.89. Packet routed to worker pod container network interface.`,
        layer: 'L4 Transport',
        headers: {
          l2: 'SrcMAC: lb-mac -> DstMAC: pod-veth-mac',
          l3: `SrcIP: ${cleanNatIp} -> DstIP: 10.244.3.89 [DNAT] (TTL: 57)`,
          l4: `SrcPort: 41002 -> DstPort: ${cleanPort}`,
          l7: 'Encrypted Payload',
        },
        color: '#8b5cf6',
        icon: HardDrive,
      },
      {
        id: 'stage-8-target-server',
        stageName: '8. Target Web Server Node',
        nodeName: `Target Server App (${cleanDstHost})`,
        deviceCategory: 'Target Virtual Machine / Container Host',
        mediaType: 'Linux Kernel Socket Receive Buffer',
        nodeType: 'server',
        location: `${cleanDstLoc} (Pod: 10.244.3.89)`,
        actionTitle: 'Frame Decapsulation & Socket Read',
        description: `Server NIC receives Ethernet frame, strips L2 header. Kernel verifies TCP checksums, matches TCP socket port ${cleanPort}, and delivers HTTP request to server application!`,
        technicalDetail: `Decapsulation complete! Application reads request from socket buffer, executes logic, and generates HTTP response back to ${cleanSrcName}! 🎉`,
        layer: 'L7 App',
        headers: {
          l2: '[Decapsulated & Verified]',
          l3: '[Decapsulated & Verified]',
          l4: `[Matched TCP Port ${cleanPort}]`,
          l7: 'Application Response Generated! 🎉',
        },
        color: '#10b981',
        icon: Server,
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
              Device-to-Device Internet Packet Journey Visualizer
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Visualizing Physical & Virtual Device Hop Transfers across Local LAN, Routers, ISP, and Cloud Datacenters</p>
          </div>
          <span className="ml-auto badge-blue">Interactive Topology</span>
        </div>
      </div>

      {/* Endpoint Customization Bar */}
      <div className="glass rounded-2xl p-5 mb-6 space-y-4 border border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders size={14} className="text-blue-400" />
            <span>Customize Packet Source & Destination Endpoints</span>
          </h3>
          {/* Quick Presets */}
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
          <div className="glass p-3 rounded-xl space-y-2 border border-blue-500/20">
            <span className="text-blue-400 font-bold flex items-center gap-1"><Laptop size={12} /> Source Client Device</span>
            <div>
              <label className="text-[10px] text-slate-500 block">Device Name / Location</label>
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
                <label className="text-[10px] text-slate-500 block">Public NAT IP</label>
                <input
                  type="text"
                  value={srcPublicNatIp}
                  onChange={(e) => setSrcPublicNatIp(e.target.value)}
                  className="w-full glass rounded px-2 py-1 text-slate-300 outline-none border border-white/10"
                />
              </div>
            </div>
          </div>

          <div className="glass p-3 rounded-xl space-y-2 border border-emerald-500/20 md:col-span-2">
            <span className="text-emerald-400 font-bold flex items-center gap-1"><Server size={12} /> Destination Target Device</span>
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
                <label className="text-[10px] text-slate-500 block">Datacenter Location</label>
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

      {/* Hardware Node Connection Pipeline Map */}
      <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6 mb-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <NetworkIcon size={15} className="text-cyan-400" />
            <span>Interactive Device-to-Device Hop Topology</span>
          </h3>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
            Active Transmission Medium: {currentStage.mediaType}
          </span>
        </div>

        {/* 8-Device Connected Topology Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 relative">
          {stages.map((s, idx) => {
            const isCurrent = idx === animStep;
            const isPast = idx < animStep;
            const IconComponent = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => { setIsPlaying(false); setAnimStep(idx); }}
                className="flex flex-col items-center p-3 rounded-xl border text-center transition-all relative group"
                style={{
                  borderColor: isCurrent ? s.color : isPast ? `${s.color}40` : 'rgba(255,255,255,0.06)',
                  backgroundColor: isCurrent ? `${s.color}18` : 'transparent',
                  boxShadow: isCurrent ? `0 0 20px ${s.color}40` : 'none',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold mb-2 shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${s.color}20`, color: s.color }}
                >
                  <IconComponent size={20} />
                </div>
                <span className="text-[11px] font-bold text-white truncate max-w-full">{s.nodeName.split(' ')[0]}</span>
                <span className="text-[9px] text-slate-400 truncate max-w-full mt-0.5">{s.deviceCategory.split(' ')[0]}</span>

                {/* Pulsing Active Packet Dot */}
                {isCurrent && (
                  <motion.div
                    layoutId="active-packet-indicator"
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/50"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </motion.div>
                )}
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
            className="space-y-4 mt-6"
          >
            {/* Hop Device Details Card */}
            <div className="glass-strong rounded-xl p-5 border border-white/[0.08] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: currentStage.color }} />
                  <h3 className="text-sm font-bold text-white">{currentStage.stageName}: {currentStage.actionTitle}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded bg-white/[0.08] text-white font-bold">{currentStage.nodeName}</span>
                  <span className="px-2.5 py-1 rounded bg-white/[0.06] text-slate-300">{currentStage.deviceCategory}</span>
                  <span className="px-2.5 py-1 rounded bg-white/[0.06] text-slate-400">{currentStage.location}</span>
                </div>
              </div>
              
              <p className="text-sm text-slate-300 leading-relaxed">{currentStage.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Hardware / Interface Category</span>
                  <p className="font-mono text-cyan-300">{currentStage.deviceCategory}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Physical / Virtual Media Transmission Link</span>
                  <p className="font-mono text-emerald-300">{currentStage.mediaType}</p>
                </div>
              </div>
            </div>

            {/* Live Packet Header Stack Inspector */}
            <div className="glass rounded-xl p-5 border border-white/[0.08] space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-purple-400" />
                <span>On-the-Wire Encapsulation Header Stack (Hop {animStep + 1})</span>
              </h4>

              <div className="space-y-2 font-mono text-xs">
                <div className="glass p-3 rounded-lg border-l-4 border-l-amber-500 flex items-center justify-between">
                  <span className="text-amber-400 font-bold">Layer 2 (Data Link)</span>
                  <span className="text-slate-300">{currentStage.headers.l2}</span>
                </div>
                <div className="glass p-3 rounded-lg border-l-4 border-l-emerald-500 flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">Layer 3 (Network)</span>
                  <span className="text-slate-300">{currentStage.headers.l3}</span>
                </div>
                <div className="glass p-3 rounded-lg border-l-4 border-l-blue-500 flex items-center justify-between">
                  <span className="text-blue-400 font-bold">Layer 4 (Transport)</span>
                  <span className="text-slate-300">{currentStage.headers.l4}</span>
                </div>
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

function NetworkIcon(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </svg>
  );
}
