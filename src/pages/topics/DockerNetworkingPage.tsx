import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Layers, ArrowRight, Cpu, Network } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'Docker Networking Overview', url: 'https://docs.docker.com/network/', type: 'official' },
  { title: 'Use Bridge Networks', url: 'https://docs.docker.com/network/drivers/bridge/', type: 'official' },
];

const DOCKER_DRIVERS = [
  {
    name: 'bridge (Default)',
    color: '#3b82f6',
    desc: 'Creates a virtual Linux bridge (`docker0` or user-defined bridge). Each container gets a private IP (`172.17.0.x`) connected via a virtual ethernet (`veth`) pair.',
    useCase: 'Standard single-host application containers.',
    cmd: 'docker network create --driver bridge my-bridge',
  },
  {
    name: 'host',
    color: '#10b981',
    desc: 'Removes network isolation between container and Docker host. Container directly binds to the host\'s network interfaces (e.g. port 80 on host is port 80 in container).',
    useCase: 'High-performance applications requiring maximum network throughput.',
    cmd: 'docker run --network host nginx',
  },
  {
    name: 'overlay',
    color: '#8b5cf6',
    desc: 'Connects multiple Docker daemons across different hosts using VXLAN encapsulation. Used in Docker Swarm and multi-host container clusters.',
    useCase: 'Multi-host container communication without external routing.',
    cmd: 'docker network create --driver overlay my-overlay',
  },
  {
    name: 'macvlan',
    color: '#f59e0b',
    desc: 'Assigns a MAC address directly to a container, making it appear as a physical host directly connected to your LAN.',
    useCase: 'Legacy applications expecting direct physical network access.',
    cmd: 'docker network create -d macvlan --subnet=192.168.1.0/24 my-macvlan',
  },
];

export default function DockerNetworkingPage() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'veth' | 'quiz'>('drivers');
  const [selectedDriver, setSelectedDriver] = useState<number>(0);
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('docker-networking'); }, [markTopicViewed]);

  const current = DOCKER_DRIVERS[selectedDriver];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Box size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Docker Networking Architecture</h1>
            <p className="text-sm text-slate-500 mt-0.5">Container Networking · veth Pairs & Network Namespaces</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-blue">Containers</span>
            <span className="badge-green">Intermediate</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            Docker networking connects isolated container boxes together and exposes their ports to the outside world using virtual cables (veth pairs) and virtual switches (bridges).
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical: </span>
            Docker leverages Linux Kernel **Network Namespaces (`netns`)**, **Virtual Ethernet Pairs (`veth`)**, and **iptables NAT**. When a container starts in bridge mode, a `veth` pair is created: one end inside the container's isolated `netns` as `eth0`, the other attached to host bridge `docker0`.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['drivers', 'veth', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'drivers' ? '🔌 Network Drivers' : tab === 'veth' ? '🔗 veth Pair Mechanics' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'drivers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {DOCKER_DRIVERS.map((d, i) => (
              <button key={d.name} onClick={() => setSelectedDriver(i)}
                className={`text-left p-4 rounded-xl border transition-all ${selectedDriver === i ? 'glass-strong shadow-lg' : 'glass opacity-70 hover:opacity-100'}`}
                style={{ borderColor: selectedDriver === i ? d.color : 'rgba(255,255,255,0.06)' }}>
                <div className="text-xs font-mono font-bold" style={{ color: d.color }}>{d.name}</div>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={selectedDriver} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-2xl p-6 space-y-4 border border-white/[0.06]">
              <h3 className="text-base font-bold text-white" style={{ color: current.color }}>{current.name} Driver</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{current.desc}</p>
              
              <div className="glass rounded-xl p-4 space-y-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Best Use Case</div>
                <div className="text-xs text-slate-200">{current.useCase}</div>
              </div>

              <code className="block text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                {current.cmd}
              </code>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'veth' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-3">
            <h3 className="text-sm font-bold text-white">How `veth` Pairs Work</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              A `veth` (Virtual Ethernet) device acts as a bidirectional virtual wire. Any packet pushed into one end automatically emerges at the opposite end in a different network namespace.
            </p>
            <div className="glass p-3.5 rounded-lg font-mono text-xs text-slate-400 space-y-1">
              <div>Container netns (eth0: 172.17.0.2) ◄════ veth pair ════► Host netns (veth1234 — attached to docker0)</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="docker-networking" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Docker Networking Commands</span></div>
      <CodeBlock language="bash" filename="docker-network.sh" code={`# List Docker networks
docker network ls

# Inspect bridge network & connected containers
docker network inspect bridge

# Inspect iptables rules created by Docker for port forwarding (-p 8080:80)
sudo iptables -t nat -L DOCKER -n -v

# View host veth pairs and bridges on Linux
ip link show type veth
brctl show docker0`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
