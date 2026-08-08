import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Search, RefreshCw, Server, ArrowRight, ShieldCheck, Database, CheckCircle2, Play, Pause } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';

interface DNSStep {
  id: string;
  stage: string;
  serverName: string;
  ip: string;
  query: string;
  response: string;
  ttl: number;
  description: string;
  color: string;
}

export default function DNSResolverPage() {
  const [domainInput, setDomainInput] = useState('api.github.com');
  const [recordType, setRecordType] = useState<'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT'>('A');
  const [activeStep, setActiveStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getSteps = useCallback((domain: string, type: string): DNSStep[] => {
    const cleanDomain = domain.trim().toLowerCase() || 'api.github.com';
    const parts = cleanDomain.split('.');
    const tld = parts.length > 1 ? parts[parts.length - 1] : 'com';
    const rootName = 'a.root-servers.net (198.41.0.4)';
    const tldName = `a.gtld-servers.net (.${tld})`;

    return [
      {
        id: 'cache',
        stage: '1. Local Browser & OS Cache',
        serverName: 'Local OS Resolver (systemd-resolved)',
        ip: '127.0.0.53',
        query: `Lookup ${cleanDomain} IN ${type}`,
        response: 'Cache Miss (TTL Expired)',
        ttl: 0,
        description: 'Browser checks internal DNS cache and /etc/hosts file. No active entry found, forwarding query to recursive resolver.',
        color: '#64748b',
      },
      {
        id: 'recursive',
        stage: '2. Recursive Resolver',
        serverName: 'Cloudflare / Google Resolver',
        ip: '1.1.1.1 / 8.8.8.8',
        query: `Query ${cleanDomain} IN ${type}`,
        response: 'Initiating Iterative Resolution...',
        ttl: 300,
        description: 'Recursive resolver receives the query. It begins walking the DNS hierarchy starting at the Root Server.',
        color: '#3b82f6',
      },
      {
        id: 'root',
        stage: '3. Root Nameserver (.)',
        serverName: rootName,
        ip: '198.41.0.4',
        query: `Where is .${tld} for ${cleanDomain}?`,
        response: `Referral -> TLD Server for .${tld}`,
        ttl: 172800,
        description: 'Root server does not know the final IP, but returns NS referral records pointing to the top-level domain (TLD) servers for .' + tld,
        color: '#8b5cf6',
      },
      {
        id: 'tld',
        stage: '4. TLD Nameserver (.' + tld + ')',
        serverName: tldName,
        ip: '192.5.6.30',
        query: `Where is authoritative NS for ${cleanDomain}?`,
        response: `Referral -> ns-1.github.com`,
        ttl: 86400,
        description: `TLD server for .${tld} inspects registry database and returns authoritative nameserver NS delegation records.`,
        color: '#f59e0b',
      },
      {
        id: 'authoritative',
        stage: '5. Authoritative Nameserver',
        serverName: `ns1.${parts.slice(-2).join('.') || 'github.com'}`,
        ip: '185.199.108.153',
        query: `Final Record Request: ${cleanDomain} IN ${type}`,
        response: type === 'A' ? '140.82.121.4 (200 OK)' : type === 'AAAA' ? '2606:50c0:8000::64' : 'cname.github.net',
        ttl: 60,
        description: `Authoritative server holds official zone records. Returns final ${type} record answer to the recursive resolver.`,
        color: '#10b981',
      },
      {
        id: 'client-received',
        stage: '6. Answer Cached & Delivered to App',
        serverName: 'Browser / Application',
        ip: 'Client Application',
        query: 'Resolution Complete',
        response: `Resolved ${cleanDomain} -> 140.82.121.4`,
        ttl: 60,
        description: 'Recursive resolver caches answer for 60s TTL and returns IP to browser. HTTP GET request initiates immediately!',
        color: '#ec4899',
      },
    ];
  }, []);

  const steps = getSteps(domainInput, recordType);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isSimulating) {
      intervalRef.current = setInterval(() => {
        setActiveStep((s) => {
          if (s >= steps.length - 1) { setIsSimulating(false); return s; }
          return s + 1;
        });
      }, Math.round(1400 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isSimulating, speed, steps.length, clearTimer]);

  const currentStep = steps[activeStep] || steps[0];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 animate-in">
      {/* Title Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Globe size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Recursive DNS Resolution Visualizer</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Interactive Root-to-Authoritative Lookup Simulator</p>
            </div>
          </div>
          <span className="badge-purple shrink-0">Interactive Tool</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass rounded-xl p-4 sm:p-5 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="Enter domain e.g. api.github.com"
                className="w-full glass rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-white font-mono outline-none border border-white/[0.1] focus:border-purple-500"
              />
            </div>
            <div className="flex flex-wrap gap-1 glass p-1 rounded-lg justify-center">
              {(['A', 'AAAA', 'CNAME', 'MX', 'TXT'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRecordType(t)}
                  className={`px-2 py-1 text-xs font-mono rounded ${recordType === t ? 'bg-purple-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 justify-end">
            <button
              onClick={() => {
                setActiveStep(0);
                setIsSimulating(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 hover:brightness-110 transition-all"
            >
              {isSimulating ? <Pause size={14} /> : <Play size={14} />}
              <span>{isSimulating ? 'Pause Resolution' : 'Simulate DNS Lookup'}</span>
            </button>
            <button
              onClick={() => {
                setIsSimulating(false);
                setActiveStep(0);
              }}
              className="glass px-3 py-2 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Step Progress Visualizer */}
      <div className="canvas-bg rounded-2xl border border-white/[0.06] p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          {steps.map((s, idx) => {
            const isCurrent = idx === activeStep;
            const isPast = idx < activeStep;
            return (
              <button
                key={s.id}
                onClick={() => { setIsSimulating(false); setActiveStep(idx); }}
                className="flex flex-col items-center p-2.5 sm:p-3 rounded-xl border text-center transition-all min-h-[72px] justify-center"
                style={{
                  borderColor: isCurrent ? s.color : isPast ? `${s.color}40` : 'rgba(255,255,255,0.06)',
                  backgroundColor: isCurrent ? `${s.color}15` : 'transparent',
                }}
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold mb-1 shrink-0" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                  {idx + 1}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-white leading-tight text-center line-clamp-2">{s.stage.split('. ')[1]}</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Active Step Info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-strong rounded-xl p-5 border border-white/[0.08] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server size={16} style={{ color: currentStep.color }} />
                <h3 className="text-sm font-bold text-white">{currentStep.stage}</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                {currentStep.serverName} ({currentStep.ip})
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{currentStep.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] text-xs font-mono">
              <div className="glass p-3 rounded-lg space-y-1">
                <span className="text-slate-500 uppercase text-[10px]">DNS Query Payload</span>
                <div className="text-purple-300">{currentStep.query}</div>
              </div>
              <div className="glass p-3 rounded-lg space-y-1">
                <span className="text-slate-500 uppercase text-[10px]">Server Response</span>
                <div className="text-emerald-300">{currentStep.response} (TTL: {currentStep.ttl}s)</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CLI Equivalent */}
      <div className="mt-8">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Linux `dig` Command Equivalent</h3>
        <CodeBlock
          language="bash"
          filename="dig-trace.sh"
          code={`# Trace full recursive DNS resolution path step-by-step
dig +trace +nodnssec ${domainInput} ${recordType}

# Query specific authoritative nameserver directly
dig @8.8.8.8 ${domainInput} ${recordType} +noauthority`}
        />
      </div>
    </div>
  );
}
