import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Network, Lock, Cpu, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import TopicFooterNav from '../../components/common/TopicFooterNav';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'Istio Service Mesh Documentation', url: 'https://istio.io/latest/docs/', type: 'official', description: 'Control plane & Envoy sidecar architecture' },
  { title: 'Envoy Proxy Architecture & Features', url: 'https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/arch_overview', type: 'official' },
  { title: 'RFC 8446 – TLS 1.3 Specification', url: 'https://www.rfc-editor.org/rfc/rfc8446', type: 'rfc', rfcNumber: 8446 },
  { title: 'Linkerd Service Mesh Documentation', url: 'https://linkerd.io/2.14/overview/', type: 'official' },
];

interface MeshStep {
  id: string;
  label: string;
  description: string;
  technicalDetail: string;
  from: string;
  to: string;
  protocol: string;
  encrypted: boolean;
  color: string;
}

const MESH_STEPS: MeshStep[] = [
  {
    id: 'ingress',
    label: '1. Ingress Gateway receives external HTTP',
    description: 'External client request arrives at the Istio Ingress Gateway (L7 Envoy Proxy). The gateway terminates external TLS and validates incoming host headers.',
    technicalDetail: 'Envoy processes downstream connections, matches Gateway virtual host rules, and selects target Kubernetes Service endpoints.',
    from: 'Client', to: 'Ingress Gateway',
    protocol: 'HTTPS (Public TLS 1.3)', encrypted: true, color: '#3b82f6',
  },
  {
    id: 'sidecar-a',
    label: '2. Ingress routes to Pod A Sidecar Proxy',
    description: 'Ingress Gateway proxies traffic to Service A. Traffic passes through iptables redirects (`PREROUTING` / `OUTPUT`) directly into Pod A\'s Envoy sidecar.',
    technicalDetail: 'iptables rule `PREROUTING -p tcp -j REDIRECT --to-ports 15001` intercepts raw TCP sockets before application code receives bytes.',
    from: 'Ingress Gateway', to: 'Envoy Sidecar A',
    protocol: 'mTLS (SPIFFE ID)', encrypted: true, color: '#8b5cf6',
  },
  {
    id: 'mtls-handshake',
    label: '3. Mutual TLS Handshake & SPIFFE Validation',
    description: 'Sidecar A and Sidecar B initiate an mTLS handshake. Both sides exchange X.509 certificates containing SANs matching SPIFFE IDs (e.g. `spiffe://cluster.local/ns/default/sa/pod-a`).',
    technicalDetail: 'Cryptographic identity is validated using intermediate CA certs injected by istiod / cert-manager. Both client and server authenticate each other.',
    from: 'Envoy Sidecar A', to: 'Envoy Sidecar B',
    protocol: 'mTLS 1.3 + SAN SPIFFE', encrypted: true, color: '#10b981',
  },
  {
    id: 'policy',
    label: '4. Authorization Policy & Telemetry Check',
    description: 'Sidecar B checks Istio AuthorizationPolicies (RBAC) and metrics filter. If allowed, request is forwarded to Pod B\'s local container over loopback (`127.0.0.1`).',
    technicalDetail: 'Zero-trust network architecture (ZTNA). Even if an attacker gains local network access, unauthenticated traffic without valid SPIFFE certs is rejected with 403 Forbidden.',
    from: 'Envoy Sidecar B', to: 'App B Container',
    protocol: 'HTTP (Plaintext Loopback)', encrypted: false, color: '#f59e0b',
  },
];

export default function ServiceMeshPage() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'mtls' | 'traffic' | 'quiz'>('architecture');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();

  useEffect(() => { markTopicViewed('service-mesh'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep((s) => {
          if (s >= MESH_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('service-mesh'); return s; }
          return s + 1;
        });
      }, Math.round(1500 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const currentStep = MESH_STEPS[animStep];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldCheck size={20} className="text-rose-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">Service Mesh & mTLS</h1>
            <p className="text-sm text-slate-500 mt-0.5">Microservice Security · Envoy · Istio · Zero-Trust</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-pink">Advanced SRE</span>
            <span className="badge-blue">Kubernetes</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-white font-medium">Simple explanation: </span>
            A Service Mesh is like having a private bodyguard (sidecar proxy) attached to every microservice container. 
            Services never talk directly across the open network; instead, proxies handle encrypted authentication, retries, and metrics automatically without developers modifying application code.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-white font-medium">Technical explanation: </span>
            Service Mesh abstracts Layer 7 networking into a separate control plane (e.g. Istiod) and data plane (Envoy proxies). 
            It enforces <strong>Mutual TLS (mTLS)</strong> using SPIFFE/SPIRE identity standards, provides fine-grained traffic splitting (Canary/Blue-Green), circuit breaking, and golden-signal telemetry.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        {(['architecture', 'mtls', 'traffic', 'quiz'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'architecture' ? '🏗️ Sidecar vs Ambient' : tab === 'mtls' ? '🔒 mTLS Flow' : tab === 'traffic' ? '🔀 Traffic Control' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {/* ── Architecture Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5 space-y-3 border border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Network size={16} />
                <span>Sidecar Model (Envoy / Istio classic)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                An Envoy container runs alongside the app container in every Pod. `iptables` rules intercept all ingress and egress TCP connections.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                <li><strong>Pros:</strong> Granular L7 routing, local policy enforcement, no shared kernel permissions needed.</li>
                <li><strong>Cons:</strong> Memory overhead (~50MB per pod) and CPU delay per proxy hop.</li>
              </ul>
            </div>

            <div className="glass rounded-xl p-5 space-y-3 border border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Cpu size={16} />
                <span>Ambient / Sidecar-less Model (Istio Ambient)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Splits mesh functionality into node-level Layer 4 proxies (ZTUNNEL) and optional per-tenant Layer 7 proxies (WAYPOINT).
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                <li><strong>Pros:</strong> Zero pod modification, ~90% lower memory footprint, transparent upgrades.</li>
                <li><strong>Cons:</strong> Relies on Linux eBPF/Geneve tunnels for node-level redirection.</li>
              </ul>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">SPIFFE ID Identity Standard</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Service mesh does not rely on IP addresses for trust (since Kubernetes Pod IPs are ephemeral). Instead, identity is bound to Kubernetes ServiceAccounts via SPIFFE IDs formatted as URIs in X.509 certs.
            </p>
            <CodeBlock
              language="bash"
              filename="spiffe-identity.txt"
              code={`# Example SPIFFE ID embedded in X.509 Subject Alternative Name (SAN)
spiffe://cluster.local/ns/production/sa/payment-service-account`}
            />
          </div>
        </div>
      )}

      {/* ── mTLS Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'mtls' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying}
            currentStep={animStep}
            totalSteps={MESH_STEPS.length}
            speed={speed}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep((s) => Math.min(s + 1, MESH_STEPS.length - 1))}
            onStepBack={() => setAnimStep((s) => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed}
            stepLabel={currentStep.label}
          />

          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6">
            <div className="space-y-3">
              {MESH_STEPS.map((step, idx) => {
                const isCurrent = idx === animStep;
                const isPast = idx < animStep;
                return (
                  <motion.div
                    key={step.id}
                    animate={{ opacity: idx > animStep ? 0.3 : 1 }}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3"
                    style={{
                      borderColor: isCurrent ? step.color : isPast ? `${step.color}30` : 'rgba(255,255,255,0.04)',
                      backgroundColor: isCurrent ? `${step.color}12` : 'transparent',
                    }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0" style={{ backgroundColor: `${step.color}20`, color: step.color }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{step.label}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{step.from} → {step.to}</span>
                        <span className="font-mono text-[10px] text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded">{step.protocol}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={animStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-strong rounded-xl p-5 border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white mb-1" style={{ color: currentStep.color }}>{currentStep.label}</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">{currentStep.description}</p>
              <div className="border-t border-white/[0.06] pt-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Info size={11} /> Technical Mechanism</p>
                <p className="text-xs text-slate-400 font-mono">{currentStep.technicalDetail}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Traffic Control Tab ──────────────────────────────────────────────── */}
      {activeTab === 'traffic' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Canary Deployment & Traffic Splitting</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Istio VirtualServices allow SREs to route 90% of production traffic to `v1` and 10% to `v2` without modifying Kubernetes Services or DNS.
            </p>
            <CodeBlock
              language="yaml"
              filename="virtual-service-canary.yaml"
              code={`apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: payment-route
spec:
  hosts:
  - payment-service
  http:
  - route:
    - destination:
        host: payment-service
        subset: v1
      weight: 90
    - destination:
        host: payment-service
        subset: v2
      weight: 10`}
            />
          </div>
        </div>
      )}

      {/* ── Quiz Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'quiz' && <Quiz topicId="service-mesh" />}

      {/* Commands */}
      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Service Mesh CLI Commands</span></div>
      <CodeBlock
        language="bash"
        filename="service-mesh-debug.sh"
        code={`# Check Istio installation and control plane status
istioctl analyze
istioctl version

# Verify mTLS status for a specific namespace
istioctl authn tls-check payment-pod-1234.default

# Inspect Envoy proxy configuration (clusters, listeners, routes)
istioctl proxy-config endpoints payment-pod-1234.default
istioctl proxy-config secret payment-pod-1234.default   # View active X.509 certs & SPIFFE ID

# Dump Envoy stats directly from proxy container
kubectl exec -it payment-pod-1234 -c istio-proxy -- curl localhost:15000/stats | grep ssl`}
      />

      <div className="mt-8">
        <ReferencePanel references={REFERENCES} />
      </div>

      <TopicFooterNav currentTopicId="service-mesh" />
    </div>
  );
}
