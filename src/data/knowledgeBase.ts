import type { KnowledgeEntry } from '../types';

const knowledgeBase: KnowledgeEntry[] = [
  {
    id: 'osi-1',
    keywords: ['osi', 'model', 'layers', 'seven', '7'],
    question: 'What is the OSI model?',
    answer:
      'The OSI (Open Systems Interconnection) model is a conceptual framework standardised by ISO/IEC 7498-1 that divides network communication into 7 layers. From bottom to top: Physical (1), Data Link (2), Network (3), Transport (4), Session (5), Presentation (6), Application (7). Each layer has a defined role and communicates with the layer above and below it via well-defined interfaces.',
    topicId: 'osi-model',
    references: [
      { title: 'ISO/IEC 7498-1', url: 'https://www.iso.org/standard/20269.html', type: 'official' },
    ],
    confidence: 'high',
  },
  {
    id: 'osi-pdu',
    keywords: ['pdu', 'protocol data unit', 'segment', 'frame', 'packet', 'bit'],
    question: 'What are PDUs at each OSI layer?',
    answer:
      'PDUs by layer: Layer 7/6/5 → Data, Layer 4 (Transport) → Segment (TCP) or Datagram (UDP), Layer 3 (Network) → Packet, Layer 2 (Data Link) → Frame, Layer 1 (Physical) → Bit/Symbol. Encapsulation adds headers going down; decapsulation strips them going up.',
    topicId: 'osi-model',
    confidence: 'high',
  },
  {
    id: 'tcp-handshake',
    keywords: ['tcp', 'handshake', 'three-way', 'syn', 'syn-ack', 'connection'],
    question: 'How does the TCP three-way handshake work?',
    answer:
      'Per RFC 9293: 1) Client sends SYN with its Initial Sequence Number (ISN). 2) Server responds SYN-ACK acknowledging ISN+1 and sending its own ISN. 3) Client sends ACK acknowledging server ISN+1. Connection is ESTABLISHED after step 3.',
    topicId: 'tcp',
    references: [
      { title: 'RFC 9293', url: 'https://www.rfc-editor.org/rfc/rfc9293', type: 'rfc', rfcNumber: 9293 },
    ],
    confidence: 'high',
  },
  {
    id: 'tcp-flags',
    keywords: ['tcp', 'flags', 'syn', 'ack', 'fin', 'rst', 'psh', 'urg'],
    question: 'What are TCP flags?',
    answer:
      'TCP control bits (RFC 9293): SYN – synchronise sequence numbers. ACK – acknowledges received data. FIN – no more data from sender (graceful close). RST – reset/abort connection. PSH – push data to application immediately. URG – urgent pointer field is significant. ECE/CWR – Explicit Congestion Notification (RFC 3168).',
    topicId: 'tcp',
    confidence: 'high',
  },
  {
    id: 'tcp-termination',
    keywords: ['tcp', 'close', 'fin', 'four-way', 'termination', 'time_wait'],
    question: 'How does TCP connection termination work?',
    answer:
      'Four-way handshake (RFC 9293): 1) Active closer sends FIN. 2) Passive closer ACKs. 3) Passive closer sends FIN. 4) Active closer ACKs. Active closer then enters TIME_WAIT for 2×MSL (60–120s) to handle delayed duplicates.',
    topicId: 'tcp',
    confidence: 'high',
  },
  {
    id: 'dns-resolution',
    keywords: ['dns', 'resolution', 'recursive', 'iterative', 'resolver', 'nameserver'],
    question: 'How does DNS resolution work?',
    answer:
      'Per RFC 1034/1035: Stub resolver → OS cache → recursive resolver → root NS → TLD NS → authoritative NS → answer. The stub does recursive queries; the resolver does iterative queries. Results cached per TTL.',
    topicId: 'dns',
    references: [
      { title: 'RFC 1034', url: 'https://www.rfc-editor.org/rfc/rfc1034', type: 'rfc', rfcNumber: 1034 },
      { title: 'RFC 1035', url: 'https://www.rfc-editor.org/rfc/rfc1035', type: 'rfc', rfcNumber: 1035 },
    ],
    confidence: 'high',
  },
  {
    id: 'dns-records',
    keywords: ['dns', 'record', 'a', 'aaaa', 'mx', 'cname', 'txt', 'ns', 'ptr', 'soa'],
    question: 'What are common DNS record types?',
    answer:
      'A – IPv4 address. AAAA – IPv6 address. CNAME – Canonical name/alias. MX – Mail exchange. TXT – Arbitrary text (SPF/DKIM). NS – Nameserver delegation. PTR – Reverse DNS. SOA – Start of Authority (zone metadata). SRV – Service locator (RFC 2782).',
    topicId: 'dns',
    confidence: 'high',
  },
  {
    id: 'ip-private',
    keywords: ['private', 'ip', 'rfc 1918', '10.', '172.16', '192.168'],
    question: 'What are private IP address ranges?',
    answer:
      'RFC 1918 private ranges: 10.0.0.0/8 (16.7M addresses), 172.16.0.0/12 (1M addresses), 192.168.0.0/16 (65K addresses). Also: 127.0.0.0/8 loopback (RFC 5735), 169.254.0.0/16 APIPA (RFC 3927), 100.64.0.0/10 CGN (RFC 6598).',
    topicId: 'ip-addressing',
    references: [
      { title: 'RFC 1918', url: 'https://www.rfc-editor.org/rfc/rfc1918', type: 'rfc', rfcNumber: 1918 },
    ],
    confidence: 'high',
  },
  {
    id: 'cidr',
    keywords: ['cidr', 'classless', 'subnet', 'mask', '/24', 'prefix'],
    question: 'What is CIDR notation?',
    answer:
      'CIDR (RFC 4632) replaced classful addressing. Format: network/prefix-length (e.g. 192.168.1.0/24). The prefix is the number of 1-bits in the subnet mask. /24 = 254 usable hosts, /16 = 65534, /30 = 2 (point-to-point), /31 = 2 no-broadcast (RFC 3021), /32 = single host.',
    topicId: 'ip-addressing',
    references: [
      { title: 'RFC 4632 – CIDR', url: 'https://www.rfc-editor.org/rfc/rfc4632', type: 'rfc', rfcNumber: 4632 },
    ],
    confidence: 'high',
  },
  {
    id: 'arp-basic',
    keywords: ['arp', 'address resolution', 'mac', 'who has'],
    question: 'How does ARP work?',
    answer:
      'ARP (RFC 826) resolves IPv4 to MAC on a local network. 1) Check ARP cache. 2) If miss, broadcast ARP Request to FF:FF:FF:FF:FF:FF. 3) Target host replies unicast with its MAC. 4) Update cache. ARP only works within a broadcast domain; cross-subnet traffic goes to the gateway MAC.',
    topicId: 'arp',
    references: [
      { title: 'RFC 826 – ARP', url: 'https://www.rfc-editor.org/rfc/rfc826', type: 'rfc', rfcNumber: 826 },
    ],
    confidence: 'high',
  },
  {
    id: 'gratuitous-arp',
    keywords: ['gratuitous', 'garp', 'arp', 'duplicate', 'announcement'],
    question: 'What is a Gratuitous ARP?',
    answer:
      'A Gratuitous ARP (GARP) is an ARP Request where sender IP = target IP. It announces a MAC mapping. Uses: duplicate IP detection, cache refresh after MAC change, HA cluster IP takeover (VRRP/keepalived). All hosts on the segment update their caches.',
    topicId: 'arp',
    confidence: 'high',
  },
  {
    id: 'latency-bandwidth',
    keywords: ['latency', 'bandwidth', 'throughput', 'difference', 'rtt'],
    question: 'What is the difference between latency and bandwidth?',
    answer:
      'Bandwidth = max data rate (e.g. 1 Gbps, how wide the pipe is). Latency = time for a packet to travel source→destination (e.g. 20ms RTT, how fast the pipe is). Throughput is actual measured rate, always ≤ bandwidth, limited by latency (TCP throughput ≈ window size ÷ RTT).',
    confidence: 'high',
  },
  {
    id: 'mac-address',
    keywords: ['mac', 'address', 'oui', 'burned-in', 'layer 2', 'ethernet'],
    question: 'What is a MAC address?',
    answer:
      'A 48-bit hardware identifier (IEEE 802). Format: 6 hex pairs (AA:BB:CC:DD:EE:FF). First 24 bits = OUI (manufacturer). Last 24 bits = device-specific. Bit 0 of first octet: 0=unicast, 1=multicast. Bit 1: 0=globally unique, 1=locally administered. FF:FF:FF:FF:FF:FF = broadcast. MACs can be spoofed: ip link set dev eth0 address XX:XX:XX:XX:XX:XX.',
    topicId: 'mac-address',
    confidence: 'high',
  },
  {
    id: 'default-gateway',
    keywords: ['default gateway', 'gateway', 'route', 'next hop', '0.0.0.0'],
    question: 'What is a default gateway?',
    answer:
      'The router a host sends to when the destination is not in its local subnet. Represented as the default route (0.0.0.0/0 IPv4, ::/0 IPv6). The host ARP-resolves the gateway MAC (not the remote host MAC) and sends the frame to the gateway, which forwards using its routing table.',
    confidence: 'high',
  },
  {
    id: 'uncertain-fallback',
    keywords: [],
    question: 'Fallback',
    answer:
      'I am not confident enough to answer this accurately. Please verify with RFC documentation at https://www.rfc-editor.org/ or the relevant topic page in NetVerse.',
    confidence: 'uncertain',
  },
  // ── Phase 2/3 Expansions ─────────────────────────────────────────────────
  {
    id: 'http-versions',
    keywords: ['http', 'http2', 'http3', 'quic', 'multiplexing', 'hol', 'head of line'],
    question: 'What are the differences between HTTP/1.1, HTTP/2, and HTTP/3?',
    answer:
      'HTTP/1.1 (RFC 9112): One request per TCP connection (or pipelined, but still sequential). HTTP/2 (RFC 9113): Multiplexed streams over a single TCP connection — no app-layer HOL blocking, binary framing, HPACK header compression. HTTP/3 (RFC 9114): Runs over QUIC (UDP). QUIC streams are independent so a dropped packet only blocks that stream, not others. TLS 1.3 is mandatory in HTTP/3.',
    topicId: 'http',
    references: [
      { title: 'RFC 9114 – HTTP/3', url: 'https://www.rfc-editor.org/rfc/rfc9114', type: 'rfc', rfcNumber: 9114 },
    ],
    confidence: 'high',
  },
  {
    id: 'ssh-keys',
    keywords: ['ssh', 'key', 'rsa', 'ed25519', 'authorized_keys', 'keygen', 'tunneling'],
    question: 'How does SSH public key authentication work?',
    answer:
      'SSH public key auth (RFC 4252): 1) Client sends public key to server. 2) Server checks authorized_keys for matching key. 3) Server sends a challenge (random data). 4) Client signs challenge with private key. 5) Server verifies signature using public key. No password transmitted. Algorithms: Ed25519 (preferred, small key, fast), RSA-4096, ECDSA. Generate: ssh-keygen -t ed25519. Copy: ssh-copy-id user@host.',
    topicId: 'ssh',
    references: [
      { title: 'RFC 4252 – SSH Auth Protocol', url: 'https://www.rfc-editor.org/rfc/rfc4252', type: 'rfc', rfcNumber: 4252 },
    ],
    confidence: 'high',
  },
  {
    id: 'routing-bgp',
    keywords: ['bgp', 'routing', 'autonomous system', 'as path', 'prefix', 'advertise'],
    question: 'How does BGP routing work?',
    answer:
      'BGP-4 (RFC 4271) is a path-vector protocol — the routing protocol of the Internet. Routers establish BGP sessions (TCP port 179) with neighbors (peers). Each router advertises IP prefixes it can reach with AS_PATH attributes. Longest-prefix match selects the route; tie-breaking uses AS_PATH length, LOCAL_PREF, MED. eBGP runs between different Autonomous Systems (ISPs); iBGP runs within an AS. The global DFZ (Default-Free Zone) has ~900,000 IPv4 routes.',
    topicId: 'routing',
    references: [
      { title: 'RFC 4271 – BGP-4', url: 'https://www.rfc-editor.org/rfc/rfc4271', type: 'rfc', rfcNumber: 4271 },
    ],
    confidence: 'high',
  },
  {
    id: 'iptables-basics',
    keywords: ['iptables', 'firewall', 'netfilter', 'chain', 'nat', 'filter', 'rules'],
    question: 'How does iptables work?',
    answer:
      'iptables is a userspace utility that configures Linux Netfilter kernel hooks. It organizes rules in TABLES (filter, nat, mangle) and CHAINS (PREROUTING, INPUT, FORWARD, OUTPUT, POSTROUTING). Packets traverse chains sequentially; first matching rule action (ACCEPT, DROP, REJECT, DNAT, SNAT) wins. The filter table INPUT chain handles inbound traffic to local processes. PREROUTING in the nat table handles DNAT (port forwarding) before routing decisions. nftables is the modern successor.',
    topicId: 'firewalls',
    confidence: 'high',
  },
  {
    id: 'docker-network-types',
    keywords: ['docker', 'bridge', 'overlay', 'host', 'network', 'container', 'veth'],
    question: 'How does Docker container networking work?',
    answer:
      'Docker uses Linux network namespaces (netns) to isolate each container\'s network stack. A veth (virtual ethernet) pair connects container netns to the host docker0 bridge. The default bridge driver assigns 172.17.0.x IPs. Docker adds iptables MASQUERADE rules for outbound NAT. Other drivers: host (no isolation, uses host network stack), overlay (VXLAN-based multi-host, used in Swarm), macvlan (direct MAC assignment to container). User-defined bridge networks have automatic DNS resolution between containers by name.',
    topicId: 'docker-networking',
    confidence: 'high',
  },
  {
    id: 'k8s-service-types',
    keywords: ['kubernetes', 'service', 'clusterip', 'nodeport', 'loadbalancer', 'ingress'],
    question: 'What are Kubernetes Service types?',
    answer:
      'K8s Service types: ClusterIP (default): Virtual IP accessible only within cluster, backed by iptables/IPVS kube-proxy rules. NodePort: Exposes service on every node IP at a static port (30000-32767). LoadBalancer: Provisions a cloud load balancer (e.g. AWS NLB) pointing to NodePorts. ExternalName: DNS CNAME alias to external hostname. Ingress (not a Service type but a resource): L7 HTTP routing rules handled by an Ingress Controller (Nginx, Traefik, AWS ALB Controller).',
    topicId: 'kubernetes-networking',
    confidence: 'high',
  },
  {
    id: 'dhcp-options',
    keywords: ['dhcp', 'option', '43', '53', '55', 'vendor', 'requested'],
    question: 'What are DHCP Options?',
    answer:
      'DHCP Options (RFC 2132) are TLV (type-length-value) extensions in DHCP messages. Common options: 1 = Subnet Mask, 3 = Default Gateway (Router), 6 = DNS Server(s), 15 = Domain Name, 51 = IP Lease Time, 53 = DHCP Message Type (1=Discover,2=Offer,3=Request,5=Ack), 54 = DHCP Server Identifier, 55 = Parameter Request List (client requests specific options), 119 = Domain Search List. Option 43 carries vendor-specific information (e.g. access point controller IP in enterprise Wi-Fi).',
    topicId: 'dhcp',
    references: [
      { title: 'RFC 2132 – DHCP Options', url: 'https://www.rfc-editor.org/rfc/rfc2132', type: 'rfc', rfcNumber: 2132 },
    ],
    confidence: 'high',
  },
  {
    id: 'ethernet-frame',
    keywords: ['ethernet', 'frame', 'preamble', 'sfd', 'fcs', 'crc', 'mtu', 'ethertype'],
    question: 'What are the fields in an Ethernet II frame?',
    answer:
      'Ethernet II frame (IEEE 802.3): 7-byte Preamble (clock sync, 0xAA repeated), 1-byte SFD Start Frame Delimiter (0xAB), 6-byte Destination MAC, 6-byte Source MAC, 2-byte EtherType (0x0800=IPv4, 0x86DD=IPv6, 0x0806=ARP, 0x8100=802.1Q VLAN), 46–1500 byte Payload, 4-byte FCS (CRC-32 error detection). Minimum frame size: 64 bytes (payload padded to 46 bytes). Maximum: 1518 bytes standard, 9022 bytes jumbo frames.',
    topicId: 'ethernet',
    confidence: 'high',
  },
];

export default knowledgeBase;
