import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Search, CheckCircle2, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 1812 – Requirements for IP Version 4 Routers', url: 'https://www.rfc-editor.org/rfc/rfc1812', type: 'rfc', rfcNumber: 1812 },
  { title: 'RFC 4271 – BGP-4 (Border Gateway Protocol)', url: 'https://www.rfc-editor.org/rfc/rfc4271', type: 'rfc', rfcNumber: 4271 },
  { title: 'RFC 2328 – OSPF Version 2', url: 'https://www.rfc-editor.org/rfc/rfc2328', type: 'rfc', rfcNumber: 2328 },
];

interface RouteRule {
  prefix: string;
  maskBits: number;
  gateway: string;
  interface: string;
  metric: number;
}

const SAMPLE_ROUTES: RouteRule[] = [
  { prefix: '192.168.1.48/28', maskBits: 28, gateway: '192.168.1.1', interface: 'eth0', metric: 10 },
  { prefix: '192.168.1.0/24',  maskBits: 24, gateway: '192.168.1.1', interface: 'eth0', metric: 20 },
  { prefix: '192.168.0.0/16',  maskBits: 16, gateway: '10.0.0.1',    interface: 'eth1', metric: 30 },
  { prefix: '10.0.0.0/8',      maskBits: 8,  gateway: '10.0.0.1',    interface: 'eth1', metric: 10 },
  { prefix: '0.0.0.0/0',       maskBits: 0,  gateway: '203.0.113.1', interface: 'wan0', metric: 100 },
];

export default function RoutingPage() {
  const [activeTab, setActiveTab] = useState<'lpm' | 'protocols' | 'quiz'>('lpm');
  const [testIp, setTestIp] = useState<string>('192.168.1.55');
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('routing'); }, [markTopicViewed]);

  // Longest Prefix Match calculation logic
  const evaluateLPM = (ipStr: string) => {
    // Simple mock matcher for interactive demonstration
    if (ipStr.startsWith('192.168.1.48') || ipStr.startsWith('192.168.1.49') || ipStr.startsWith('192.168.1.5')) {
      return SAMPLE_ROUTES[0]; // /28
    }
    if (ipStr.startsWith('192.168.1.')) {
      return SAMPLE_ROUTES[1]; // /24
    }
    if (ipStr.startsWith('192.168.')) {
      return SAMPLE_ROUTES[2]; // /16
    }
    if (ipStr.startsWith('10.')) {
      return SAMPLE_ROUTES[3]; // /8
    }
    return SAMPLE_ROUTES[4]; // Default route 0.0.0.0/0
  };

  const matchedRoute = evaluateLPM(testIp);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Navigation size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">IP Routing & Longest Prefix Match</h1>
            <p className="text-sm text-slate-500 mt-0.5">Network Layer · RFC 1812</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={3} size="sm" />
            <span className="badge-amber">Intermediate</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            IP Routing is Google Maps for network packets. When a router receives a packet, it checks the destination address against its routing table and forwards it out the best interface.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (RFC 1812): </span>
            Routers forward packets based on **Longest Prefix Match (LPM)**. When an IP matches multiple subnet routes in the Routing Information Base (RIB) / Forwarding Information Base (FIB), the route with the highest CIDR prefix mask length (e.g. `/28` over `/24`) wins.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['lpm', 'protocols', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'lpm' ? '🎯 LPM Simulator' : tab === 'protocols' ? '🌐 Routing Protocols' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'lpm' && (
        <div className="space-y-5">
          <div className="glass rounded-xl p-5 space-y-4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Enter Destination IP Address to Lookup
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={testIp}
                onChange={e => setTestIp(e.target.value)}
                placeholder="e.g. 192.168.1.55"
                className="glass rounded-lg px-4 py-2 text-sm text-white font-mono outline-none border border-white/[0.1] focus:border-blue-500 w-64"
              />
              <span className="text-xs text-slate-400">Try `192.168.1.55`, `192.168.2.10`, `10.5.0.1`, or `8.8.8.8`</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Routing Table (FIB)</h3>
            <div className="space-y-2">
              {SAMPLE_ROUTES.map(route => {
                const isMatch = route.prefix === matchedRoute.prefix;
                return (
                  <motion.div key={route.prefix}
                    animate={isMatch ? { scale: [1, 1.01, 1] } : {}}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isMatch
                        ? 'bg-blue-500/15 border-blue-500/40 shadow-lg shadow-blue-500/10'
                        : 'glass border-white/[0.04] opacity-60'
                    }`}>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className={`font-bold ${isMatch ? 'text-blue-400' : 'text-slate-300'}`}>{route.prefix}</span>
                      <span className="text-slate-500">via {route.gateway}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-slate-400">dev {route.interface}</span>
                      <span className="text-slate-500">metric {route.metric}</span>
                      {isMatch && (
                        <span className="badge-blue flex items-center gap-1 text-[10px]">
                          <CheckCircle2 size={10} /> Winning Route (LPM /{route.maskBits})
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'protocols' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
              <h3 className="text-sm font-bold text-white">IGP — Interior Gateway Protocols</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Used within a single Autonomous System (AS / enterprise network).</p>
              <ul className="text-xs text-slate-400 space-y-1 font-mono pt-2">
                <li>• <strong className="text-blue-400">OSPF (RFC 2328):</strong> Link-state protocol, uses Dijkstra SPF algorithm. Fast convergence.</li>
                <li>• <strong className="text-emerald-400">IS-IS:</strong> Link-state protocol widely used by telecom transit providers.</li>
                <li>• <strong className="text-amber-400">RIP:</strong> Distance-vector protocol (hop count limit 15, obsolete).</li>
              </ul>
            </div>

            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
              <h3 className="text-sm font-bold text-white">EGP — Exterior Gateway Protocols</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Used between different Autonomous Systems across global internet ISPs.</p>
              <ul className="text-xs text-slate-400 space-y-1 font-mono pt-2">
                <li>• <strong className="text-purple-400">BGP-4 (RFC 4271):</strong> Path-vector protocol. Glue of the global internet (~900,000 routes).</li>
                <li>• <strong className="text-indigo-400">eBGP:</strong> BGP between distinct AS numbers (e.g. AWS AS16509 to ISP).</li>
                <li>• <strong className="text-cyan-400">iBGP:</strong> BGP internal to an AS for transit routing.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="routing" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Routing Commands</span></div>
      <CodeBlock language="bash" filename="routing-commands.sh" code={`# Display Kernel Routing Table
ip route show

# Add static route for subnet
sudo ip route add 10.200.0.0/16 via 192.168.1.1 dev eth0

# Delete route
sudo ip route del 10.200.0.0/16

# Policy Routing: route based on source IP (ip rule)
sudo ip rule add from 192.168.1.50/32 table 100
sudo ip route add default via 10.0.0.1 dev eth1 table 100

# View path hops with tracepath / mtr
tracepath 8.8.8.8`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
