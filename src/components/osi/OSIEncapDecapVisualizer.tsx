import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  Send,
  Radio,
  Server,
  Laptop,
  HelpCircle,
  Binary,
  Code2,
  Workflow,
  Maximize2
} from 'lucide-react';
import AnimationControls from '../shared/AnimationControls';
import { osiLayerColor, osiLayerName, cn } from '../../utils/helpers';
import { useProgress } from '../../stores';

// Types for Scenarios and Steps
export type VisualizerMode = 'full' | 'encap' | 'decap';
export type ScenarioId = 'https' | 'dns' | 'icmp' | 'custom';

interface HeaderField {
  label: string;
  value: string;
  desc: string;
}

interface StepData {
  stepIndex: number;
  stage: 'sender' | 'wire' | 'receiver';
  layerNumber: number;
  direction: 'encap' | 'decap' | 'transit';
  title: string;
  pduName: string;
  actionText: string;
  technicalDetails: string;
  kernelLocation: string;
  verificationCheck?: string;
  activeHeaders: string[]; // which headers are present on packet in this step
  justChangedHeader?: string; // which header was just added or stripped
  bitsPreview: string;
}

interface ScenarioConfig {
  id: ScenarioId;
  title: string;
  icon: string;
  description: string;
  appData: string;
  tlsInfo?: string;
  transportInfo: string;
  ipInfo: { src: string; dst: string; proto: string };
  macInfo: { src: string; dst: string; ethertype: string };
  rawPayload: string;
}

const SCENARIOS: Record<ScenarioId, ScenarioConfig> = {
  https: {
    id: 'https',
    title: 'HTTPS Web Request',
    icon: '🌐',
    description: 'A browser sending an encrypted HTTP/1.1 GET request to a web server over TLS 1.3 and TCP.',
    appData: 'GET /api/v1/user HTTP/1.1\\r\\nHost: api.example.com',
    tlsInfo: 'TLS 1.3 Record (ApplicationData, Cipher: AES-256-GCM)',
    transportInfo: 'TCP (SrcPort: 54128 ➔ DstPort: 443 [HTTPS], Seq: 101, Ack: 1, Flags: PSH, ACK)',
    ipInfo: { src: '192.168.1.50', dst: '142.250.190.46', proto: 'TCP (6)' },
    macInfo: { src: '00:1A:2B:3C:4D:5E', dst: '00:50:56:C0:00:01 (Gateway)', ethertype: '0x0800 (IPv4)' },
    rawPayload: 'HTTP GET /api/v1/user',
  },
  dns: {
    id: 'dns',
    title: 'DNS Name Query',
    icon: '🔍',
    description: 'A client resolving google.com via UDP query to the DNS resolver 8.8.8.8.',
    appData: 'Standard Query 0x1a2b A google.com',
    tlsInfo: undefined,
    transportInfo: 'UDP (SrcPort: 58210 ➔ DstPort: 53 [DNS], Length: 39, Chksum: 0x4a12)',
    ipInfo: { src: '192.168.1.50', dst: '8.8.8.8', proto: 'UDP (17)' },
    macInfo: { src: '00:1A:2B:3C:4D:5E', dst: '00:50:56:C0:00:01 (Gateway)', ethertype: '0x0800 (IPv4)' },
    rawPayload: 'google.com (Type A, IN)',
  },
  icmp: {
    id: 'icmp',
    title: 'ICMP Echo (Ping)',
    icon: '⚡',
    description: 'A ping utility sending an ICMP Echo Request directly on Layer 3 without a transport port.',
    appData: 'Echo Request (Type: 8, Code: 0, ID: 0x4f2a, Seq: 1)',
    tlsInfo: undefined,
    transportInfo: 'N/A (ICMP operates directly inside Layer 3 IP Payload)',
    ipInfo: { src: '192.168.1.50', dst: '1.1.1.1', proto: 'ICMP (1)' },
    macInfo: { src: '00:1A:2B:3C:4D:5E', dst: '00:50:56:C0:00:01 (Gateway)', ethertype: '0x0800 (IPv4)' },
    rawPayload: 'abcdefghijklmnopqrstuvwabcdefghi (32 bytes data)',
  },
  custom: {
    id: 'custom',
    title: 'Custom Sandbox Payload',
    icon: '🛠️',
    description: 'User-customized payload, IP addresses, ports, and MAC configuration.',
    appData: 'Custom Data: {"user": "alice", "action": "login"}',
    tlsInfo: 'TLS Record (Custom Session)',
    transportInfo: 'TCP (SrcPort: 49152 ➔ DstPort: 8080, Seq: 1000, Ack: 1)',
    ipInfo: { src: '10.0.0.15', dst: '10.0.0.100', proto: 'TCP (6)' },
    macInfo: { src: '02:42:0a:00:00:0f', dst: '02:42:0a:00:00:64', ethertype: '0x0800 (IPv4)' },
    rawPayload: '{"user": "alice", "action": "login"}',
  },
};

// Generate steps dynamically based on scenario and mode
function buildSteps(scenario: ScenarioConfig, mode: VisualizerMode): StepData[] {
  const encapSteps: StepData[] = [
    {
      stepIndex: 0,
      stage: 'sender',
      layerNumber: 7,
      direction: 'encap',
      title: 'Layer 7 – Application Layer',
      pduName: 'Data / Application Payload',
      actionText: `Application generates payload data (${scenario.title})`,
      technicalDetails: `The user application (e.g. Browser / curl) initiates communication by formulating the request structure in user memory: "${scenario.rawPayload}".`,
      kernelLocation: 'Userspace (Application process memory / libc)',
      activeHeaders: ['data'],
      justChangedHeader: 'data',
      bitsPreview: '01000111 01000101 01010100 00100000 00101111',
    },
    {
      stepIndex: 1,
      stage: 'sender',
      layerNumber: 6,
      direction: 'encap',
      title: 'Layer 6 – Presentation Layer',
      pduName: 'Data / Formatted & Encrypted Payload',
      actionText: scenario.tlsInfo ? 'Data encrypted & formatted with TLS 1.3' : 'Data formatted & character encoded (UTF-8/Binary)',
      technicalDetails: scenario.tlsInfo
        ? `Encrypts the plaintext using TLS symmetric session key (AES-GCM / ChaCha20-Poly1305) and wraps it into a TLS Record Header (Type: 23, Version: 0x0303).`
        : `Ensures canonical wire serialization (network byte order / endianness, string encoding).`,
      kernelLocation: 'Userspace Crypto Library (OpenSSL / BoringSSL / Rustls)',
      activeHeaders: ['data', 'presentation'],
      justChangedHeader: 'presentation',
      bitsPreview: '00010111 00000011 00000011 00000001 00101010',
    },
    {
      stepIndex: 2,
      stage: 'sender',
      layerNumber: 5,
      direction: 'encap',
      title: 'Layer 5 – Session Layer',
      pduName: 'Data / Session Stream',
      actionText: 'Session tracking & connection state mapping',
      technicalDetails: `Coordinates dialogue control, RPC token association, and stream multiplexing (e.g., HTTP/2 stream identifier, TLS session ticket / resumption state).`,
      kernelLocation: 'Userspace Session Manager / Socket Connection State',
      activeHeaders: ['data', 'presentation', 'session'],
      justChangedHeader: 'session',
      bitsPreview: '01110011 01100101 01110011 01110011 01101001',
    },
    {
      stepIndex: 3,
      stage: 'sender',
      layerNumber: 4,
      direction: 'encap',
      title: 'Layer 4 – Transport Layer',
      pduName: scenario.id === 'dns' ? 'Datagram (UDP)' : scenario.id === 'icmp' ? 'Packet Payload (Raw Socket)' : 'Segment (TCP)',
      actionText: `Adding ${scenario.id === 'dns' ? 'UDP' : scenario.id === 'icmp' ? 'ICMP' : 'TCP'} Header`,
      technicalDetails: `Appends port multiplexing info, checksum, and state control: ${scenario.transportInfo}. Computes pseudo-header checksum. In Linux kernel, creates an \`sk_buff\` (socket buffer).`,
      kernelLocation: 'Linux Kernel Network Stack (`tcp_sendmsg` / `udp_sendmsg`)',
      activeHeaders: ['data', 'presentation', 'session', 'transport'],
      justChangedHeader: 'transport',
      bitsPreview: '11010011 01110000 00000001 10111011 00000000',
    },
    {
      stepIndex: 4,
      stage: 'sender',
      layerNumber: 3,
      direction: 'encap',
      title: 'Layer 3 – Network Layer',
      pduName: 'Packet / IP Datagram',
      actionText: 'Adding IPv4 Header (Addressing & Routing)',
      technicalDetails: `Kernel executes routing table lookup (\`ip_route_output_key\`), determines next-hop gateway, adds 20-byte IP header with Src: ${scenario.ipInfo.src}, Dst: ${scenario.ipInfo.dst}, TTL: 64, Protocol: ${scenario.ipInfo.proto}, and calculates IP Header Checksum.`,
      kernelLocation: 'Linux Kernel IP Stack (`ip_queue_xmit` / `ip_local_out`)',
      activeHeaders: ['data', 'presentation', 'session', 'transport', 'network'],
      justChangedHeader: 'network',
      bitsPreview: '01000101 00000000 00000101 11001000 01000000',
    },
    {
      stepIndex: 5,
      stage: 'sender',
      layerNumber: 2,
      direction: 'encap',
      title: 'Layer 2 – Data Link Layer',
      pduName: 'Ethernet Frame',
      actionText: 'Adding Ethernet Header & Frame Check Sequence (FCS) Trailer',
      technicalDetails: `NIC Driver queries ARP cache (\`ip neigh\`) for the gateway MAC (${scenario.macInfo.dst}). Adds 14-byte Ethernet Header (Dst MAC, Src MAC, EtherType: ${scenario.macInfo.ethertype}) and appends a 4-byte CRC-32 Trailer (FCS) for link error detection.`,
      kernelLocation: 'NIC Driver & Queuing Discipline (`dev_queue_xmit` / `dev_hard_start_xmit`)',
      activeHeaders: ['data', 'presentation', 'session', 'transport', 'network', 'datalink_header', 'datalink_trailer'],
      justChangedHeader: 'datalink_header',
      bitsPreview: '00000000 01010000 01010110 11000000 00000000',
    },
    {
      stepIndex: 6,
      stage: 'sender',
      layerNumber: 1,
      direction: 'encap',
      title: 'Layer 1 – Physical Layer',
      pduName: 'Bits / Physical Signals',
      actionText: 'Converting Frame into Electrical / Optical Signals & Clocking',
      technicalDetails: `The Physical Layer PHY chip encodes raw bits onto the wire/medium using line modulation (e.g. PAM-4 on 10GBASE-T, NRZ on Gigabit, or RF QAM on Wi-Fi). Adds 7-byte Preamble (10101010...) and 1-byte Start Frame Delimiter (SFD: 10101011) for clock synchronization.`,
      kernelLocation: 'Network Interface Card (NIC) Hardware Transceiver & PHY',
      activeHeaders: ['data', 'presentation', 'session', 'transport', 'network', 'datalink_header', 'datalink_trailer', 'physical'],
      justChangedHeader: 'physical',
      bitsPreview: '10101010 10101010 10101010 10101011 00000000 01010000',
    },
  ];

  const transitStep: StepData = {
    stepIndex: 7,
    stage: 'wire',
    layerNumber: 1,
    direction: 'transit',
    title: 'Physical Medium – In Transit',
    pduName: 'Signal Pulses / Photons on Wire',
    actionText: 'Bits propagating through Physical Cable / Optical Fibre / RF',
    technicalDetails: `Signals travel at roughly 66% the speed of light (~200,000 km/s in copper/fibre). Switches and intermediate Layer 2 bridges read the MAC header to forward the frame without decapsulating upper layers.`,
    kernelLocation: 'Transmission Medium (RJ45 Cat6 / SMF Fibre / Wi-Fi Air)',
    activeHeaders: ['data', 'presentation', 'session', 'transport', 'network', 'datalink_header', 'datalink_trailer', 'physical'],
    justChangedHeader: 'physical',
    bitsPreview: '10101010 11001011 00110011 11110000 10101010',
  };

  const decapSteps: StepData[] = [
    {
      stepIndex: 8,
      stage: 'receiver',
      layerNumber: 1,
      direction: 'decap',
      title: 'Receiver Layer 1 – Physical Layer',
      pduName: 'Bits ➔ Frame Reassembly',
      actionText: 'NIC PHY receives signal pulses, recovers clock & decodes bits',
      technicalDetails: `Receiver NIC hardware detects carrier signal, locks onto the 8-byte Preamble/SFD clock sequence, samples voltage/optical levels, and reconstructs the bitstream into byte buffer.`,
      kernelLocation: 'Receiver NIC PHY / MAC Hardware Controller',
      verificationCheck: 'Signal integrity locked, SFD pattern detected (0xAB)',
      activeHeaders: ['data', 'presentation', 'session', 'transport', 'network', 'datalink_header', 'datalink_trailer'],
      justChangedHeader: 'physical',
      bitsPreview: '00000000 01010000 01010110 11000000 00000000',
    },
    {
      stepIndex: 9,
      stage: 'receiver',
      layerNumber: 2,
      direction: 'decap',
      title: 'Receiver Layer 2 – Data Link Layer',
      pduName: 'Frame Check ➔ Stripping Ethernet Header & FCS',
      actionText: 'Validates CRC-32 (FCS) checksum & verifies Destination MAC',
      technicalDetails: `1. NIC computes CRC-32 over received frame and verifies it matches the FCS trailer. If mismatch, frame is silently dropped at hardware level (CRC error counter increments)!
2. Checks Destination MAC: matches host NIC (${scenario.macInfo.dst}) or Broadcast? If yes, strips Ethernet Header (14 bytes) and FCS (4 bytes), then triggers hardware interrupt (IRQ / NAPI) to pass payload to kernel.`,
      kernelLocation: 'Receiver NIC Driver & Ring Buffer (`napi_gro_receive` / `netif_receive_skb`)',
      verificationCheck: 'CRC-32 Valid ✔ | Dst MAC Matches NIC ✔',
      activeHeaders: ['data', 'presentation', 'session', 'transport', 'network'],
      justChangedHeader: 'datalink_header',
      bitsPreview: '01000101 00000000 00000101 11001000 01000000',
    },
    {
      stepIndex: 10,
      stage: 'receiver',
      layerNumber: 3,
      direction: 'decap',
      title: 'Receiver Layer 3 – Network Layer',
      pduName: 'Packet ➔ Stripping IP Header',
      actionText: 'Validates IP Checksum, checks Destination IP & TTL, strips IP Header',
      technicalDetails: `1. Kernel IP stack validates IP header checksum.
2. Checks Destination IP matches host (${scenario.ipInfo.dst}) or handles local routing.
3. Decrements TTL (if forwarding) or accepts locally. Inspects Protocol field (${scenario.ipInfo.proto}) and demultiplexes payload to the appropriate L4 protocol handler.`,
      kernelLocation: 'Linux Kernel IP Stack (`ip_rcv` / `ip_local_deliver`)',
      verificationCheck: `IP Checksum OK ✔ | Dest IP: ${scenario.ipInfo.dst} matches host ✔`,
      activeHeaders: ['data', 'presentation', 'session', 'transport'],
      justChangedHeader: 'network',
      bitsPreview: '11010011 01110000 00000001 10111011 00000000',
    },
    {
      stepIndex: 11,
      stage: 'receiver',
      layerNumber: 4,
      direction: 'decap',
      title: 'Receiver Layer 4 – Transport Layer',
      pduName: 'Segment / Datagram ➔ Stripping Transport Header',
      actionText: `Validates ${scenario.id === 'dns' ? 'UDP' : scenario.id === 'icmp' ? 'ICMP' : 'TCP'} Port, Sequence & Socket lookup`,
      technicalDetails: `1. Recomputes Transport checksum over pseudo-header + segment.
2. Looks up listening socket via Destination Port (${scenario.transportInfo.includes('443') ? 'Port 443' : 'Port 53/8080'}) in kernel socket hash table.
3. Checks TCP sequence numbers for in-order delivery, generates ACK, and queues data into the socket receive buffer (\`sk_receive_queue\`).`,
      kernelLocation: 'Linux Kernel Transport (`tcp_v4_rcv` / `udp_rcv` / `sock_queue_rcv_skb`)',
      verificationCheck: 'Transport Checksum Valid ✔ | Socket Port Open & Listening ✔',
      activeHeaders: ['data', 'presentation', 'session'],
      justChangedHeader: 'transport',
      bitsPreview: '01110011 01100101 01110011 01110011 01101001',
    },
    {
      stepIndex: 12,
      stage: 'receiver',
      layerNumber: 5,
      direction: 'decap',
      title: 'Receiver Layer 5 – Session Layer',
      pduName: 'Session Stream Synchronization',
      actionText: 'Demultiplexes stream to active application connection session',
      technicalDetails: `Maps incoming segment to established connection session context, keeping track of dialogue control, connection keepalive, and multiplexed stream IDs.`,
      kernelLocation: 'Kernel Socket Interface / Userspace Connection Pool',
      verificationCheck: 'Session active & stream ID synchronized ✔',
      activeHeaders: ['data', 'presentation'],
      justChangedHeader: 'session',
      bitsPreview: '00010111 00000011 00000011 00000001 00101010',
    },
    {
      stepIndex: 13,
      stage: 'receiver',
      layerNumber: 6,
      direction: 'decap',
      title: 'Receiver Layer 6 – Presentation Layer',
      pduName: 'Decryption & Decompression',
      actionText: scenario.tlsInfo ? 'Decrypts TLS Record using Session Cipher' : 'Decodes character encoding into application strings',
      technicalDetails: scenario.tlsInfo
        ? `TLS engine verifies authentication tag (HMAC / GCM Tag), decrypts ciphertext with negotiated session key, and yields plaintext application payload.`
        : `Decompresses (gzip/brotli if enabled) and converts wire format into memory representation.`,
      kernelLocation: 'Userspace Crypto Engine (OpenSSL / Nginx TLS engine)',
      verificationCheck: scenario.tlsInfo ? 'TLS GCM Authentication Tag Verified ✔' : 'Encoding verified ✔',
      activeHeaders: ['data'],
      justChangedHeader: 'presentation',
      bitsPreview: '01000111 01000101 01010101 00100000 00101111',
    },
    {
      stepIndex: 14,
      stage: 'receiver',
      layerNumber: 7,
      direction: 'decap',
      title: 'Receiver Layer 7 – Application Layer',
      pduName: 'Raw Application Message Delivered',
      actionText: 'Delivers payload to target web server / application process',
      technicalDetails: `The server application (e.g. Nginx, Node.js, Go HTTP server) reads plaintext data via \`read()\` or \`recv()\` syscall from the socket file descriptor: "${scenario.rawPayload}". Processes the request and prepares response!`,
      kernelLocation: 'Server Userspace Process (`recv()` / `sys_read`)',
      verificationCheck: 'Message parsed into HTTP request / DNS record successfully ✔',
      activeHeaders: ['data'],
      justChangedHeader: 'data',
      bitsPreview: '01000111 01000101 01010101 00100000 00101111',
    },
  ];

  if (mode === 'encap') {
    return encapSteps;
  }
  if (mode === 'decap') {
    // Decap only mode: re-index steps 0..6
    return decapSteps.map((s, idx) => ({ ...s, stepIndex: idx }));
  }
  // Full mode: all 15 steps (0..14)
  return [...encapSteps, transitStep, ...decapSteps].map((s, idx) => ({ ...s, stepIndex: idx }));
}

// Header definition for interactive click inspection
interface HeaderInfo {
  name: string;
  layer: number;
  color: string;
  badge: string;
  size: string;
  rfc: string;
  fields: HeaderField[];
  hexExample: string;
}

export default function OSIEncapDecapVisualizer() {
  const [mode, setMode] = useState<VisualizerMode>('full');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('https');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedHeaderDetail, setSelectedHeaderDetail] = useState<string | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  // Custom sandbox state
  const [customPayload, setCustomPayload] = useState('{"message": "Hello NetVerse"}');
  const [customSrcIp, setCustomSrcIp] = useState('10.0.0.15');
  const [customDstIp, setCustomDstIp] = useState('10.0.0.100');
  const [customDstPort, setCustomDstPort] = useState('8080');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markAnimationCompleted } = useProgress();

  // Active scenario config
  const activeScenario = useMemo(() => {
    if (selectedScenario === 'custom') {
      return {
        ...SCENARIOS.custom,
        appData: customPayload,
        rawPayload: customPayload,
        ipInfo: { src: customSrcIp, dst: customDstIp, proto: 'TCP (6)' },
        transportInfo: `TCP (SrcPort: 52100 ➔ DstPort: ${customDstPort}, Seq: 1000, Ack: 1)`,
      };
    }
    return SCENARIOS[selectedScenario];
  }, [selectedScenario, customPayload, customSrcIp, customDstIp, customDstPort]);

  // Steps list
  const steps = useMemo(() => buildSteps(activeScenario, mode), [activeScenario, mode]);

  // Clear step on mode change
  useEffect(() => {
    setAnimStep(0);
    setIsPlaying(false);
  }, [mode, selectedScenario]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep((s) => {
          if (s >= steps.length - 1) {
            setIsPlaying(false);
            markAnimationCompleted('osi-model');
            return s;
          }
          return s + 1;
        });
      }, Math.round(1500 / speed));
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isPlaying, speed, steps.length, clearTimer, markAnimationCompleted]);

  const currentStep = steps[animStep] ?? steps[0];

  // Header definitions for inspection
  const HEADER_DEFINITIONS: Record<string, HeaderInfo> = {
    datalink_header: {
      name: 'Ethernet II Header',
      layer: 2,
      color: '#f59e0b',
      badge: 'L2 Data Link',
      size: '14 Bytes',
      rfc: 'IEEE 802.3 / RFC 894',
      fields: [
        { label: 'Destination MAC', value: activeScenario.macInfo.dst, desc: 'Hardware address of next hop' },
        { label: 'Source MAC', value: activeScenario.macInfo.src, desc: 'Hardware address of sending interface' },
        { label: 'EtherType', value: activeScenario.macInfo.ethertype, desc: 'Identifies Layer 3 protocol (0x0800 = IPv4, 0x86DD = IPv6)' },
      ],
      hexExample: '00 50 56 c0 00 01 00 1a 2b 3c 4d 5e 08 00',
    },
    network: {
      name: 'IPv4 Header',
      layer: 3,
      color: '#10b981',
      badge: 'L3 Network',
      size: '20 Bytes (without options)',
      rfc: 'RFC 791',
      fields: [
        { label: 'Version & IHL', value: 'IPv4, 20 bytes (0x45)', desc: 'IP version 4, Internet Header Length = 5 (20 bytes)' },
        { label: 'DSCP / ECN', value: '0x00 (Default)', desc: 'Differentiated Services & Congestion Notification' },
        { label: 'Total Length', value: '128 Bytes', desc: 'Combined length of IP header and payload' },
        { label: 'TTL (Time To Live)', value: '64 hops', desc: 'Decremented at each router to prevent loops' },
        { label: 'Protocol', value: activeScenario.ipInfo.proto, desc: 'Next-level protocol (6 = TCP, 17 = UDP, 1 = ICMP)' },
        { label: 'Header Checksum', value: '0x8f2c (Valid)', desc: '16-bit one\'s complement checksum for IP header' },
        { label: 'Source IP', value: activeScenario.ipInfo.src, desc: 'Logical IPv4 address of original sender' },
        { label: 'Destination IP', value: activeScenario.ipInfo.dst, desc: 'Logical IPv4 address of target host' },
      ],
      hexExample: '45 00 00 80 a1 b2 40 00 40 06 8f 2c c0 a8 01 32 8e fa be 2e',
    },
    transport: {
      name: activeScenario.id === 'dns' ? 'UDP Header' : activeScenario.id === 'icmp' ? 'ICMP Header' : 'TCP Header',
      layer: 4,
      color: '#3b82f6',
      badge: 'L4 Transport',
      size: activeScenario.id === 'dns' ? '8 Bytes' : activeScenario.id === 'icmp' ? '8 Bytes' : '20–32 Bytes',
      rfc: activeScenario.id === 'dns' ? 'RFC 768' : activeScenario.id === 'icmp' ? 'RFC 792' : 'RFC 9293',
      fields: activeScenario.id === 'dns'
        ? [
            { label: 'Source Port', value: '58210', desc: 'Ephemeral client port' },
            { label: 'Destination Port', value: '53 (DNS)', desc: 'Standard DNS server port' },
            { label: 'Length', value: '39 Bytes', desc: 'UDP Header + UDP Payload size' },
            { label: 'Checksum', value: '0x4a12', desc: 'Error detection over pseudo-header and payload' },
          ]
        : activeScenario.id === 'icmp'
        ? [
            { label: 'Type', value: '8 (Echo Request)', desc: 'ICMP message classification' },
            { label: 'Code', value: '0', desc: 'Sub-type code' },
            { label: 'Checksum', value: '0x5b3a', desc: 'Error detection checksum' },
            { label: 'Identifier & Sequence', value: 'ID: 0x4f2a, Seq: 1', desc: 'Used to match ping responses' },
          ]
        : [
            { label: 'Source Port', value: '54128 (Client)', desc: 'High ephemeral port allocated by OS' },
            { label: 'Destination Port', value: '443 (HTTPS)', desc: 'Well-known port for secure web servers' },
            { label: 'Sequence Number', value: '101', desc: 'Byte stream position index' },
            { label: 'Acknowledgment Number', value: '1', desc: 'Next expected byte from peer' },
            { label: 'Flags', value: 'PSH, ACK (0x018)', desc: 'Push data immediately & acknowledge' },
            { label: 'Window Size', value: '64240 bytes', desc: 'Flow control receive buffer credit' },
            { label: 'Checksum', value: '0x3e10 (Valid)', desc: 'Covers TCP pseudo-header and payload' },
          ],
      hexExample: 'd3 70 01 bb 00 00 00 65 00 00 00 01 80 18 fa f0 3e 10 00 00',
    },
    session: {
      name: 'Session Layer Metadata',
      layer: 5,
      color: '#06b6d4',
      badge: 'L5 Session',
      size: 'Variable (Application State)',
      rfc: 'ISO/IEC 7498-1 / RFC 7540',
      fields: [
        { label: 'Session / Stream ID', value: 'Stream #1 / Session Token', desc: 'Multiplexing stream identifier in HTTP/2 or RPC' },
        { label: 'Connection State', value: 'ESTABLISHED / SYNCHRONIZED', desc: 'Maintains dialogue session state across packets' },
      ],
      hexExample: '73 65 73 73 69 6f 6e 2d 74 6f 6b 65 6e',
    },
    presentation: {
      name: 'Presentation / TLS Record Header',
      layer: 6,
      color: '#a78bfa',
      badge: 'L6 Presentation',
      size: '5 Bytes TLS Record + Cipher MAC',
      rfc: 'RFC 8446 (TLS 1.3)',
      fields: [
        { label: 'Content Type', value: '23 (Application Data)', desc: 'Identifies TLS encrypted application record' },
        { label: 'Legacy Version', value: '0x0303 (TLS 1.2 compatibility header)', desc: 'Wire compatibility marker' },
        { label: 'Record Length', value: '54 Bytes', desc: 'Ciphertext length including GCM auth tag' },
        { label: 'Cipher Suite', value: 'TLS_AES_256_GCM_SHA384', desc: 'Authenticated encryption algorithm' },
      ],
      hexExample: '17 03 03 00 36 e4 d2 9b 12 ... [Encrypted Payload]',
    },
    data: {
      name: 'Application Payload (PDU)',
      layer: 7,
      color: '#8b5cf6',
      badge: 'L7 Application',
      size: `${activeScenario.rawPayload.length} Bytes`,
      rfc: 'RFC 9110 (HTTP) / RFC 1035 (DNS)',
      fields: [
        { label: 'Application Data', value: activeScenario.rawPayload, desc: 'The actual message created by the user process' },
        { label: 'Encoding', value: 'UTF-8 / JSON / Binary Wire', desc: 'Character serialization representation' },
      ],
      hexExample: '47 45 54 20 2f 61 70 69 2f 76 31 2f 75 73 65 72 20 48 54 54 50',
    },
    datalink_trailer: {
      name: 'Ethernet Trailer (FCS / CRC-32)',
      layer: 2,
      color: '#f59e0b',
      badge: 'L2 Trailer',
      size: '4 Bytes',
      rfc: 'IEEE 802.3',
      fields: [
        { label: 'Frame Check Sequence (FCS)', value: '0x7e3a9c14 (CRC-32)', desc: 'Cyclic Redundancy Check calculated over entire Ethernet frame' },
        { label: 'Error Policy', value: 'Discard on bit error', desc: 'Receiver silently drops corrupted frames to avoid dirty data' },
      ],
      hexExample: '7e 3a 9c 14',
    },
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar Controls: Mode Switcher & Protocol Scenarios ──────────────── */}
      <div className="glass-strong rounded-2xl p-5 border border-white/[0.08] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Mode switch */}
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Workflow size={13} className="text-electric-400" />
              1. Choose Process Mode
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setMode('full')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  mode === 'full'
                    ? 'bg-electric-500 text-white shadow-lg shadow-electric-500/25'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <span>🔄 Full Journey</span>
                <span className="text-[10px] opacity-75 font-mono">(Sender ➔ Wire ➔ Receiver)</span>
              </button>

              <button
                onClick={() => setMode('encap')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  mode === 'encap'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <ArrowDown size={13} />
                <span>Encapsulation</span>
                <span className="text-[10px] opacity-75 font-mono">(L7 ➔ L1)</span>
              </button>

              <button
                onClick={() => setMode('decap')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  mode === 'decap'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <ArrowUp size={13} />
                <span>Decapsulation</span>
                <span className="text-[10px] opacity-75 font-mono">(L1 ➔ L7)</span>
              </button>
            </div>
          </div>

          {/* Scenario presets */}
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              2. Select Protocol Scenario
            </div>
            <div className="flex flex-wrap gap-2">
              {(['https', 'dns', 'icmp', 'custom'] as const).map((scKey) => {
                const sc = SCENARIOS[scKey];
                const active = selectedScenario === scKey;
                return (
                  <button
                    key={scKey}
                    onClick={() => {
                      setSelectedScenario(scKey);
                      if (scKey === 'custom') setCustomModalOpen(true);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5',
                      active
                        ? 'bg-white/[0.12] border-white/30 text-white shadow-md'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                    )}
                  >
                    <span>{sc.icon}</span>
                    <span>{sc.title.split(' ')[0]}</span>
                    {scKey === 'custom' && <Sliders size={11} className="text-slate-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scenario description banner */}
        <div className="flex items-center justify-between gap-3 text-xs text-slate-300 bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base">{activeScenario.icon}</span>
            <span>{activeScenario.description}</span>
          </div>
          {selectedScenario === 'custom' && (
            <button
              onClick={() => setCustomModalOpen(true)}
              className="text-[11px] text-electric-400 hover:underline shrink-0 font-medium"
            >
              Edit Payload & IPs ⚙️
            </button>
          )}
        </div>
      </div>

      {/* ── Dual-Host OSI Architecture Visualization ─────────────────────────── */}
      <div className="glass-strong rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        {/* Background circuit glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-cyan-500/5 to-emerald-500/5 pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-electric-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Dual-Host OSI Pipeline & Data Flow
            </h3>
          </div>
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Stage:</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full font-bold uppercase text-[10px]',
              currentStep.stage === 'sender'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : currentStep.stage === 'wire'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            )}>
              {currentStep.stage === 'sender' ? '💻 Sender Host (Encapsulating)' : currentStep.stage === 'wire' ? '⚡ Physical Medium (Transit)' : '🖥️ Receiver Server (Decapsulating)'}
            </span>
          </div>
        </div>

        {/* Dual stack interactive diagram */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Sender Host (5 cols) */}
          <div className="md:col-span-5 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Laptop size={14} className="text-violet-400" />
                <span>Sender Client Host</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{activeScenario.ipInfo.src}</span>
            </div>

            {/* Sender layers 7 down to 1 */}
            <div className="space-y-1">
              {[7, 6, 5, 4, 3, 2, 1].map((layerNum) => {
                const isCurrentLayer = currentStep.stage === 'sender' && currentStep.layerNumber === layerNum;
                const isPastLayer = (currentStep.stage === 'sender' && currentStep.layerNumber < layerNum) || currentStep.stage === 'wire' || currentStep.stage === 'receiver';
                const layerColor = osiLayerColor(layerNum);

                return (
                  <motion.div
                    key={`sender-${layerNum}`}
                    animate={{
                      scale: isCurrentLayer ? 1.02 : 1,
                      x: isCurrentLayer ? 4 : 0,
                    }}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition-all duration-300',
                      isCurrentLayer
                        ? 'font-bold shadow-lg'
                        : isPastLayer
                        ? 'opacity-80'
                        : 'opacity-40'
                    )}
                    style={{
                      borderColor: isCurrentLayer ? layerColor : 'rgba(255,255,255,0.06)',
                      backgroundColor: isCurrentLayer ? `${layerColor}22` : 'rgba(255,255,255,0.01)',
                      boxShadow: isCurrentLayer ? `0 0 15px ${layerColor}35` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px]"
                        style={{
                          backgroundColor: isCurrentLayer ? layerColor : `${layerColor}30`,
                          color: isCurrentLayer ? '#fff' : layerColor,
                        }}
                      >
                        {layerNum}
                      </span>
                      <span className={isCurrentLayer ? 'text-white' : 'text-slate-300'}>
                        {osiLayerName(layerNum)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">
                        {layerNum === 7 ? 'Data' : layerNum === 4 ? 'Segment' : layerNum === 3 ? 'Packet' : layerNum === 2 ? 'Frame' : layerNum === 1 ? 'Bits' : 'Data'}
                      </span>
                      {isCurrentLayer && (
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="text-[10px] px-1.5 py-0.2 rounded font-bold"
                          style={{ backgroundColor: `${layerColor}30`, color: layerColor }}
                        >
                          ➕ Encap
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Center Physical Medium (1 col) */}
          <div className="md:col-span-1 flex flex-col items-center justify-center py-4 space-y-2">
            <div className="text-[10px] font-mono uppercase text-slate-500 text-center tracking-tighter">
              Physical Medium
            </div>
            {/* Animated transmission pulse cable */}
            <div className="w-full h-12 relative flex items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-500 rounded-full" />
              {currentStep.stage === 'wire' && (
                <motion.div
                  animate={{
                    x: [-30, 30],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  className="absolute w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]"
                />
              )}
            </div>
            <div className="flex flex-col items-center">
              <Radio size={16} className={cn(currentStep.stage === 'wire' ? 'text-cyan-400 animate-pulse' : 'text-slate-600')} />
              <span className="text-[9px] text-slate-500 font-mono mt-0.5">Bits on Wire</span>
            </div>
          </div>

          {/* Receiver Host (5 cols) */}
          <div className="md:col-span-5 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Server size={14} className="text-emerald-400" />
                <span>Receiver Server Host</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{activeScenario.ipInfo.dst}</span>
            </div>

            {/* Receiver layers 1 up to 7 */}
            <div className="space-y-1">
              {[7, 6, 5, 4, 3, 2, 1].map((layerNum) => {
                const isCurrentLayer = currentStep.stage === 'receiver' && currentStep.layerNumber === layerNum;
                const isDecapped = currentStep.stage === 'receiver' && currentStep.layerNumber > layerNum;
                const layerColor = osiLayerColor(layerNum);

                return (
                  <motion.div
                    key={`receiver-${layerNum}`}
                    animate={{
                      scale: isCurrentLayer ? 1.02 : 1,
                      x: isCurrentLayer ? -4 : 0,
                    }}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition-all duration-300',
                      isCurrentLayer
                        ? 'font-bold shadow-lg'
                        : isDecapped
                        ? 'opacity-80'
                        : 'opacity-40'
                    )}
                    style={{
                      borderColor: isCurrentLayer ? layerColor : 'rgba(255,255,255,0.06)',
                      backgroundColor: isCurrentLayer ? `${layerColor}22` : 'rgba(255,255,255,0.01)',
                      boxShadow: isCurrentLayer ? `0 0 15px ${layerColor}35` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px]"
                        style={{
                          backgroundColor: isCurrentLayer ? layerColor : `${layerColor}30`,
                          color: isCurrentLayer ? '#fff' : layerColor,
                        }}
                      >
                        {layerNum}
                      </span>
                      <span className={isCurrentLayer ? 'text-white' : 'text-slate-300'}>
                        {osiLayerName(layerNum)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">
                        {layerNum === 7 ? 'Data' : layerNum === 4 ? 'Segment' : layerNum === 3 ? 'Packet' : layerNum === 2 ? 'Frame' : layerNum === 1 ? 'Bits' : 'Data'}
                      </span>
                      {isCurrentLayer && (
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="text-[10px] px-1.5 py-0.2 rounded font-bold"
                          style={{ backgroundColor: `${layerColor}30`, color: layerColor }}
                        >
                          🔓 Decap
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Animation Player Controls ─────────────────────────────────────────── */}
      <AnimationControls
        isPlaying={isPlaying}
        currentStep={animStep}
        totalSteps={steps.length}
        speed={speed}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onReset={() => {
          setIsPlaying(false);
          setAnimStep(0);
        }}
        onStepForward={() => setAnimStep((s) => Math.min(s + 1, steps.length - 1))}
        onStepBack={() => setAnimStep((s) => Math.max(s - 1, 0))}
        onSpeedChange={setSpeed}
        stepLabel={currentStep.actionText}
      />

      {/* ── Dynamic Russian-Doll / Nested Packet Structure Inspector ─────────── */}
      <div className="glass-strong rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-electric-400 font-bold font-mono text-sm">📦</span>
              <h3 className="text-sm font-bold text-white">
                Live Dynamic Packet Structure (Russian-Doll Envelope Model)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any header block below to inspect its exact fields, binary layout, and RFC specifications.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/[0.06] text-slate-300 self-start">
            Current PDU: <strong className="text-white">{currentStep.pduName}</strong>
          </span>
        </div>

        {/* Visual packet horizontal assembly */}
        <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] overflow-x-auto">
          <div className="flex items-center justify-center gap-1.5 min-w-[700px] py-3">
            {/* L2 Header */}
            {currentStep.activeHeaders.includes('datalink_header') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSelectedHeaderDetail('datalink_header')}
                className={cn(
                  'px-3 py-2.5 rounded-lg border text-left transition-all relative group',
                  currentStep.justChangedHeader === 'datalink_header'
                    ? 'border-amber-400 bg-amber-500/25 shadow-[0_0_15px_#f59e0b40]'
                    : 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
                )}
              >
                <div className="text-[10px] font-mono text-amber-400 font-bold">L2 Ethernet Hdr</div>
                <div className="text-xs font-semibold text-white truncate max-w-[110px]">14 Bytes</div>
                <div className="text-[9px] text-slate-400 truncate max-w-[110px]">MACs + Type</div>
                <div className="absolute -top-2 -right-2 hidden group-hover:block bg-amber-400 text-black text-[9px] font-bold px-1 rounded">
                  Inspect
                </div>
              </motion.button>
            )}

            {/* L3 Header */}
            {currentStep.activeHeaders.includes('network') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSelectedHeaderDetail('network')}
                className={cn(
                  'px-3 py-2.5 rounded-lg border text-left transition-all relative group',
                  currentStep.justChangedHeader === 'network'
                    ? 'border-emerald-400 bg-emerald-500/25 shadow-[0_0_15px_#10b98140]'
                    : 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20'
                )}
              >
                <div className="text-[10px] font-mono text-emerald-400 font-bold">L3 IPv4 Hdr</div>
                <div className="text-xs font-semibold text-white truncate max-w-[110px]">20 Bytes</div>
                <div className="text-[9px] text-slate-400 truncate max-w-[110px]">Src/Dst IP + TTL</div>
                <div className="absolute -top-2 -right-2 hidden group-hover:block bg-emerald-400 text-black text-[9px] font-bold px-1 rounded">
                  Inspect
                </div>
              </motion.button>
            )}

            {/* L4 Header */}
            {currentStep.activeHeaders.includes('transport') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSelectedHeaderDetail('transport')}
                className={cn(
                  'px-3 py-2.5 rounded-lg border text-left transition-all relative group',
                  currentStep.justChangedHeader === 'transport'
                    ? 'border-blue-400 bg-blue-500/25 shadow-[0_0_15px_#3b82f640]'
                    : 'border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20'
                )}
              >
                <div className="text-[10px] font-mono text-blue-400 font-bold">
                  {activeScenario.id === 'dns' ? 'L4 UDP' : activeScenario.id === 'icmp' ? 'L3 ICMP' : 'L4 TCP'} Hdr
                </div>
                <div className="text-xs font-semibold text-white truncate max-w-[110px]">
                  {activeScenario.id === 'dns' ? '8 Bytes' : '20 Bytes'}
                </div>
                <div className="text-[9px] text-slate-400 truncate max-w-[110px]">Ports + Seq/Ack</div>
                <div className="absolute -top-2 -right-2 hidden group-hover:block bg-blue-400 text-black text-[9px] font-bold px-1 rounded">
                  Inspect
                </div>
              </motion.button>
            )}

            {/* L5 Session */}
            {currentStep.activeHeaders.includes('session') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedHeaderDetail('session')}
                className={cn(
                  'px-3 py-2.5 rounded-lg border text-left transition-all relative group',
                  currentStep.justChangedHeader === 'session'
                    ? 'border-cyan-400 bg-cyan-500/25 shadow-[0_0_15px_#06b6d440]'
                    : 'border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20'
                )}
              >
                <div className="text-[10px] font-mono text-cyan-400 font-bold">L5 Session</div>
                <div className="text-xs font-semibold text-white truncate max-w-[100px]">Stream State</div>
                <div className="text-[9px] text-slate-400 truncate max-w-[100px]">Dialog token</div>
              </motion.button>
            )}

            {/* L6 Presentation */}
            {currentStep.activeHeaders.includes('presentation') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedHeaderDetail('presentation')}
                className={cn(
                  'px-3 py-2.5 rounded-lg border text-left transition-all relative group',
                  currentStep.justChangedHeader === 'presentation'
                    ? 'border-purple-400 bg-purple-500/25 shadow-[0_0_15px_#a78bfa40]'
                    : 'border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20'
                )}
              >
                <div className="text-[10px] font-mono text-purple-400 font-bold">L6 TLS Record</div>
                <div className="text-xs font-semibold text-white truncate max-w-[100px]">Encrypted</div>
                <div className="text-[9px] text-slate-400 truncate max-w-[100px]">TLS 1.3 Rec</div>
              </motion.button>
            )}

            {/* L7 Data Payload */}
            <motion.button
              layout
              onClick={() => setSelectedHeaderDetail('data')}
              className={cn(
                'px-4 py-2.5 rounded-lg border text-left transition-all flex-1 min-w-[140px] relative group',
                currentStep.justChangedHeader === 'data'
                  ? 'border-violet-400 bg-violet-500/30 shadow-[0_0_15px_#8b5cf640]'
                  : 'border-violet-500/40 bg-violet-500/15 hover:bg-violet-500/25'
              )}
            >
              <div className="text-[10px] font-mono text-violet-300 font-bold flex items-center justify-between">
                <span>L7 App Payload</span>
                <span className="text-[9px] opacity-75">{activeScenario.rawPayload.length}B</span>
              </div>
              <div className="text-xs font-semibold text-white font-mono truncate max-w-[200px]">
                "{activeScenario.rawPayload}"
              </div>
              <div className="text-[9px] text-slate-400 truncate">Application Data Body</div>
              <div className="absolute -top-2 -right-2 hidden group-hover:block bg-violet-400 text-black text-[9px] font-bold px-1 rounded">
                Inspect
              </div>
            </motion.button>

            {/* L2 Trailer FCS */}
            {currentStep.activeHeaders.includes('datalink_trailer') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSelectedHeaderDetail('datalink_trailer')}
                className={cn(
                  'px-3 py-2.5 rounded-lg border text-left transition-all relative group',
                  currentStep.justChangedHeader === 'datalink_trailer'
                    ? 'border-amber-400 bg-amber-500/25 shadow-[0_0_15px_#f59e0b40]'
                    : 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
                )}
              >
                <div className="text-[10px] font-mono text-amber-400 font-bold">L2 FCS Trailer</div>
                <div className="text-xs font-semibold text-white truncate max-w-[90px]">4 Bytes</div>
                <div className="text-[9px] text-slate-400 truncate max-w-[90px]">CRC-32 Check</div>
                <div className="absolute -top-2 -right-2 hidden group-hover:block bg-amber-400 text-black text-[9px] font-bold px-1 rounded">
                  Inspect
                </div>
              </motion.button>
            )}
          </div>
        </div>

        {/* Binary Bitstream Preview */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 font-mono">
            <Binary size={14} className="text-cyan-400" />
            <span>Wire Bits Sample:</span>
          </div>
          <div className="font-mono text-xs text-cyan-300 tracking-wider truncate flex-1 select-all">
            {currentStep.bitsPreview}
          </div>
        </div>
      </div>

      {/* ── Active Stage Deep Technical Breakdown Card ────────────────────────── */}
      <motion.div
        key={currentStep.stepIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-6 border space-y-4"
        style={{ borderColor: `${osiLayerColor(currentStep.layerNumber)}40` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg font-mono shrink-0 shadow-lg"
              style={{
                backgroundColor: osiLayerColor(currentStep.layerNumber),
                color: '#fff',
                boxShadow: `0 0 20px ${osiLayerColor(currentStep.layerNumber)}40`,
              }}
            >
              L{currentStep.layerNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{currentStep.title}</h3>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase"
                  style={{
                    backgroundColor: `${osiLayerColor(currentStep.layerNumber)}20`,
                    color: osiLayerColor(currentStep.layerNumber),
                    border: `1px solid ${osiLayerColor(currentStep.layerNumber)}40`,
                  }}
                >
                  {currentStep.direction === 'encap' ? '⬇️ Encapsulation' : currentStep.direction === 'decap' ? '⬆️ Decapsulation' : '⚡ Transit'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{currentStep.actionText}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">PDU Type</div>
            <div className="text-sm font-mono font-bold text-white">{currentStep.pduName}</div>
          </div>
        </div>

        {/* Technical operation description */}
        <div className="text-sm text-slate-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/[0.04]">
          {currentStep.technicalDetails}
        </div>

        {/* OS / Kernel / Hardware Location & Verification check */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="glass rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={13} className="text-emerald-400" />
              OS Subsystem & Kernel Hook
            </div>
            <div className="text-xs font-mono text-emerald-300">{currentStep.kernelLocation}</div>
          </div>

          {currentStep.verificationCheck ? (
            <div className="glass rounded-xl p-3.5 space-y-1 border border-emerald-500/20 bg-emerald-500/5">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Decapsulation Integrity Check
              </div>
              <div className="text-xs font-mono text-emerald-200">{currentStep.verificationCheck}</div>
            </div>
          ) : (
            <div className="glass rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={13} className="text-violet-400" />
                Encapsulation Safety Guarantee
              </div>
              <div className="text-xs text-slate-300">
                Headers are prepended without altering upper-layer payload data integrity.
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Encapsulation vs Decapsulation Comparison Matrix ─────────────────── */}
      <div className="glass rounded-2xl p-6 border border-white/[0.06] space-y-4">
        <div className="flex items-center gap-2">
          <Workflow size={16} className="text-electric-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Encapsulation vs Decapsulation Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Dimension</th>
                <th className="py-2.5 px-3 text-violet-300">📦 Encapsulation (Sender)</th>
                <th className="py-2.5 px-3 text-emerald-300">🔓 Decapsulation (Receiver)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Flow Direction</td>
                <td className="py-2.5 px-3">Top-Down (Layer 7 ➔ Layer 1)</td>
                <td className="py-2.5 px-3">Bottom-Up (Layer 1 ➔ Layer 7)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Header Action</td>
                <td className="py-2.5 px-3">Prepends Protocol Headers & appends L2 FCS Trailer</td>
                <td className="py-2.5 px-3">Validates checksums, processes, and strips Headers/Trailers</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">PDU Transformation</td>
                <td className="py-2.5 px-3">Data ➔ Segment ➔ Packet ➔ Frame ➔ Bits</td>
                <td className="py-2.5 px-3">Bits ➔ Frame ➔ Packet ➔ Segment ➔ Data</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Device Execution</td>
                <td className="py-2.5 px-3">Application ➔ OS Kernel Socket ➔ IP Routing ➔ NIC Driver ➔ PHY</td>
                <td className="py-2.5 px-3">PHY ➔ NIC Ring Buffer ➔ IP Demux ➔ Socket Buffer ➔ App Process</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Error Handling</td>
                <td className="py-2.5 px-3">Calculates Checksums & CRC-32 before wire dispatch</td>
                <td className="py-2.5 px-3">Silently drops corrupt frames (CRC mismatch) or sends RST / ICMP Unreachable</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal / Inspector Drawer for Clicked Header ─────────────────────── */}
      <AnimatePresence>
        {selectedHeaderDetail && HEADER_DEFINITIONS[selectedHeaderDetail] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong rounded-2xl p-6 max-w-xl w-full border border-white/[0.12] space-y-4 shadow-2xl relative"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedHeaderDetail(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white btn-icon"
              >
                ✕
              </button>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg font-mono text-white"
                  style={{ backgroundColor: HEADER_DEFINITIONS[selectedHeaderDetail].color }}
                >
                  L{HEADER_DEFINITIONS[selectedHeaderDetail].layer}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {HEADER_DEFINITIONS[selectedHeaderDetail].name}
                    </h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{
                        backgroundColor: `${HEADER_DEFINITIONS[selectedHeaderDetail].color}20`,
                        color: HEADER_DEFINITIONS[selectedHeaderDetail].color,
                      }}
                    >
                      {HEADER_DEFINITIONS[selectedHeaderDetail].badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Size: {HEADER_DEFINITIONS[selectedHeaderDetail].size} · Standard: {HEADER_DEFINITIONS[selectedHeaderDetail].rfc}
                  </p>
                </div>
              </div>

              {/* Fields Table */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Header Field Breakdown
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {HEADER_DEFINITIONS[selectedHeaderDetail].fields.map((f, i) => (
                    <div
                      key={i}
                      className="glass rounded-lg p-2.5 flex items-center justify-between text-xs gap-3"
                    >
                      <div>
                        <div className="font-semibold text-white">{f.label}</div>
                        <div className="text-[11px] text-slate-400">{f.desc}</div>
                      </div>
                      <div className="font-mono text-xs text-electric-300 font-medium shrink-0 bg-white/[0.04] px-2 py-1 rounded">
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hex Sample */}
              <div className="glass rounded-xl p-3 space-y-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Code2 size={12} /> Hexadecimal Byte Representation
                </div>
                <div className="font-mono text-xs text-emerald-300 bg-black/40 p-2 rounded tracking-wider select-all overflow-x-auto">
                  {HEADER_DEFINITIONS[selectedHeaderDetail].hexExample}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedHeaderDetail(null)}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Close Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Custom Payload Configuration Modal ───────────────────────────────── */}
      <AnimatePresence>
        {customModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong rounded-2xl p-6 max-w-lg w-full border border-white/[0.12] space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setCustomModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white btn-icon"
              >
                ✕
              </button>

              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-electric-400" />
                <h3 className="text-base font-bold text-white">Customize Packet Sandbox</h3>
              </div>

              <p className="text-xs text-slate-400">
                Enter your custom application payload, IP addresses, and destination port to see how your customized data gets encapsulated and decapsulated.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Application Payload (Data)
                  </label>
                  <input
                    type="text"
                    value={customPayload}
                    onChange={(e) => setCustomPayload(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-electric-400"
                    placeholder='{"user": "alice", "action": "login"}'
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Source IP
                    </label>
                    <input
                      type="text"
                      value={customSrcIp}
                      onChange={(e) => setCustomSrcIp(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-electric-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Destination IP
                    </label>
                    <input
                      type="text"
                      value={customDstIp}
                      onChange={(e) => setCustomDstIp(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-electric-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Destination TCP Port
                  </label>
                  <input
                    type="text"
                    value={customDstPort}
                    onChange={(e) => setCustomDstPort(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-electric-400"
                    placeholder="8080"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCustomModalOpen(false)}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Apply & Run Visualizer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
