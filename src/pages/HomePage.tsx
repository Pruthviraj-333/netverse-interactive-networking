import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, BookOpen, Globe, Activity, Network, Calculator, Layers, Shield, Cloud } from 'lucide-react';
import { useProgress } from '../stores';

const FEATURED_TOPICS = [
  { id: 'osi-model',     title: 'OSI Model',         icon: Layers,     path: '/topic/osi-model',      color: '#8b5cf6', desc: 'Interactive 7-layer explorer with encapsulation animation', tag: 'Fundamentals' },
  { id: 'dns',           title: 'DNS Resolution',    icon: Globe,      path: '/topic/dns',            color: '#3b82f6', desc: 'Full 10-step animated resolution flow: browser → root NS → answer', tag: 'Application L7' },
  { id: 'tcp',           title: 'TCP Lifecycle',     icon: Activity,   path: '/topic/tcp',            color: '#3b82f6', desc: '3-way handshake, 4-way termination, socket states & flags', tag: 'Transport L4' },
  { id: 'arp',           title: 'ARP',               icon: Network,    path: '/topic/arp',            color: '#f59e0b', desc: 'Animated broadcast/unicast flow, Gratuitous ARP & security', tag: 'Data Link L2' },
  { id: 'ip-addressing', title: 'IP & Subnetting',   icon: Calculator, path: '/topic/ip-addressing',  color: '#10b981', desc: 'Live CIDR calculator with binary bit view and RFC 1918 ranges', tag: 'Network L3' },
];

const LEARNING_PATHS = [
  { title: 'DevOps Engineer', icon: '⚙️', topics: ['OSI Model', 'TCP/IP', 'DNS', 'HTTP/HTTPS', 'TLS', 'Load Balancing', 'Firewalls'] },
  { title: 'Cloud Engineer',  icon: '☁️', topics: ['IP Addressing', 'Routing', 'NAT', 'VPC', 'DNS', 'Load Balancing', 'CDN'] },
  { title: 'SRE / Ops',       icon: '🔧', topics: ['TCP', 'ICMP', 'DNS', 'HTTP', 'Troubleshooting', 'Wireshark', 'iptables'] },
  { title: 'Kubernetes Eng',  icon: '🚢', topics: ['CNI', 'Services', 'DNS', 'Network Policy', 'Ingress', 'kube-proxy'] },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function HomePage() {
  const { topics, averageScore, totalQuizzes } = useProgress();
  const viewedCount = Object.values(topics).filter((t) => t.viewed).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-in">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <div className="inline-flex items-center gap-2 badge-blue text-xs mb-6 px-3 py-1.5">
          <Zap size={12} className="text-electric-400" />
          RFC-accurate · Interactive · Visual
        </div>
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-gradient">NetVerse</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-2">
          Build an iron-clad networking foundation for DevOps, Cloud, SRE, and Kubernetes.
        </p>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Every concept is animated, interactive, and grounded in RFCs and official documentation.
          No fabricated behaviour. No oversimplified explanations.
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-6 mt-8">
          {[
            { label: 'Topics Viewed', value: viewedCount, color: '#3b82f6' },
            { label: 'Quiz Average', value: totalQuizzes > 0 ? `${averageScore}%` : '—', color: '#10b981' },
            { label: 'Phase 1 Topics', value: 5, color: '#8b5cf6' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl px-5 py-3 text-center">
              <div className="text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Featured Topics */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-1">Phase 1 — Core Topics</h2>
        <p className="text-sm text-slate-500 mb-5">Start here to build your networking foundation.</p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURED_TOPICS.map((topic) => {
            const progress = topics[topic.id];
            const Icon = topic.icon;

            return (
              <motion.div key={topic.id} variants={itemVariants}>
                <Link
                  to={topic.path}
                  className="group block glass rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 h-full"
                  style={{ '--topic-color': topic.color } as React.CSSProperties}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${topic.color}15`, border: `1px solid ${topic.color}30` }}
                    >
                      <Icon size={18} style={{ color: topic.color }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {progress?.viewed && (
                        <div className="w-2 h-2 rounded-full bg-electric-500" title="Viewed" />
                      )}
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
                        style={{ color: topic.color, borderColor: `${topic.color}30`, backgroundColor: `${topic.color}10` }}
                      >
                        {topic.tag}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-white font-semibold mb-1.5 group-hover:text-electric-300 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{topic.desc}</p>

                  <div className="flex items-center justify-between">
                    {progress?.quizScore !== undefined ? (
                      <span className="text-xs text-emerald-400 font-medium">Quiz: {progress.quizScore}%</span>
                    ) : (
                      <span />
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-electric-400 transition-colors">
                      Explore <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Learning Paths */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-1">Learning Paths</h2>
        <p className="text-sm text-slate-500 mb-5">Curriculum tailored to your target role.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {LEARNING_PATHS.map((path) => (
            <div key={path.title} className="glass rounded-xl p-4">
              <div className="text-2xl mb-2">{path.icon}</div>
              <h3 className="text-sm font-semibold text-white mb-2">{path.title}</h3>
              <ul className="space-y-1">
                {path.topics.map((t) => (
                  <li key={t} className="text-xs text-slate-500 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-electric-500/50 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Philosophy callout */}
      <div className="glass rounded-2xl p-6 border border-electric-500/10">
        <div className="flex gap-4 items-start">
          <Shield size={24} className="text-electric-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-semibold mb-2">Technical Accuracy First</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every animation, packet flow, and explanation in NetVerse is grounded in official sources:
              IETF RFCs, Cisco documentation, Linux kernel source, AWS/Azure/GCP documentation, and Kubernetes docs.
              We never simplify a concept in a way that makes it technically wrong.
              If we can't represent something accurately, we say so explicitly.
            </p>
          </div>
        </div>
      </div>

      {/* Phase roadmap */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">Platform Roadmap</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { phase: 'Phase 1', label: 'Core Foundations', status: 'current', topics: 'OSI, DNS, TCP, ARP, IP/Subnetting, Quiz, AI Tutor' },
            { phase: 'Phase 2', label: 'Protocol Deep Dives', status: 'next', topics: 'DHCP, NAT, UDP, ICMP, HTTP, HTTPS/TLS, SSH, Groq AI' },
            { phase: 'Phase 3', label: 'Infrastructure', status: 'planned', topics: 'Routing, Switching, Firewalls, Docker, Kubernetes Networking' },
            { phase: 'Phase 4', label: 'Cloud & Advanced', status: 'planned', topics: 'AWS VPC, Azure VNet, GCP VPC, Service Mesh, Progress Tracking' },
          ].map((p) => (
            <div
              key={p.phase}
              className="glass rounded-xl p-4"
              style={p.status === 'current' ? { borderColor: '#3b82f630', boxShadow: '0 0 20px rgba(59,130,246,0.08)' } : {}}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  p.status === 'current' ? 'bg-electric-500/20 text-electric-300 border border-electric-500/30' :
                  p.status === 'next'    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                }`}>
                  {p.status === 'current' ? '✅ LIVE' : p.status === 'next' ? '🔜 NEXT' : '📅 PLANNED'}
                </span>
              </div>
              <div className="text-sm font-semibold text-white mb-0.5">{p.phase}</div>
              <div className="text-[11px] text-slate-400 mb-2">{p.label}</div>
              <div className="text-[10px] text-slate-600 leading-relaxed">{p.topics}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
