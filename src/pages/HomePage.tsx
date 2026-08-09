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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-in">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 sm:mb-14"
      >
        <div className="inline-flex items-center gap-2 badge-blue text-xs mb-4 sm:mb-6 px-3 py-1.5">
          <Zap size={12} className="text-electric-400 shrink-0" />
          <span>RFC-accurate · Interactive · Visual</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
          <span className="text-gradient">NetVerse</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-2 px-2">
          Build an iron-clad networking foundation for DevOps, Cloud, SRE, and Kubernetes.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto px-2">
          Every concept is animated, interactive, and grounded in RFCs and official documentation.
          No fabricated behaviour. No oversimplified explanations.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto mt-6 sm:mt-8">
          {[
            { label: 'Topics Viewed', value: viewedCount, color: '#3b82f6' },
            { label: 'Quiz Average', value: totalQuizzes > 0 ? `${averageScore}%` : '—', color: '#10b981' },
            { label: 'Curriculum Topics', value: 21, color: '#8b5cf6' },
            { label: 'Interactive Tools', value: 4, color: '#06b6d4' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-center">
              <div className="text-xl sm:text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Featured Topics */}
      <div className="mb-10 sm:mb-12">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-1">Featured Interactive Topics</h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-5">Start with these core foundations or explore the full sidebar.</p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          {FEATURED_TOPICS.map((topic) => {
            const progress = topics[topic.id];
            const Icon = topic.icon;

            return (
              <motion.div key={topic.id} variants={itemVariants}>
                <Link
                  to={topic.path}
                  className="group block glass rounded-2xl p-4 sm:p-5 border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 h-full"
                  style={{ '--topic-color': topic.color } as React.CSSProperties}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"
                      style={{ backgroundColor: `${topic.color}15`, border: `1px solid ${topic.color}30` }}
                    >
                      <Icon size={18} style={{ color: topic.color }} />
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {progress?.viewed && (
                        <div className="w-2 h-2 rounded-full bg-electric-500 shrink-0" title="Viewed" />
                      )}
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded border truncate"
                        style={{ color: topic.color, borderColor: `${topic.color}30`, backgroundColor: `${topic.color}10` }}
                      >
                        {topic.tag}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base text-white font-semibold mb-1.5 group-hover:text-electric-300 transition-colors">
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
      <div className="mb-10 sm:mb-12">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-1">Learning Paths</h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-5">Curriculum tailored to your target role.</p>

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
      <div className="glass rounded-2xl p-4 sm:p-6 border border-electric-500/10 mb-10 sm:mb-12">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
          <Shield size={24} className="text-electric-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm sm:text-base text-white font-semibold mb-1.5 sm:mb-2">Technical Accuracy First</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every animation, packet flow, and explanation in NetVerse is grounded in official sources:
              IETF RFCs, IEEE standards, Linux kernel source, AWS VPC specs, and Kubernetes CNI docs.
              We never simplify a concept in a way that makes it technically wrong.
            </p>
          </div>
        </div>
      </div>

      {/* Phase roadmap */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Curriculum Completion Roadmap</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { phase: 'Phase 1', label: 'Core Foundations', status: 'done', topics: 'OSI, TCP/IP, DNS, TCP, ARP, Subnetting' },
            { phase: 'Phase 2', label: 'Protocol Deep Dives', status: 'done', topics: 'DHCP, NAT/PAT, UDP, ICMP, HTTPS, AI Tutor' },
            { phase: 'Phase 3', label: 'Infrastructure & Cloud', status: 'done', topics: 'HTTP/3, SSH, Routing, Firewalls, LB, VPC, Docker, K8s' },
            { phase: 'Phase 4', label: 'Tools & Polish', status: 'done', topics: 'Ethernet, MAC, Subnet Calc, Packet Inspector, Cheatsheet, Interview' },
          ].map((p) => (
            <div
              key={p.phase}
              className="glass rounded-xl p-4 border border-emerald-500/30"
              style={{ boxShadow: '0 0 20px rgba(16,185,129,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✅ COMPLETE
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
