import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Layers, ArrowRight, Server, ShieldCheck, Zap } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'Kubernetes Cluster Networking Model', url: 'https://kubernetes.io/docs/concepts/cluster-administration/networking/', type: 'k8s' },
  { title: 'Kubernetes Services', url: 'https://kubernetes.io/docs/concepts/services-networking/service/', type: 'k8s' },
  { title: 'Cilium eBPF Networking', url: 'https://cilium.io/', type: 'official' },
];

const SERVICE_TYPES = [
  { type: 'ClusterIP (Default)', color: '#3b82f6', desc: 'Exposes service on an internal IP inside the cluster. Accessible only within the cluster.', example: '10.96.0.10:80 -> Pods (10.244.1.5, 10.244.2.8)' },
  { type: 'NodePort', color: '#10b981', desc: 'Exposes service on each Node\'s IP at a static port (30000-32767). Automatically routes to ClusterIP.', example: 'NodeIP:30080 -> ClusterIP:80 -> Pods' },
  { type: 'LoadBalancer', color: '#8b5cf6', desc: 'Exposes service externally using a cloud provider\'s load balancer (e.g. AWS ALB/NLB, GCP LB).', example: 'Public LB EIP:80 -> NodePort -> ClusterIP -> Pods' },
];

const CNI_PLUGINS = [
  { name: 'Cilium', tech: 'eBPF Kernel BPF', desc: 'High-performance eBPF-based CNI. Bypasses iptables conntrack overhead for sub-millisecond pod routing and L7 security.', color: '#06b6d4' },
  { name: 'Calico', tech: 'BGP / VXLAN', desc: 'Enterprise CNI supporting pure unencapsulated BGP routing or VXLAN, with rich NetworkPolicy security rules.', color: '#10b981' },
  { name: 'Flannel', tech: 'VXLAN Overlay', desc: 'Lightweight overlay CNI designed by CoreOS. Simple to set up for basic Pod-to-Pod connectivity.', color: '#f59e0b' },
];

export default function KubernetesNetworkingPage() {
  const [activeTab, setActiveTab] = useState<'model' | 'services' | 'cni' | 'quiz'>('model');
  const [selectedService, setSelectedService] = useState<number>(0);
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('kubernetes-networking'); }, [markTopicViewed]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Cpu size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Kubernetes & CNI Networking</h1>
            <p className="text-sm text-slate-500 mt-0.5">Pod-to-Pod · Services · CNI Plugins & eBPF</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-blue">Kubernetes</span>
            <span className="badge-amber">Advanced</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-semibold">Simple explanation: </span>
            Kubernetes treats every Pod as an independent computer with its own unique IP address. Pods across different nodes can talk directly to each other without NAT.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-semibold">Technical explanation: </span>
            The <strong className="text-white font-semibold">Kubernetes Network Model</strong> enforces four strict requirements: (1) Pod-to-Pod without NAT, (2) Node-to-Pod without NAT, (3) IP-per-Pod consistency, (4) No port mapping needed. Networking is implemented via CNI plugins (Cilium, Calico) and <code className="font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 text-xs">kube-proxy</code> (iptables / IPVS / eBPF).
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['model', 'services', 'cni', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'model' ? '📐 K8s Model' : tab === 'services' ? '🔀 Services' : tab === 'cni' ? '🐝 CNI & eBPF' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'model' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-3">
            <h3 className="text-sm font-bold text-white">The 4 Fundamental Rules of K8s Networking</h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="glass p-3 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                1. All Pods can communicate with all other Pods on any node without NAT.
              </div>
              <div className="glass p-3 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                2. All Nodes can communicate with all Pods (and vice versa) without NAT.
              </div>
              <div className="glass p-3 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                3. The IP that a Pod sees itself as is the exact same IP that all other Pods see it as.
              </div>
              <div className="glass p-3 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                4. Every Pod receives its own real routable IP (IP-per-Pod model).
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SERVICE_TYPES.map((s, i) => (
              <button key={s.type} onClick={() => setSelectedService(i)}
                className={`text-left p-4 rounded-xl border transition-all ${selectedService === i ? 'glass-strong shadow-lg' : 'glass opacity-70 hover:opacity-100'}`}
                style={{ borderColor: selectedService === i ? s.color : 'rgba(255,255,255,0.06)' }}>
                <div className="text-xs font-mono font-bold" style={{ color: s.color }}>{s.type}</div>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={selectedService} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-2xl p-6 space-y-3 border border-white/[0.06]">
              <h3 className="text-base font-bold text-white">{SERVICE_TYPES[selectedService].type}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{SERVICE_TYPES[selectedService].desc}</p>
              <div className="glass p-3 rounded-lg font-mono text-xs text-slate-400">
                Flow: {SERVICE_TYPES[selectedService].example}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'cni' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CNI_PLUGINS.map(c => (
              <div key={c.name} className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{c.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06]" style={{ color: c.color }}>{c.tech}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="kubernetes-networking" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">kubectl Networking Commands</span></div>
      <CodeBlock language="bash" filename="k8s-networking.sh" code={`# View Pod IP addresses
kubectl get pods -o wide

# View Services & ClusterIPs
kubectl get svc -A

# Inspect Endpoints for a Service
kubectl get endpoints my-service

# Debug Pod DNS lookup inside cluster
kubectl run dnsutils --image=tutum/dnsutils --rm -it -- nslookup my-service.default.svc.cluster.local

# View Cilium CNI eBPF status
cilium status`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
