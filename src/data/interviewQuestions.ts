export interface InterviewQuestion {
  id: string;
  track: 'devops' | 'sre' | 'cloud' | 'kubernetes' | 'security';
  difficulty: 'junior' | 'mid' | 'senior';
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  rfcNote?: string;
  tags: string[];
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // ── DevOps Track ───────────────────────────────────────────────────────────
  {
    id: 'devops-1',
    track: 'devops',
    difficulty: 'junior',
    question: 'What happens when you type a URL into a browser and press Enter?',
    shortAnswer: 'DNS → TCP handshake → TLS → HTTP request → server response → render.',
    detailedAnswer: `1. **DNS Resolution**: Browser checks local cache, then OS resolver, then recursive DNS resolver → root NS → TLD NS → authoritative NS → A record returned.
2. **TCP 3-Way Handshake**: SYN → SYN-ACK → ACK to port 80/443 (RFC 9293).
3. **TLS Handshake** (HTTPS): ClientHello → ServerHello + Certificate → ECDHE key exchange → Finished. TLS 1.3 completes in 1 RTT (RFC 8446).
4. **HTTP Request**: GET / HTTP/1.1 with Host header and other metadata.
5. **Server Processing**: Web server (Nginx/Node) handles request, optionally queries DB.
6. **HTTP Response**: 200 OK with HTML body, Content-Type, cache headers.
7. **Browser Rendering**: HTML parse → CSS/JS download → DOM construction → paint.`,
    tags: ['dns', 'tcp', 'tls', 'http', 'full-stack'],
  },
  {
    id: 'devops-2',
    track: 'devops',
    difficulty: 'junior',
    question: 'What is the difference between a process listening on 0.0.0.0 vs 127.0.0.1?',
    shortAnswer: '0.0.0.0 listens on all interfaces (all IPs); 127.0.0.1 only accepts loopback connections.',
    detailedAnswer: `**127.0.0.1 (loopback)**: Service only accepts connections from the same machine. No external traffic can reach it. Used for local inter-process communication.
    
**0.0.0.0 (INADDR_ANY)**: Service binds to all available network interfaces — loopback, LAN interfaces, Docker bridges, VPN tunnels. External clients can connect if firewall permits.

**::/0 (IPv6 INADDR6_ANY)**: Same concept for IPv6 — binds to all IPv6 interfaces.

Security implication: A database (PostgreSQL:5432) should bind to 127.0.0.1. Accidentally binding to 0.0.0.0 exposes it to the network. Always verify with: \`ss -tulpn | grep 5432\``,
    rfcNote: 'RFC 5735 §3',
    tags: ['networking', 'security', 'linux', 'sockets'],
  },
  {
    id: 'devops-3',
    track: 'devops',
    difficulty: 'mid',
    question: 'Explain the difference between a reverse proxy and a load balancer.',
    shortAnswer: 'A reverse proxy handles requests on behalf of a single server (TLS, caching, routing). A load balancer distributes requests across multiple backend servers.',
    detailedAnswer: `**Reverse Proxy** (e.g. Nginx, Traefik):
- Sits in front of one or more servers
- Terminates TLS (SSL offloading)
- Provides caching, compression, request modification
- Hides backend server identity
- Can do L7 routing (path-based, header-based)

**Load Balancer**:
- Distributes traffic across multiple backend instances
- L4 (NLB): routes by IP:port, very fast, no HTTP inspection
- L7 (ALB): routes by HTTP headers/paths, does TLS termination, sticky sessions
- Performs health checks and removes unhealthy backends

**In practice**: Nginx/Traefik can act as both. AWS ALB = reverse proxy + L7 load balancer. Most production stacks use both (CDN → ALB → Nginx pods → App).`,
    tags: ['load-balancing', 'nginx', 'proxy', 'aws'],
  },
  {
    id: 'devops-4',
    track: 'devops',
    difficulty: 'mid',
    question: 'Your CI/CD pipeline cannot reach an external package registry from within Docker. What are the likely causes?',
    shortAnswer: 'Docker DNS resolution failure, network bridge isolation, iptables rules, or missing --network flag.',
    detailedAnswer: `**Likely causes & debug steps**:
1. **DNS**: Container may not resolve external hostnames. Check: \`docker run --rm busybox nslookup registry.npmjs.org\`. Fix: add \`--dns 8.8.8.8\` or configure Docker daemon DNS.
2. **iptables forwarding**: Docker adds MASQUERADE rules but iptables forwarding may be disabled. Check: \`sysctl net.ipv4.ip_forward\`. Fix: \`sysctl -w net.ipv4.ip_forward=1\`.
3. **Firewall**: Corporate firewall blocking egress on port 443. Check: \`curl -v https://registry.npmjs.org\` from container.
4. **Bridge network isolation**: Using a custom bridge network without internet access. Fix: \`docker network create --driver bridge --opt com.docker.network.bridge.enable_ip_masquerade=true mynet\`.
5. **HTTP proxy**: Behind corporate proxy — set \`HTTP_PROXY/HTTPS_PROXY\` env vars in Docker daemon config.`,
    tags: ['docker', 'networking', 'dns', 'iptables', 'ci-cd'],
  },

  // ── SRE Track ─────────────────────────────────────────────────────────────
  {
    id: 'sre-1',
    track: 'sre',
    difficulty: 'mid',
    question: 'How would you diagnose a TCP connection timeout vs a connection refused error?',
    shortAnswer: 'Timeout = packet dropped silently (firewall/routing). Refused = RST received (port not listening).',
    detailedAnswer: `**Connection Refused (RST received)**:
- The remote host responded with TCP RST flag
- Cause: No process listening on that port, or application crashed
- Symptom: Near-instant failure: "Connection refused"
- Debug: \`ss -tulpn\` on target to check listening sockets

**Connection Timeout (SYN never ACKed)**:
- The SYN packet was silently dropped
- Cause: Firewall rule DROP (not REJECT), wrong route, NACLs, Security Group missing inbound rule
- Symptom: Hangs for 30s–120s before timing out
- Debug: \`tcpdump -i eth0 'host TARGET and tcp port PORT'\` — do you see repeated SYNs with no SYN-ACK?

**Key tools**: \`traceroute\`, \`mtr\`, \`nc -zv host port\`, \`curl -v\`, \`tcpdump\``,
    rfcNote: 'RFC 9293',
    tags: ['tcp', 'debugging', 'firewall', 'networking'],
  },
  {
    id: 'sre-2',
    track: 'sre',
    difficulty: 'senior',
    question: 'What is the TIME_WAIT state in TCP and why can it cause problems at high request rates?',
    shortAnswer: 'TIME_WAIT holds closed connections for 2×MSL (60–120s) to absorb delayed duplicates. At high RPS, port exhaustion can occur.',
    detailedAnswer: `**TIME_WAIT (RFC 9293 §3.6.1)**:
The active closer (initiates FIN) enters TIME_WAIT for 2×MSL (Maximum Segment Lifetime = 60s). This prevents delayed duplicate segments from being misinterpreted by new connections on the same 4-tuple.

**Problem at scale**: Each outbound connection from a client uses an ephemeral port (32768–60999 by default on Linux). If a service makes >28,000 requests per 60s to the same IP:port, it exhausts the ephemeral port range — new connections fail with "Cannot assign requested address".

**Solutions**:
1. Enable \`SO_REUSEADDR\` / \`SO_REUSEPORT\` on sockets
2. Tune \`net.ipv4.tcp_tw_reuse=1\` (allow reuse of TIME_WAIT sockets for new outbound connections)
3. Increase ephemeral port range: \`net.ipv4.ip_local_port_range = 1024 65535\`
4. Use HTTP keep-alive connections (connection pooling) to avoid per-request TCP handshakes
5. Spread outbound traffic across multiple source IPs`,
    rfcNote: 'RFC 9293 §3.6.1',
    tags: ['tcp', 'sre', 'performance', 'linux', 'tuning'],
  },
  {
    id: 'sre-3',
    track: 'sre',
    difficulty: 'mid',
    question: 'An HTTP service shows high 502 errors from Nginx. How do you debug it?',
    shortAnswer: 'Check if upstream app is running, check Nginx error logs, verify upstream socket/port, check app health endpoint.',
    detailedAnswer: `**502 Bad Gateway = Nginx received invalid/no response from upstream.**

**Step 1 — Check Nginx error logs**:
\`sudo tail -f /var/log/nginx/error.log\`
Look for: "connect() failed", "no live upstreams", "upstream timed out"

**Step 2 — Is the upstream running?**
\`ss -tulpn | grep 8080\` — is app listening?
\`systemctl status myapp\` / \`docker ps\`

**Step 3 — Direct upstream health check**:
\`curl -v http://127.0.0.1:8080/healthz\`
Bypasses Nginx. If this fails, app is the problem.

**Step 4 — Check resource limits**:
Is app OOMKilled? \`dmesg | grep oom-killer\`
Too many connections? Check app logs for "too many open files"

**Step 5 — Nginx upstream config**:
Review \`proxy_read_timeout\`, \`keepalive\` settings. Increase if app is slow.`,
    tags: ['nginx', 'http', 'debugging', 'sre', 'observability'],
  },

  // ── Cloud Track ───────────────────────────────────────────────────────────
  {
    id: 'cloud-1',
    track: 'cloud',
    difficulty: 'junior',
    question: 'What is the difference between an AWS Security Group and a Network ACL?',
    shortAnswer: 'Security Groups are stateful (instance-level). NACLs are stateless (subnet-level).',
    detailedAnswer: `**Security Groups**:
- Attached to EC2 instance ENI (Elastic Network Interface)
- **Stateful**: If outbound is allowed, return inbound traffic is automatically permitted
- Supports ALLOW rules only (no explicit DENY)
- Evaluated as a set (all rules checked)
- Default: deny all inbound, allow all outbound

**Network ACLs**:
- Applied at the Subnet boundary
- **Stateless**: Must explicitly allow BOTH inbound request AND outbound response
- Supports ALLOW and DENY rules
- Rules evaluated in order (lowest number first)
- Default VPC NACL allows all traffic

**Rule of thumb**: Use Security Groups for per-instance control. Use NACLs for subnet-wide deny rules (e.g. block specific IP ranges).`,
    tags: ['aws', 'vpc', 'security', 'cloud'],
  },
  {
    id: 'cloud-2',
    track: 'cloud',
    difficulty: 'mid',
    question: 'How does AWS Route 53 latency-based routing work?',
    shortAnswer: 'Route 53 measures latency from the client to each AWS region and returns the record pointing to the lowest-latency region.',
    detailedAnswer: `Route 53 Latency-Based Routing (LBR) uses AWS's database of measured internet latencies from various ISPs and geographic locations to route users to the AWS region with the lowest measured latency.

**How it works**:
1. Client makes DNS query to Route 53
2. Route 53 identifies the client's approximate location from the source IP (using AWS latency database, not geolocation)
3. Route 53 selects the region with historically lowest latency from that location
4. Returns the A/ALIAS record pointing to the resource in that region (e.g. ALB in us-east-1 vs eu-west-1)

**Important**: This is NOT the same as geographic routing. A user in Europe might be routed to us-east-1 if measured latency is lower. Updated continuously as AWS collects real measurements.

**Combined with health checks**: Only routes to healthy endpoints. If primary region fails health check, Route 53 routes to next-best region automatically (DNS failover).`,
    tags: ['aws', 'route53', 'dns', 'cloud', 'latency'],
  },

  // ── Kubernetes Track ──────────────────────────────────────────────────────
  {
    id: 'k8s-1',
    track: 'kubernetes',
    difficulty: 'mid',
    question: 'A Pod cannot communicate with another Pod in the same cluster. What do you check first?',
    shortAnswer: 'Check NetworkPolicy, CNI plugin status, Pod IP allocation, kube-proxy logs, and coreDNS.',
    detailedAnswer: `**Systematic debug approach**:

1. **Verify Pod IPs**: \`kubectl get pods -o wide\` — do both pods have IPs?

2. **Test direct pod-to-pod connectivity**:
\`kubectl exec -it pod-a -- curl http://10.244.1.5:8080\`
Can you reach the target pod IP directly?

3. **Check NetworkPolicy**: 
\`kubectl get networkpolicy -A\`
A NetworkPolicy that selects the target pod without an ingress rule from source will block traffic silently.

4. **CNI plugin status**:
\`kubectl get pods -n kube-system | grep cni\`
Is Calico/Cilium/Flannel healthy?

5. **DNS issue (if using Service name)**:
\`kubectl exec -it pod-a -- nslookup service-b.default.svc.cluster.local\`
Is CoreDNS resolving correctly?

6. **kube-proxy**:
\`kubectl logs -n kube-system kube-proxy-xxxx\`
Are iptables rules being synced?`,
    tags: ['kubernetes', 'networking', 'debugging', 'cni', 'networkpolicy'],
  },
  {
    id: 'k8s-2',
    track: 'kubernetes',
    difficulty: 'senior',
    question: 'How does a Kubernetes Service of type LoadBalancer work end-to-end on AWS EKS?',
    shortAnswer: 'K8s creates an NLB/ALB via cloud-controller-manager. Traffic flows: NLB → NodePort → iptables/IPVS → Pod.',
    detailedAnswer: `**End-to-end flow on AWS EKS**:

1. **Service creation**: \`kubectl apply\` a Service with \`type: LoadBalancer\`
2. **cloud-controller-manager**: The EKS cloud controller detects the new service and calls AWS APIs to provision an NLB (or ALB with AWS Load Balancer Controller)
3. **NLB configuration**: AWS creates an NLB with listeners and target groups. Target group targets are the EC2 node instance IDs + NodePort
4. **NodePort**: K8s allocates a NodePort (30000–32767) on every node. NLB sends traffic to \`AnyNode:NodePort\`
5. **kube-proxy / iptables**: On the receiving node, iptables DNAT rules redirect NodePort traffic to a randomly selected Pod IP:containerPort (across all nodes if needed)
6. **Pod receives traffic**: Pod sees traffic from the node IP (or pod IP with hairpin mode)

**With AWS Load Balancer Controller (ALB)**: Supports Ingress, path-based routing, WAF integration. Targets pods directly (IP mode) for better performance.`,
    tags: ['kubernetes', 'aws', 'eks', 'load-balancing', 'cloud'],
  },

  // ── Security Track ────────────────────────────────────────────────────────
  {
    id: 'security-1',
    track: 'security',
    difficulty: 'mid',
    question: 'What is a TLS certificate chain and why does it matter?',
    shortAnswer: 'A chain of trust from server certificate → intermediate CA → root CA. Browsers verify the full chain.',
    detailedAnswer: `**Certificate Chain Structure**:
1. **Server Certificate**: Issued to your domain (e.g. example.com). Signed by Intermediate CA.
2. **Intermediate CA Certificate**: Signed by Root CA. Not in browsers by default — must be served by server.
3. **Root CA Certificate**: Self-signed. Pre-installed in OS/browser trust stores (e.g. Let's Encrypt ISRG Root X1).

**Verification process** (RFC 5280):
Browser receives server cert → verifies signature using Intermediate CA public key → verifies Intermediate CA signature using Root CA → checks Root CA is in trust store → verifies certificate validity period, hostname (SAN), and revocation (OCSP/CRL).

**Common issues**:
- **Incomplete chain**: Server doesn't send Intermediate CA cert → "certificate verify failed" on some clients
- **Expired cert**: Certificate past NotAfter date → 502/SSL handshake failure
- **Hostname mismatch**: CN/SAN doesn't match requested hostname → browser warning
- **Self-signed in prod**: Not in trust store → clients reject unless manually trusted

**DevOps/SRE context**: Use \`openssl s_client -connect host:443 -showcerts\` to inspect the full chain.`,
    rfcNote: 'RFC 5280',
    tags: ['tls', 'https', 'security', 'certificates', 'pki'],
  },
  {
    id: 'security-2',
    track: 'security',
    difficulty: 'senior',
    question: 'Explain how SSRF (Server-Side Request Forgery) can be exploited in a cloud environment.',
    shortAnswer: 'SSRF tricks the server into making requests to internal services. On AWS, this can expose IMDSv1 credentials via 169.254.169.254.',
    detailedAnswer: `**SSRF Attack Flow on AWS**:
1. Application accepts user-supplied URL and fetches it server-side (e.g. image preview, webhook, PDF renderer)
2. Attacker provides URL: \`http://169.254.169.254/latest/meta-data/iam/security-credentials/\`
3. Server-side request hits AWS Instance Metadata Service (IMDS)
4. Response contains IAM role credentials (Access Key, Secret, Session Token)
5. Attacker uses credentials to access S3, RDS, secrets, etc.

**Why 169.254.169.254?** This is the link-local IP (RFC 3927) for AWS IMDS — only accessible from the instance itself, but SSRF routes the server's own request there.

**Mitigations**:
- **IMDSv2** (require PUT-based token): SSRF via IMDS now requires a session token fetched via PUT request — simple HTTP GET attacks fail
- **Block 169.254.169.254** at WAF/network level for internet-facing services
- **Input validation**: Allowlist trusted URL patterns/domains
- **Zero-trust networking**: Restrict outbound network from application pods`,
    tags: ['security', 'aws', 'cloud', 'ssrf', 'imds'],
  },
];
