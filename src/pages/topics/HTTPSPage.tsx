import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Info } from 'lucide-react';
import AnimationControls from '../../components/shared/AnimationControls';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'RFC 8446 – TLS 1.3', url: 'https://www.rfc-editor.org/rfc/rfc8446', type: 'rfc', rfcNumber: 8446, description: 'Current TLS specification' },
  { title: 'RFC 5246 – TLS 1.2', url: 'https://www.rfc-editor.org/rfc/rfc5246', type: 'rfc', rfcNumber: 5246 },
  { title: 'RFC 8555 – ACME / Let\'s Encrypt', url: 'https://www.rfc-editor.org/rfc/rfc8555', type: 'rfc', rfcNumber: 8555 },
  { title: 'RFC 9110 – HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110', type: 'rfc', rfcNumber: 9110 },
  { title: 'AWS Certificate Manager (ACM)', url: 'https://docs.aws.amazon.com/acm/', type: 'aws' },
  { title: 'cert-manager (Kubernetes)', url: 'https://cert-manager.io/docs/', type: 'k8s' },
];

const TLS13_STEPS = [
  { id: 'tcp', label: 'TCP Connect', from: 'Client', to: 'Server', color: '#3b82f6', description: 'TCP 3-way handshake first (SYN/SYN-ACK/ACK). TLS is layered on top of TCP.', detail: 'TLS itself needs TCP reliability. Before any TLS message, a full TCP connection must be established to port 443.' },
  { id: 'clienthello', label: 'ClientHello', from: 'Client', to: 'Server', color: '#8b5cf6', description: 'Client sends TLS version, supported cipher suites, random nonce, and its ECDHE key share.', detail: 'TLS 1.3 ClientHello: supported_versions=[TLS1.3], cipher_suites=[TLS_AES_256_GCM_SHA384, ...], key_share=[secp256r1 ECDHE public key], random=32-byte nonce. SNI (Server Name Indication) extension tells the server which hostname is requested — crucial for virtual hosting.' },
  { id: 'serverhello', label: 'ServerHello + {EncryptedExtensions}', from: 'Server', to: 'Client', color: '#8b5cf6', description: 'Server picks cipher suite, sends its ECDHE key share. Both sides can now derive the handshake keys.', detail: 'Server selects cipher: TLS_AES_256_GCM_SHA384. Server key_share (ECDHE public key). Both sides compute: shared_secret = ECDHE(client_private, server_public). Handshake keys derived via HKDF. Everything after this is encrypted.' },
  { id: 'certificate', label: '{Certificate} + {CertificateVerify}', from: 'Server', to: 'Client', color: '#10b981', description: 'Server sends its X.509 certificate (encrypted) and a signature proving it owns the private key.', detail: 'Certificate chain: Root CA → Intermediate CA → Leaf cert (for example.com). CertificateVerify contains a signature over the entire handshake using the server\'s private key. Client verifies: (1) signature valid? (2) cert chain trusted? (3) cert not expired? (4) CN/SAN matches hostname?' },
  { id: 'finished', label: '{Finished}', from: 'Server', to: 'Client', color: '#10b981', description: 'Server sends Finished MAC to verify handshake integrity. Client validates it.', detail: 'Finished = HMAC over all handshake messages using the finished_key derived from handshake secret. Detects any tampering with the handshake. Client also sends its own Finished.' },
  { id: 'appdata', label: 'Application Data (Encrypted)', from: 'Client', to: 'Server', color: '#f59e0b', description: 'Handshake complete. HTTPS traffic flows encrypted. Total: 1 RTT (vs TLS 1.2\'s 2 RTT).', detail: 'Application keys derived from master secret via HKDF. AES-256-GCM provides authenticated encryption. Each record has a unique nonce. 0-RTT (early data) allows sending data with the first ClientHello for resumed sessions — but has replay risks (RFC 8470).' },
];

const TLS_COMPARISON = [
  { prop: 'RTT to first byte', v12: '2 RTT', v13: '1 RTT (+ 0-RTT for resumption)' },
  { prop: 'Key Exchange', v12: 'RSA (static) or DHE/ECDHE', v13: 'ECDHE only (forward secrecy mandatory)' },
  { prop: 'Forward Secrecy', v12: 'Optional (RSA mode has none)', v13: 'Always (ECDHE is required)' },
  { prop: 'Cipher Suites', v12: '37+ (many weak)', v13: '5 (all strong AEAD)' },
  { prop: 'Certificate in flight', v12: 'Unencrypted', v13: 'Encrypted' },
  { prop: 'Downgrade protection', v12: 'Partial', v13: 'Strong (via version negotiation)' },
];

export default function HTTPSPage() {
  const [activeTab, setActiveTab] = useState<'handshake' | 'comparison' | 'certs' | 'quiz'>('handshake');
  const [animStep, setAnimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markTopicViewed, markAnimationCompleted } = useProgress();
  useEffect(() => { markTopicViewed('https'); }, [markTopicViewed]);

  const clearTimer = useCallback(() => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimStep(s => {
          if (s >= TLS13_STEPS.length - 1) { setIsPlaying(false); markAnimationCompleted('https'); return s; }
          return s + 1;
        });
      }, Math.round(1400 / speed));
    } else { clearTimer(); }
    return clearTimer;
  }, [isPlaying, speed, clearTimer, markAnimationCompleted]);

  const current = TLS13_STEPS[animStep];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Lock size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">HTTPS & TLS 1.3</h1>
            <p className="text-sm text-slate-500 mt-0.5">Transport Security · RFC 8446</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-green">L5-L7</span>
            <span className="badge-amber">Intermediate</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Simple: </span>
            HTTPS = HTTP + TLS. TLS is like a sealed envelope — even if someone intercepts your letter, they can't read it. Before data flows, both sides prove who they are (certificate) and negotiate a shared secret key (ECDHE), all in 1 round-trip.
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-medium">Technical (RFC 8446): </span>
            TLS 1.3 establishes an encrypted channel using Elliptic Curve Diffie-Hellman Ephemeral (ECDHE) key exchange for perfect forward secrecy, X.509 certificates for authentication, and AEAD ciphers (AES-GCM, ChaCha20-Poly1305) for data. The handshake completes in 1 RTT (vs TLS 1.2's 2 RTT). All cipher suites provide forward secrecy — a compromised server private key cannot decrypt past sessions.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['handshake', 'comparison', 'certs', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'handshake' ? '🔐 TLS 1.3 Handshake' : tab === 'comparison' ? '⚡ TLS 1.2 vs 1.3' : tab === 'certs' ? '📜 Certificates' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'handshake' && (
        <div className="space-y-5">
          <AnimationControls
            isPlaying={isPlaying} currentStep={animStep} totalSteps={TLS13_STEPS.length} speed={speed}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            onReset={() => { setIsPlaying(false); setAnimStep(0); }}
            onStepForward={() => setAnimStep(s => Math.min(s + 1, TLS13_STEPS.length - 1))}
            onStepBack={() => setAnimStep(s => Math.max(s - 1, 0))}
            onSpeedChange={setSpeed} stepLabel={current.label}
          />

          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6">
            <div className="grid grid-cols-3 mb-5">
              {['💻 Client', '🌐 Network', '🖥️ Server (443)'].map(h => (
                <div key={h} className="text-center text-sm font-medium text-slate-400">{h}</div>
              ))}
            </div>
            <div className="space-y-2">
              {TLS13_STEPS.map((step, idx) => {
                const isCurrent = idx === animStep;
                const isPast = idx < animStep;
                const isClient = step.from === 'Client';
                return (
                  <motion.div key={step.id} animate={{ opacity: idx > animStep ? 0.2 : 1 }}
                    className="grid grid-cols-3 items-center gap-2">
                    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                      {isClient && (
                        <div className="text-xs px-2 py-1 rounded-lg border font-mono"
                          style={{ borderColor: isCurrent ? step.color : `${step.color}30`, backgroundColor: isCurrent ? `${step.color}12` : 'transparent', color: isCurrent ? step.color : '#475569' }}>
                          {step.label.length > 20 ? step.label.slice(0, 20) + '…' : step.label}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className="flex-1 h-px" style={{ backgroundColor: isCurrent ? step.color : isPast ? `${step.color}40` : '#1e293b' }} />
                      <div className="text-[10px] px-1" style={{ color: isCurrent ? step.color : '#475569' }}>→</div>
                      <div className="flex-1 h-px" style={{ backgroundColor: isCurrent ? step.color : isPast ? `${step.color}40` : '#1e293b' }} />
                    </div>
                    <div className={`flex ${!isClient ? 'justify-start' : 'justify-end'}`}>
                      {!isClient && (
                        <div className="text-xs px-2 py-1 rounded-lg border font-mono"
                          style={{ borderColor: isCurrent ? step.color : `${step.color}30`, backgroundColor: isCurrent ? `${step.color}12` : 'transparent', color: isCurrent ? step.color : '#475569' }}>
                          {step.label.length > 20 ? step.label.slice(0, 20) + '…' : step.label}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={animStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-white">{current.label}</h3>
                <div className="flex gap-1 shrink-0">
                  {[6, 5, 4].map(l => <OSILayerBadge key={l} layer={l as 4|5|6} size="sm" active={animStep >= 1} />)}
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{current.description}</p>
              <div className="border-t border-white/[0.06] pt-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Info size={10} /> Technical</p>
                <p className="text-xs text-slate-400 leading-relaxed">{current.detail}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold mb-1">
            <div className="text-slate-500">Property</div>
            <div className="text-slate-400">TLS 1.2 (RFC 5246)</div>
            <div className="text-emerald-400">TLS 1.3 (RFC 8446)</div>
          </div>
          {TLS_COMPARISON.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 glass rounded-xl px-4 py-3">
              <div className="text-xs font-medium text-slate-400">{row.prop}</div>
              <div className="text-xs text-slate-400">{row.v12}</div>
              <div className="text-xs text-emerald-300">{row.v13}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'certs' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3">X.509 Certificate Chain</h3>
            {[
              { label: 'Root CA', color: '#f59e0b', desc: 'Self-signed. Pre-installed in OS/browser trust store. Never directly issues end-entity certs. Example: ISRG Root X1 (Let\'s Encrypt).' },
              { label: 'Intermediate CA', color: '#8b5cf6', desc: 'Signed by Root CA. Issues end-entity certificates. Kept online. Allows Root CA to stay offline for security.' },
              { label: 'Leaf Certificate', color: '#10b981', desc: 'Issued to example.com. Contains SAN (Subject Alternative Names) with valid hostnames. Has expiry date and public key.' },
            ].map((c, i) => (
              <div key={i} className="flex items-start gap-3 mb-3">
                <div className="w-1 h-full min-h-[40px] rounded" style={{ backgroundColor: `${c.color}40` }} />
                <div>
                  <div className="text-sm font-medium mb-0.5" style={{ color: c.color }}>{c.label}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">☁️ Certificate Management</p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div><span className="text-white">AWS ACM:</span> Free certificates, auto-renewed. Use with ALB, CloudFront. Cannot export private key.</div>
              <div><span className="text-white">Let's Encrypt (ACME):</span> Free, 90-day certs via RFC 8555 ACME protocol. Auto-renewed with certbot.</div>
              <div><span className="text-white">cert-manager (K8s):</span> Kubernetes operator that provisions certs from Let's Encrypt, AWS ACM, Vault etc.</div>
              <div><span className="text-white">Kubernetes Ingress TLS:</span> TLS secret (tls.crt + tls.key) mounted to Ingress controller for termination.</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="https" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">Linux Commands</span></div>
      <CodeBlock language="bash" filename="tls-commands.sh" code={`# Inspect a TLS certificate
openssl s_client -connect google.com:443 -servername google.com </dev/null 2>/dev/null | \\
  openssl x509 -text -noout | grep -E 'Subject:|Issuer:|Not After|SAN'

# Check TLS version and cipher negotiated
curl -vI https://google.com 2>&1 | grep -E 'SSL|TLS|cipher'

# Verify certificate chain
openssl s_client -connect google.com:443 -showcerts </dev/null

# Check certificate expiry
echo | openssl s_client -connect google.com:443 2>/dev/null | \\
  openssl x509 -noout -enddate

# Test specific TLS version
curl --tlsv1.3 --tls-max 1.3 https://google.com -I

# Capture TLS handshake (before decryption)
sudo tcpdump -i eth0 -n 'tcp port 443 and (tcp[tcpflags] & tcp-syn != 0)'

# certbot — Let's Encrypt certificate
sudo certbot certonly --standalone -d example.com
sudo certbot renew --dry-run

# cert-manager (Kubernetes)
kubectl get certificate -A
kubectl describe certificate myapp-tls -n default`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
