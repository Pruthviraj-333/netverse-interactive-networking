import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Zap, Shield, Activity, RefreshCw, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';

export default function HTTPSandboxPage() {
  const [protocolVersion, setProtocolVersion] = useState<'HTTP/1.1' | 'HTTP/2' | 'HTTP/3 (QUIC)'>('HTTP/2');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [urlPath, setUrlPath] = useState('/api/v1/users/profile');
  const [authHeader, setAuthHeader] = useState('Bearer eyJhbGciOiJIUzI1Ni... (JWT)');
  const [simulatedStreams, setSimulatedStreams] = useState([
    { id: 1, name: 'index.html', status: 'completed', latency: 45 },
    { id: 2, name: 'styles.css', status: 'completed', latency: 30 },
    { id: 3, name: 'bundle.js', status: 'in-flight', latency: 80 },
    { id: 4, name: 'hero.png', status: 'blocked', latency: 120 },
  ]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      {/* Title Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Code2 size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">HTTP Protocol & QUIC Laboratory</h1>
            <p className="text-sm text-slate-500 mt-0.5">HTTP/1.1 vs HTTP/2 Multiplexing vs HTTP/3 QUIC (UDP)</p>
          </div>
          <span className="ml-auto badge-cyan">Interactive Tool</span>
        </div>
      </div>

      {/* Protocol Selection */}
      <div className="glass rounded-xl p-5 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Protocol Version</label>
          <div className="flex gap-2 glass p-1 rounded-xl">
            {(['HTTP/1.1', 'HTTP/2', 'HTTP/3 (QUIC)'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProtocolVersion(p)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  protocolVersion === p
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Comparison Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="glass p-3 rounded-lg space-y-1">
            <div className="font-bold text-slate-300">HTTP/1.1 (TCP)</div>
            <div className="text-slate-400">Head-of-Line Blocking at TCP layer. Requires 6 domain-sharded TCP connections.</div>
          </div>
          <div className="glass p-3 rounded-lg space-y-1 border border-cyan-500/30">
            <div className="font-bold text-cyan-400">HTTP/2 (Binary HPACK)</div>
            <div className="text-slate-400">Single TCP connection multiplexes multiple streams. HPACK header compression.</div>
          </div>
          <div className="glass p-3 rounded-lg space-y-1 border border-emerald-500/30">
            <div className="font-bold text-emerald-400">HTTP/3 (QUIC / UDP)</div>
            <div className="text-slate-400">Zero TCP HoL blocking. Connection migration between Wi-Fi & 5G without reconnecting.</div>
          </div>
        </div>
      </div>

      {/* HTTP Request Builder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass rounded-xl p-5 space-y-4 border border-white/[0.08]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Send size={15} className="text-cyan-400" />
            <span>HTTP Request Builder</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 mb-1 block font-mono">Method & Path</label>
              <div className="flex gap-2">
                <select
                  value={method}
                  onChange={(e: any) => setMethod(e.target.value)}
                  className="glass rounded-lg px-3 py-2 text-cyan-400 font-bold font-mono outline-none border border-white/10"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  type="text"
                  value={urlPath}
                  onChange={(e) => setUrlPath(e.target.value)}
                  className="flex-1 glass rounded-lg px-3 py-2 text-white font-mono outline-none border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 mb-1 block font-mono">Authorization Header</label>
              <input
                type="text"
                value={authHeader}
                onChange={(e) => setAuthHeader(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2 text-slate-300 font-mono outline-none border border-white/10"
              />
            </div>
          </div>
        </div>

        {/* Wire Inspector View */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">On-the-Wire Format ({protocolVersion})</h3>
          <CodeBlock
            language={protocolVersion === 'HTTP/1.1' ? 'http' : 'bash'}
            filename={protocolVersion === 'HTTP/1.1' ? 'raw-http1.txt' : protocolVersion === 'HTTP/2' ? 'hpack-frames.txt' : 'quic-udp-packets.txt'}
            code={
              protocolVersion === 'HTTP/1.1'
                ? `${method} ${urlPath} HTTP/1.1\r\nHost: api.netverse.io\r\nUser-Agent: NetVerse/2.0\r\nAuthorization: ${authHeader}\r\nAccept: application/json\r\nConnection: keep-alive\r\n\r\n`
                : protocolVersion === 'HTTP/2'
                ? `# HTTP/2 Binary Framing & HPACK Compression
[Stream 1] HEADERS frame (Length: 42, Flags: END_HEADERS)
  :method: ${method}
  :path: ${urlPath}
  :scheme: https
  authorization: (Indexed HPACK static entry 0x82)
[Stream 3] DATA frame (Length: 128, StreamID: 3)`
                : `# HTTP/3 QUIC (UDP Payload - Destination Port 443)
[QUIC Packet Header] Type: Short Header (1RTT), ConnectionID: 0x8f3a92b1
  [QUIC Frame: HEADERS] StreamID: 4, QPACK Encoded: ${method} ${urlPath}
  [QUIC Frame: STREAM] StreamID: 8, Offset: 0, Length: 256`
            }
          />
        </div>
      </div>
    </div>
  );
}
