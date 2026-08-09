import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Server, ArrowRight, CheckCircle2, RefreshCw, Activity, Cpu } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'HAProxy Documentation – Load Balancing Algorithms', url: 'http://cbonte.github.io/haproxy-dconv/', type: 'official' },
  { title: 'AWS Elastic Load Balancing (ALB vs NLB)', url: 'https://docs.aws.amazon.com/elasticloadbalancing/', type: 'aws' },
  { title: 'Nginx Load Balancing Guide', url: 'https://docs.nginx.com/nginx/admin-guide/load-balancer/', type: 'official' },
];

interface BackendServer {
  id: string;
  name: string;
  ip: string;
  activeConn: number;
  weight: number;
  healthy: boolean;
}

const INITIAL_SERVERS: BackendServer[] = [
  { id: 'srv1', name: 'App Server 1', ip: '10.0.1.10', activeConn: 14, weight: 5, healthy: true },
  { id: 'srv2', name: 'App Server 2', ip: '10.0.1.11', activeConn: 4,  weight: 5, healthy: true },
  { id: 'srv3', name: 'App Server 3', ip: '10.0.1.12', activeConn: 28, weight: 10, healthy: true },
  { id: 'srv4', name: 'App Server 4', ip: '10.0.1.13', activeConn: 0,  weight: 5, healthy: false },
];

export default function LoadBalancingPage() {
  const [activeTab, setActiveTab] = useState<'algo' | 'l4vsl7' | 'quiz'>('algo');
  const [algorithm, setAlgorithm] = useState<'rr' | 'leastconn' | 'iphash'>('rr');
  const [servers, setServers] = useState<BackendServer[]>(INITIAL_SERVERS);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('load-balancing'); }, [markTopicViewed]);

  const dispatchRequest = () => {
    const healthyServers = servers.filter(s => s.healthy);
    if (healthyServers.length === 0) return;

    let target: BackendServer;
    if (algorithm === 'leastconn') {
      target = [...healthyServers].sort((a, b) => a.activeConn - b.activeConn)[0];
    } else if (algorithm === 'iphash') {
      // Mock hash picking server 2
      target = healthyServers[1] || healthyServers[0];
    } else {
      // Round robin cycle
      target = healthyServers[Math.floor(Math.random() * healthyServers.length)];
    }

    setSelectedTarget(target.id);
    setServers(prev => prev.map(s => s.id === target.id ? { ...s, activeConn: s.activeConn + 1 } : s));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Network size={20} className="text-teal-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Load Balancing & Traffic Engineering</h1>
            <p className="text-sm text-slate-500 mt-0.5">High Availability · L4 vs L7 Proxying</p>
          </div>
          <div className="ml-auto flex gap-2">
            <OSILayerBadge layer={4} size="sm" />
            <OSILayerBadge layer={7} size="sm" />
            <span className="badge-amber">Intermediate</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-semibold">Simple explanation: </span>
            A Load Balancer is a traffic cop directing incoming user requests across multiple backend servers to prevent any single server from becoming overwhelmed.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-semibold">Technical explanation: </span>
            Load balancers operate at <strong className="text-white font-semibold">L4</strong> (TCP/UDP, fast, packet-level proxying like AWS NLB / HAProxy TCP mode) or <strong className="text-white font-semibold">L7</strong> (HTTP/HTTPS, path routing, header inspection, SSL termination like AWS ALB / Nginx / Envoy). Continuous health checks remove failing instances from pool routing.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['algo', 'l4vsl7', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'algo' ? '⚖️ Algorithm Simulator' : tab === 'l4vsl7' ? '📊 L4 vs L7 Comparison' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'algo' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {[
                { id: 'rr', label: 'Round Robin' },
                { id: 'leastconn', label: 'Least Connections' },
                { id: 'iphash', label: 'IP Hash' },
              ].map(a => (
                <button key={a.id} onClick={() => setAlgorithm(a.id as any)}
                  className={`text-xs px-3 py-2 rounded-lg border font-mono transition-all ${algorithm === a.id ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : 'glass border-white/[0.06] text-slate-400'}`}>
                  {a.label}
                </button>
              ))}
            </div>

            <button onClick={dispatchRequest} className="btn-primary text-xs flex items-center gap-2">
              <RefreshCw size={12} /> Send Test Request
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {servers.map(srv => {
              const isSelected = selectedTarget === srv.id;
              return (
                <motion.div key={srv.id} animate={isSelected ? { scale: [1, 1.03, 1] } : {}}
                  className={`glass rounded-xl p-4 border transition-all ${
                    !srv.healthy ? 'opacity-40 border-red-500/30' :
                    isSelected ? 'border-teal-400 bg-teal-500/10 shadow-lg shadow-teal-500/10' : 'border-white/[0.06]'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <Server size={18} className={srv.healthy ? 'text-teal-400' : 'text-red-400'} />
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${srv.healthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {srv.healthy ? 'HEALTHY' : 'DOWN'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{srv.name}</h4>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">{srv.ip}</div>
                  <div className="text-xs text-slate-300 mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2">
                    <span>Active Conns:</span>
                    <span className="font-mono font-bold text-teal-300">{srv.activeConn}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'l4vsl7' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
              <h3 className="text-sm font-bold text-white">L4 Load Balancer (Transport Layer)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Routes traffic based purely on IP address and TCP/UDP port number without opening HTTP payloads.</p>
              <ul className="text-xs text-slate-400 space-y-1 font-mono pt-2">
                <li>• Extremely high performance (millions of RPS).</li>
                <li>• Examples: AWS NLB, HAProxy TCP mode, IPVS.</li>
              </ul>
            </div>

            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
              <h3 className="text-sm font-bold text-white">L7 Load Balancer (Application Layer)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Terminates TLS and inspects HTTP headers, cookies, URLs, and JSON payloads to make smart routing decisions.</p>
              <ul className="text-xs text-slate-400 space-y-1 font-mono pt-2">
                <li>• Supports path-based routing (e.g. `/api` vs `/static`).</li>
                <li>• Examples: AWS ALB, Nginx, Traefik, Envoy.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="load-balancing" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">HAProxy Configuration</span></div>
      <CodeBlock language="text" filename="haproxy.cfg" code={`backend web_app_backend
    mode http
    balance roundrobin
    option httpchk GET /healthz
    http-check expect status 200
    server app1 10.0.1.10:8080 check inter 2000 rise 2 fall 3
    server app2 10.0.1.11:8080 check inter 2000 rise 2 fall 3`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
