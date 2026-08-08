import type { QuizQuestion } from '../types';

export const quizBank: QuizQuestion[] = [
  // ── OSI Model ───────────────────────────────────────────────────────────────
  {
    id: 'osi-q1',
    topicId: 'osi-model',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'Which OSI layer is responsible for logical addressing (IP addresses) and routing?',
    options: [
      { id: 'a', text: 'Data Link (Layer 2)', isCorrect: false, explanation: 'Layer 2 uses MAC addresses for local delivery within a broadcast domain, not logical/IP addresses.' },
      { id: 'b', text: 'Network (Layer 3)', isCorrect: true, explanation: 'Layer 3 (Network) handles logical addressing (IPv4/IPv6) and routing between networks. Devices: routers, Layer 3 switches.' },
      { id: 'c', text: 'Transport (Layer 4)', isCorrect: false, explanation: 'Layer 4 handles end-to-end delivery, flow control, and ports — not IP addressing.' },
      { id: 'd', text: 'Session (Layer 5)', isCorrect: false, explanation: 'Layer 5 manages session establishment, maintenance, and termination between applications.' },
    ],
    explanation: 'The Network layer (OSI Layer 3) is responsible for logical addressing using IP and routing packets between different networks. This is where routers operate.',
  },
  {
    id: 'osi-q2',
    topicId: 'osi-model',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'What is the PDU (Protocol Data Unit) at OSI Layer 2 (Data Link)?',
    options: [
      { id: 'a', text: 'Packet',  isCorrect: false, explanation: 'Packet is the PDU at Layer 3 (Network).' },
      { id: 'b', text: 'Segment', isCorrect: false, explanation: 'Segment is the PDU at Layer 4 (Transport) for TCP.' },
      { id: 'c', text: 'Frame',   isCorrect: true,  explanation: 'A Frame is the PDU at Layer 2. It encapsulates a Network layer packet, adding source/destination MAC addresses and a CRC checksum.' },
      { id: 'd', text: 'Bit',     isCorrect: false, explanation: 'Bit/Symbol is the PDU at Layer 1 (Physical).' },
    ],
    explanation: 'Each OSI layer has its own PDU. Layer 2 = Frame (has MAC addresses + CRC), Layer 3 = Packet (has IP addresses), Layer 4 = Segment (TCP) or Datagram (UDP), Layer 1 = Bit.',
  },
  {
    id: 'osi-q3',
    topicId: 'osi-model',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'Which layer performs encapsulation by adding a header with source and destination MAC addresses?',
    options: [
      { id: 'a', text: 'Physical (Layer 1)', isCorrect: false, explanation: 'Layer 1 converts bits to signals. No addressing is added here.' },
      { id: 'b', text: 'Network (Layer 3)', isCorrect: false, explanation: 'Layer 3 adds IP addresses, not MAC addresses.' },
      { id: 'c', text: 'Data Link (Layer 2)', isCorrect: true, explanation: 'Layer 2 adds an Ethernet frame header containing source and destination MAC addresses, plus a CRC trailer for error detection.' },
      { id: 'd', text: 'Transport (Layer 4)', isCorrect: false, explanation: 'Layer 4 adds port numbers and TCP/UDP headers, not MAC addresses.' },
    ],
    explanation: 'The Data Link layer (Layer 2) adds the Ethernet frame with source MAC, destination MAC, EtherType, and FCS (CRC). This enables delivery within a local network segment.',
  },
  // ── TCP ─────────────────────────────────────────────────────────────────────
  {
    id: 'tcp-q1',
    topicId: 'tcp',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'In the TCP three-way handshake, what is the correct sequence of messages?',
    options: [
      { id: 'a', text: 'ACK → SYN → SYN-ACK', isCorrect: false, explanation: 'ACK cannot be first — there is nothing to acknowledge before a connection starts.' },
      { id: 'b', text: 'SYN → SYN-ACK → ACK', isCorrect: true, explanation: 'Correct per RFC 9293: Client SYN → Server SYN-ACK → Client ACK. After the ACK the connection is ESTABLISHED.' },
      { id: 'c', text: 'SYN → ACK → FIN', isCorrect: false, explanation: 'FIN is for connection termination, not establishment.' },
      { id: 'd', text: 'SYN-ACK → SYN → ACK', isCorrect: false, explanation: 'The server cannot send SYN-ACK before receiving the client SYN.' },
    ],
    explanation: 'RFC 9293 defines TCP connection establishment as a three-way handshake: SYN (client initiates, sends ISN), SYN-ACK (server acknowledges and sends its ISN), ACK (client acknowledges server ISN).',
    rfcNote: 'RFC 9293 §3.5',
  },
  {
    id: 'tcp-q2',
    topicId: 'tcp',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'Why does TCP use a random Initial Sequence Number (ISN) rather than always starting at 0?',
    options: [
      { id: 'a', text: 'To make packets harder to sniff', isCorrect: false, explanation: 'ISN randomness provides minimal security against sniffing. TLS is used for that purpose.' },
      { id: 'b', text: 'To prevent stale segments from a previous connection being accepted', isCorrect: true, explanation: 'RFC 9293 §3.3: A random ISN prevents segments from a previous incarnation of the same connection (same src/dst IP+port 4-tuple) from being mistakenly accepted.' },
      { id: 'c', text: 'To ensure packets arrive in order', isCorrect: false, explanation: 'Sequence numbers do enable ordering, but randomness is specifically about preventing old segment confusion.' },
      { id: 'd', text: 'To increase throughput', isCorrect: false, explanation: 'ISN value has no effect on throughput.' },
    ],
    explanation: 'TCP ISN randomisation (RFC 9293 §3.3) prevents old duplicate segments from a previous connection (same 4-tuple) from being wrongly accepted into a new connection.',
    rfcNote: 'RFC 9293 §3.3',
  },
  {
    id: 'tcp-q3',
    topicId: 'tcp',
    type: 'scenario',
    difficulty: 'intermediate',
    question: 'A server has TIME_WAIT state for a connection. What does this mean and why does it exist?',
    context: 'You run `ss -tan` on a Linux server and see a socket in TIME_WAIT state.',
    options: [
      { id: 'a', text: 'The server is waiting for the client to reconnect', isCorrect: false, explanation: 'TIME_WAIT has nothing to do with reconnection.' },
      { id: 'b', text: 'The connection is being reset by the server', isCorrect: false, explanation: 'Connection reset uses RST flag, not TIME_WAIT.' },
      { id: 'c', text: 'The active closer is waiting 2×MSL to handle delayed duplicate segments from the closed connection', isCorrect: true, explanation: 'RFC 9293 §3.10.7: TIME_WAIT lasts 2×MSL (Maximum Segment Lifetime, typically 60–120s). It ensures delayed packets from the old connection do not interfere with a new connection using the same 4-tuple.' },
      { id: 'd', text: 'The server is rate-limiting new connections', isCorrect: false, explanation: 'TIME_WAIT is a TCP state, not a rate-limiting mechanism.' },
    ],
    explanation: 'TIME_WAIT (RFC 9293 §3.10.7) is entered by the active closer after sending the final ACK. It waits 2×MSL to: 1) ensure the final ACK reaches the passive closer, 2) allow old duplicate segments to expire.',
  },
  // ── DNS ─────────────────────────────────────────────────────────────────────
  {
    id: 'dns-q1',
    topicId: 'dns',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'Which DNS record type maps a domain name to an IPv4 address?',
    options: [
      { id: 'a', text: 'AAAA', isCorrect: false, explanation: 'AAAA maps a domain to an IPv6 address (RFC 3596).' },
      { id: 'b', text: 'A',    isCorrect: true,  explanation: 'The A record (RFC 1035) maps a hostname to a 32-bit IPv4 address, e.g. google.com → 142.250.64.46.' },
      { id: 'c', text: 'MX',   isCorrect: false, explanation: 'MX records specify mail servers for a domain.' },
      { id: 'd', text: 'PTR',  isCorrect: false, explanation: 'PTR records do reverse DNS — IP address to hostname.' },
    ],
    explanation: 'A records (RFC 1035) are the fundamental DNS record type mapping a hostname to an IPv4 address. AAAA records do the same for IPv6.',
  },
  {
    id: 'dns-q2',
    topicId: 'dns',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'What is the difference between a recursive resolver and an authoritative nameserver?',
    options: [
      { id: 'a', text: 'They are the same thing', isCorrect: false, explanation: 'They serve completely different roles in DNS resolution.' },
      { id: 'b', text: 'Recursive resolver iterates through the DNS hierarchy on behalf of the client; authoritative NS holds the actual zone records', isCorrect: true, explanation: 'RFC 1034 §5.3: Recursive resolver does the work of querying root → TLD → authoritative NS. The authoritative NS holds the actual DNS records and gives definitive answers for its zone.' },
      { id: 'c', text: 'Recursive resolver caches records; authoritative NS does not', isCorrect: false, explanation: 'Both can cache, but the key distinction is their roles, not caching.' },
      { id: 'd', text: 'Authoritative NS queries the root servers; recursive resolver answers clients directly', isCorrect: false, explanation: 'This is reversed — the recursive resolver queries the hierarchy.' },
    ],
    explanation: 'Recursive resolver = DNS server that does the iterative work through the DNS hierarchy (root → TLD → auth) on behalf of the client stub. Authoritative NS = holds the actual zone file with DNS records for a domain.',
    rfcNote: 'RFC 1034 §5.3',
  },
  // ── IP / Subnetting ─────────────────────────────────────────────────────────
  {
    id: 'ip-q1',
    topicId: 'ip-addressing',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'How many usable host addresses are in a /24 subnet?',
    options: [
      { id: 'a', text: '256', isCorrect: false, explanation: '256 is the total number of addresses. Two are reserved: network address and broadcast.' },
      { id: 'b', text: '254', isCorrect: true,  explanation: '2^(32-24) = 256 total. Subtract network address (.0) and broadcast (.255) = 254 usable hosts.' },
      { id: 'c', text: '255', isCorrect: false, explanation: 'Minus 1 is not correct — you subtract 2 (network + broadcast).' },
      { id: 'd', text: '252', isCorrect: false, explanation: 'Subtracting 4 is wrong. Only 2 addresses are reserved in a standard subnet.' },
    ],
    explanation: 'For a /24: total = 2^8 = 256. Network address (x.x.x.0) + broadcast (x.x.x.255) are reserved. Usable = 256 - 2 = 254. Exception: /31 has no broadcast per RFC 3021 (2 usable), /32 is a single host.',
  },
  {
    id: 'ip-q2',
    topicId: 'ip-addressing',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'Which of the following is a valid RFC 1918 private IP address?',
    options: [
      { id: 'a', text: '172.32.0.1',  isCorrect: false, explanation: '172.32.x.x is NOT private. RFC 1918 only covers 172.16.0.0–172.31.255.255 (/12).' },
      { id: 'b', text: '192.169.1.1', isCorrect: false, explanation: '192.169.x.x is public. Only 192.168.0.0/16 is private.' },
      { id: 'c', text: '10.255.255.254', isCorrect: true, explanation: '10.0.0.0/8 is private per RFC 1918. 10.255.255.254 falls within this range.' },
      { id: 'd', text: '11.0.0.1',    isCorrect: false, explanation: '11.x.x.x is a public address range.' },
    ],
    explanation: 'RFC 1918 private ranges: 10.0.0.0/8, 172.16.0.0/12 (172.16–172.31), 192.168.0.0/16. These are not routed on the public internet and require NAT for external communication.',
  },
  // ── ARP ─────────────────────────────────────────────────────────────────────
  {
    id: 'arp-q1',
    topicId: 'arp',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'An ARP Request is sent as what type of Ethernet frame?',
    options: [
      { id: 'a', text: 'Unicast to the target MAC',   isCorrect: false, explanation: 'Unicast is impossible — the whole point of ARP is that we do NOT know the target MAC yet.' },
      { id: 'b', text: 'Broadcast to FF:FF:FF:FF:FF:FF', isCorrect: true, explanation: 'ARP Requests are broadcast so all hosts on the segment receive it. Only the host with the target IP responds.' },
      { id: 'c', text: 'Multicast to a group address', isCorrect: false, explanation: 'ARP uses broadcast, not multicast. IPv6 uses Neighbor Discovery (multicast) instead of ARP.' },
      { id: 'd', text: 'Anycast', isCorrect: false, explanation: 'Anycast is an IP routing concept, not used for ARP.' },
    ],
    explanation: 'ARP Requests (RFC 826) are broadcast to FF:FF:FF:FF:FF:FF so all hosts on the local segment receive them. The target host sends a unicast ARP Reply directly back to the requester.',
  },
  {
    id: 'arp-q2',
    topicId: 'arp',
    type: 'scenario',
    difficulty: 'intermediate',
    question: 'Host A (192.168.1.10) wants to send a packet to Host B (192.168.1.20) on the same /24 subnet. Host A has no ARP entry for B. What happens first?',
    context: 'Both hosts are on the same Ethernet segment (192.168.1.0/24). No prior ARP cache entry exists.',
    options: [
      { id: 'a', text: 'Host A sends the packet to its default gateway', isCorrect: false, explanation: 'The gateway is used for off-subnet destinations. 192.168.1.20 is in the same /24, so Host A communicates directly.' },
      { id: 'b', text: 'Host A sends an ARP broadcast asking "Who has 192.168.1.20?"', isCorrect: true, explanation: 'Since B is in the same subnet, A sends an ARP Request broadcast. B replies with its MAC. A then sends the IP packet directly to B.' },
      { id: 'c', text: 'Host A drops the packet', isCorrect: false, explanation: 'Packets are not dropped due to missing ARP — ARP resolution happens first.' },
      { id: 'd', text: 'The switch forwards the packet to Host B automatically', isCorrect: false, explanation: 'A switch forwards Ethernet frames by MAC, not IP. Without a MAC address, the frame cannot be built.' },
    ],
    explanation: 'For same-subnet communication, the host does ARP resolution to get the MAC, then sends the Ethernet frame directly. Cross-subnet traffic goes to the gateway MAC (which ARP-resolves the gateway, not the remote host).',
  },

  // ── DHCP ─────────────────────────────────────────────────────────────────────
  {
    id: 'dhcp-q1',
    topicId: 'dhcp',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'What is the correct order of the DHCP DORA process?',
    options: [
      { id: 'a', text: 'Offer → Discover → Request → Acknowledge', isCorrect: false, explanation: 'The server cannot Offer before the client Discovers.' },
      { id: 'b', text: 'Discover → Offer → Request → Acknowledge', isCorrect: true, explanation: 'RFC 2131 §3.1: Client broadcasts DHCPDISCOVER → Server unicasts DHCPOFFER → Client broadcasts DHCPREQUEST → Server sends DHCPACK.' },
      { id: 'c', text: 'Discover → Request → Offer → Acknowledge', isCorrect: false, explanation: 'The client cannot Request before receiving an Offer from the server.' },
      { id: 'd', text: 'Request → Discover → Offer → Acknowledge', isCorrect: false, explanation: 'The client must first Discover available servers before Requesting.' },
    ],
    explanation: 'DORA: Discover (client broadcasts) → Offer (server offers an IP) → Request (client accepts, still broadcast) → Acknowledge (server confirms). RFC 2131 §3.1.',
    rfcNote: 'RFC 2131 §3.1',
  },
  {
    id: 'dhcp-q2',
    topicId: 'dhcp',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'Why is the DHCPREQUEST message sent as a broadcast, even though the client already knows the server\'s IP from the DHCPOFFER?',
    options: [
      { id: 'a', text: 'The client still has no IP address and cannot send unicast', isCorrect: false, explanation: 'This was true for DHCPDISCOVER, but the real reason for broadcasting DHCPREQUEST is different.' },
      { id: 'b', text: 'To inform all DHCP servers on the segment which offer was accepted, so others release their reserved IPs', isCorrect: true, explanation: 'RFC 2131 §3.1: When multiple DHCP servers respond with offers, all reserve an IP. DHCPREQUEST must be broadcast so all servers see it and those not selected release their reservation.' },
      { id: 'c', text: 'UDP does not support unicast before DHCPACK', isCorrect: false, explanation: 'UDP supports unicast at any time. This is a DHCP protocol design decision, not a UDP limitation.' },
      { id: 'd', text: 'To allow the router to update its ARP cache', isCorrect: false, explanation: 'ARP cache updates happen separately via Gratuitous ARP after the lease is confirmed.' },
    ],
    explanation: 'RFC 2131 §3.1: DHCPREQUEST is broadcast so that all DHCP servers on the segment learn which offer was accepted. Non-selected servers release their reserved address back to their pool.',
    rfcNote: 'RFC 2131 §3.1',
  },
  {
    id: 'dhcp-q3',
    topicId: 'dhcp',
    type: 'scenario',
    difficulty: 'intermediate',
    question: 'A DHCP client on VLAN 20 (192.168.20.0/24) cannot reach the DHCP server on VLAN 1 (10.0.0.0/24). The client gets "169.254.x.x" (APIPA). What is most likely missing?',
    context: 'Network uses VLANs. DHCP server is centralized on VLAN 1. Client is on VLAN 20 and gets 169.254.x.x address after 60 seconds.',
    options: [
      { id: 'a', text: 'The DHCP server pool is exhausted', isCorrect: false, explanation: 'Pool exhaustion would show a DHCPNAK, not APIPA. APIPA means no response at all.' },
      { id: 'b', text: 'A DHCP Relay Agent (ip helper-address) is not configured on the VLAN 20 gateway', isCorrect: true, explanation: 'DHCP Discover is broadcast. Routers do not forward broadcasts between VLANs by default. A DHCP Relay Agent (ip helper-address in Cisco, RFC 3046) must be configured on the VLAN 20 L3 interface to forward requests to the DHCP server as unicast.' },
      { id: 'c', text: 'The client NIC is faulty', isCorrect: false, explanation: 'APIPA (RFC 3927) is a fallback when DHCP fails, not a hardware fault indicator.' },
      { id: 'd', text: 'The DHCP server is configured for VLAN 1 only', isCorrect: false, explanation: 'The server can serve multiple VLANs if the relay agent adds the correct giaddr so the server selects the right pool.' },
    ],
    explanation: '169.254.x.x (APIPA/RFC 3927) means the client got no DHCP response. Between VLANs/subnets, a DHCP Relay Agent must intercept the broadcast and forward it as unicast to the DHCP server (ip helper-address in Cisco IOS). The server uses the relay\'s giaddr to pick the right IP pool.',
    rfcNote: 'RFC 2131 §3.1, RFC 3046 (Relay Agent), RFC 3927 (APIPA)',
  },

  // ── NAT / PAT ────────────────────────────────────────────────────────────────
  {
    id: 'nat-q1',
    topicId: 'nat',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'What is the key difference between SNAT and DNAT?',
    options: [
      { id: 'a', text: 'SNAT is for UDP, DNAT is for TCP', isCorrect: false, explanation: 'Both SNAT and DNAT work with any protocol (TCP, UDP, ICMP).' },
      { id: 'b', text: 'SNAT rewrites the source IP (outbound); DNAT rewrites the destination IP (inbound/port forwarding)', isCorrect: true, explanation: 'SNAT (Source NAT): applied at POSTROUTING — rewrites src IP of outgoing packets. DNAT (Destination NAT): applied at PREROUTING — rewrites dst IP of incoming packets for port forwarding.' },
      { id: 'c', text: 'SNAT is stateful, DNAT is stateless', isCorrect: false, explanation: 'Both SNAT and DNAT are stateful — they require connection tracking (netfilter) to rewrite return packets correctly.' },
      { id: 'd', text: 'SNAT requires a public IP; DNAT does not', isCorrect: false, explanation: 'Both typically involve a public IP. SNAT uses it as the new source; DNAT uses it as the original destination.' },
    ],
    explanation: 'SNAT rewrites source IP at POSTROUTING (for outbound traffic from private→public). DNAT rewrites destination IP at PREROUTING (for inbound port forwarding from public→private). PAT/Masquerade is a many-to-one SNAT that also rewrites the source port.',
    rfcNote: 'RFC 3022 §4',
  },
  {
    id: 'nat-q2',
    topicId: 'nat',
    type: 'scenario',
    difficulty: 'intermediate',
    question: 'You run a high-traffic server behind AWS NAT Gateway and observe connection failures with "address already in use" errors. The NAT Gateway has one Elastic IP. What is the root cause?',
    context: 'EC2 instances in private subnets use a single NAT Gateway (one EIP) for outbound traffic to external APIs.',
    options: [
      { id: 'a', text: 'NAT Gateway CPU is overloaded', isCorrect: false, explanation: 'AWS NAT Gateway is fully managed and scales automatically. CPU is not a user-visible concern.' },
      { id: 'b', text: 'PAT port exhaustion — 65,535 simultaneous port mappings per public IP are exceeded', isCorrect: true, explanation: 'PAT (Port Address Translation) maps each connection to a unique source port on the public IP. One public IP supports ~65,535 concurrent connections. High-throughput workloads can exhaust this. Fix: add multiple EIPs to the NAT Gateway.' },
      { id: 'c', text: 'The target API is rate-limiting the NAT Gateway IP', isCorrect: false, explanation: 'Possible but unlikely to cause "address already in use" — that\'s a local socket error from PAT exhaustion.' },
      { id: 'd', text: 'Security Group rules are blocking return traffic', isCorrect: false, explanation: 'Security Groups are stateful — return traffic is automatically allowed for established connections.' },
    ],
    explanation: 'PAT maps each outbound connection to (publicIP, uniquePort). Max ~65,535 ports per IP. Solution: assign multiple EIPs to the NAT Gateway so AWS distributes PAT across multiple public IPs.',
  },

  // ── UDP ──────────────────────────────────────────────────────────────────────
  {
    id: 'udp-q1',
    topicId: 'udp',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'What is the total size of a UDP header?',
    options: [
      { id: 'a', text: '20 bytes', isCorrect: false, explanation: '20 bytes is the minimum TCP header size. UDP is much simpler.' },
      { id: 'b', text: '8 bytes', isCorrect: true, explanation: 'RFC 768: UDP header = Source Port (2) + Destination Port (2) + Length (2) + Checksum (2) = 8 bytes fixed. No options, no extensions.' },
      { id: 'c', text: '28 bytes', isCorrect: false, explanation: '28 bytes = 20-byte IP header + 8-byte UDP header. The UDP header alone is 8 bytes.' },
      { id: 'd', text: '16 bytes', isCorrect: false, explanation: 'The UDP header has exactly 4 fields × 2 bytes each = 8 bytes total.' },
    ],
    explanation: 'RFC 768: The UDP header is a fixed 8 bytes: Source Port, Destination Port, Length, Checksum (each 2 bytes). This minimal overhead is why UDP is faster than TCP for latency-sensitive applications.',
    rfcNote: 'RFC 768',
  },
  {
    id: 'udp-q2',
    topicId: 'udp',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'Which protocol runs over UDP but implements its own reliability, ordering, and encryption — making it essentially "TCP+TLS in userspace"?',
    options: [
      { id: 'a', text: 'DTLS (Datagram TLS)', isCorrect: false, explanation: 'DTLS adds encryption to UDP but not full reliability/ordering like TCP.' },
      { id: 'b', text: 'QUIC (RFC 9000)', isCorrect: true, explanation: 'QUIC (RFC 9000) runs over UDP and implements reliable delivery, stream multiplexing, ordering, and mandatory TLS 1.3 encryption entirely in userspace. HTTP/3 (RFC 9114) uses QUIC exclusively. Key benefit: eliminates TCP head-of-line blocking.' },
      { id: 'c', text: 'SCTP', isCorrect: false, explanation: 'SCTP is a transport protocol like TCP/UDP, not built on top of UDP.' },
      { id: 'd', text: 'WebSocket', isCorrect: false, explanation: 'WebSocket runs over TCP, not UDP.' },
    ],
    explanation: 'QUIC (RFC 9000) is a transport protocol implemented in userspace over UDP. It provides reliable, ordered, multiplexed streams with built-in TLS 1.3, 1-RTT or 0-RTT connection setup, and eliminates TCP head-of-line blocking. HTTP/3 (RFC 9114) uses QUIC.',
    rfcNote: 'RFC 9000, RFC 9114',
  },

  // ── ICMP ─────────────────────────────────────────────────────────────────────
  {
    id: 'icmp-q1',
    topicId: 'icmp',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'What ICMP message type does traceroute exploit to map network hops?',
    options: [
      { id: 'a', text: 'Type 0 — Echo Reply', isCorrect: false, explanation: 'Echo Reply (Type 0) is the response to ping. Traceroute uses a different mechanism.' },
      { id: 'b', text: 'Type 3 — Destination Unreachable', isCorrect: false, explanation: 'Type 3 signals that a host/port/network is unreachable. Traceroute does use it at the final hop (Linux UDP mode), but the core mechanism relies on Type 11.' },
      { id: 'c', text: 'Type 11 — Time Exceeded', isCorrect: true, explanation: 'Traceroute sends packets with TTL=1, 2, 3… Each router that decrements TTL to 0 sends back ICMP Type 11 Code 0 (Time Exceeded in Transit). This reveals each hop\'s IP. RFC 792.' },
      { id: 'd', text: 'Type 8 — Echo Request', isCorrect: false, explanation: 'Echo Request is the outgoing ping. Traceroute sends it (Windows mode) but the replies that reveal hops are Type 11.' },
    ],
    explanation: 'Traceroute exploits TTL decrement behavior: routers MUST send ICMP Type 11 (Time Exceeded) when they discard a packet with TTL=0. By incrementing TTL from 1, each hop reveals itself. RFC 792 mandates this behavior.',
    rfcNote: 'RFC 792',
  },
  {
    id: 'icmp-q2',
    topicId: 'icmp',
    type: 'scenario',
    difficulty: 'intermediate',
    question: 'You block ALL ICMP in your AWS Security Group. Users report that large file uploads over VPN to your EC2 instance silently hang. What ICMP type must you allow to fix this?',
    context: 'EC2 in private subnet behind ALB. VPN tunnel from office. Large HTTP POST requests hang indefinitely after TCP connect.',
    options: [
      { id: 'a', text: 'Type 8 (Echo Request) — to allow ping', isCorrect: false, explanation: 'Allowing ping would help with troubleshooting but doesn\'t fix the stalled uploads.' },
      { id: 'b', text: 'Type 3 Code 4 (Fragmentation Needed / Don\'t Fragment set)', isCorrect: true, explanation: 'Path MTU Discovery (RFC 1191) relies on ICMP Type 3 Code 4. If a packet is too large and DF bit is set, the router drops it and sends this ICMP. If blocked, the sender never knows to reduce packet size — causing a "black hole" where connections appear established but data never flows.' },
      { id: 'c', text: 'Type 0 (Echo Reply) — to allow ping responses', isCorrect: false, explanation: 'Echo Reply is for ping responses, not related to file upload stalls.' },
      { id: 'd', text: 'Type 11 (Time Exceeded) — for traceroute', isCorrect: false, explanation: 'Blocking Type 11 breaks traceroute but does not cause upload stalls.' },
    ],
    explanation: 'Blocking ICMP Type 3 Code 4 (Fragmentation Needed) breaks PMTUD (Path MTU Discovery — RFC 1191). The sender uses DF=1 and expects ICMP feedback to reduce MTU. Without it, large packets are silently dropped, causing TCP connections to hang. Always allow ICMP Type 3 Code 4 inbound.',
    rfcNote: 'RFC 1191 (PMTUD), RFC 792',
  },

  // ── HTTPS / TLS ───────────────────────────────────────────────────────────────
  {
    id: 'https-q1',
    topicId: 'https',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'How many round-trips (RTT) does TLS 1.3 require to establish a new connection, compared to TLS 1.2?',
    options: [
      { id: 'a', text: 'TLS 1.3: 2 RTT, TLS 1.2: 3 RTT', isCorrect: false, explanation: 'TLS 1.2 needs 2 RTT (not 3), and TLS 1.3 is even faster.' },
      { id: 'b', text: 'TLS 1.3: 1 RTT (or 0-RTT for resumption), TLS 1.2: 2 RTT', isCorrect: true, explanation: 'RFC 8446: TLS 1.3 completes in 1 RTT (ClientHello + ServerHello/Cert/Finished in one round-trip), and supports 0-RTT for session resumption. TLS 1.2 needs 2 full RTTs before application data can flow.' },
      { id: 'c', text: 'Both require 2 RTT', isCorrect: false, explanation: 'TLS 1.3 was specifically designed to reduce this to 1 RTT, a key improvement over TLS 1.2.' },
      { id: 'd', text: 'TLS 1.3: 0 RTT always, TLS 1.2: 1 RTT', isCorrect: false, explanation: '0-RTT in TLS 1.3 is only for session resumption and has replay attack risks (RFC 8470). New connections always need 1 RTT.' },
    ],
    explanation: 'TLS 1.3 (RFC 8446) reduced the handshake from 2 RTT (TLS 1.2) to 1 RTT for new connections. For resumed sessions, 0-RTT early data is possible but carries replay attack risks. This improvement is significant for latency-sensitive applications.',
    rfcNote: 'RFC 8446 §2.2',
  },
  {
    id: 'https-q2',
    topicId: 'https',
    type: 'mcq',
    difficulty: 'advanced',
    question: 'TLS 1.3 mandates Perfect Forward Secrecy (PFS). What does this guarantee?',
    options: [
      { id: 'a', text: 'Encrypted traffic cannot be intercepted in transit', isCorrect: false, explanation: 'Encryption in transit is provided by TLS generally, not specifically by PFS.' },
      { id: 'b', text: 'Compromising the server\'s private key does NOT allow decryption of past recorded sessions', isCorrect: true, explanation: 'PFS (via ECDHE): each session uses ephemeral key pairs. The session key is derived from ECDHE and discarded after use. Even if an attacker later obtains the server\'s long-term private key, they cannot decrypt previously captured sessions because the ephemeral keys no longer exist.' },
      { id: 'c', text: 'The TLS certificate cannot be forged', isCorrect: false, explanation: 'Certificate forgery prevention is handled by the CA trust chain, not PFS.' },
      { id: 'd', text: 'Each packet is individually encrypted', isCorrect: false, explanation: 'Packet-level encryption is standard TLS. PFS specifically refers to the impossibility of retroactive decryption.' },
    ],
    explanation: 'Perfect Forward Secrecy (PFS) via ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) means session keys are ephemeral — generated fresh for each session and deleted afterward. Compromising the server\'s private key only enables impersonating the server for future connections, not decrypting past sessions. TLS 1.3 makes ECDHE mandatory.',
    rfcNote: 'RFC 8446 §1.1',
  },

  // ── HTTP ─────────────────────────────────────────────────────────────────────
  {
    id: 'http-q1',
    topicId: 'http',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'How does HTTP/3 (RFC 9114) eliminate TCP head-of-line (HOL) blocking?',
    options: [
      { id: 'a', text: 'By compression with HPACK', isCorrect: false, explanation: 'HPACK compresses headers in HTTP/2, but does not prevent transport packet loss blocking.' },
      { id: 'b', text: 'By replacing TCP with QUIC over UDP', isCorrect: true, explanation: 'RFC 9114: HTTP/3 runs over QUIC (UDP). QUIC streams are independent — if a packet drops on Stream A, Stream B continues unblocked.' },
      { id: 'c', text: 'By using multiple TCP sockets', isCorrect: false, explanation: 'HTTP/1.1 used multiple TCP sockets, but that was inefficient and memory intensive.' },
      { id: 'd', text: 'By enforcing mandatory TLS 1.2', isCorrect: false, explanation: 'TLS 1.2 is a security protocol and does not resolve transport-level HOL blocking.' },
    ],
    explanation: 'HTTP/3 uses QUIC over UDP. Because QUIC handles stream multiplexing directly in UDP userspace, packet loss on one stream does not pause other streams.',
    rfcNote: 'RFC 9114',
  },
  {
    id: 'http-q2',
    topicId: 'http',
    type: 'scenario',
    difficulty: 'intermediate',
    question: 'An Nginx reverse proxy returns status code 502 Bad Gateway to clients. What does this indicate?',
    options: [
      { id: 'a', text: 'The client request URL is invalid', isCorrect: false, explanation: 'Invalid client requests return 400 Bad Request or 404 Not Found.' },
      { id: 'b', text: 'The reverse proxy received an invalid or failed response from the upstream application server', isCorrect: true, explanation: '502 Bad Gateway means Nginx (acting as a proxy/gateway) failed to communicate or received an invalid response from the upstream app (e.g. Node.js/Gunicorn crashed or refused connection).' },
      { id: 'c', text: 'The server database timed out', isCorrect: false, explanation: 'Database timeout usually yields 504 Gateway Timeout or 500 Internal Server Error.' },
      { id: 'd', text: 'The client is rate-limited', isCorrect: false, explanation: 'Rate limiting yields 429 Too Many Requests.' },
    ],
    explanation: '502 Bad Gateway occurs when an intermediate proxy server receives an invalid or refused response from the backend application socket.',
  },

  // ── SSH ──────────────────────────────────────────────────────────────────────
  {
    id: 'ssh-q1',
    topicId: 'ssh',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'Which SSH option creates a local SOCKS5 proxy server that routes all client traffic dynamically through an SSH tunnel?',
    options: [
      { id: 'a', text: '-L (Local Port Forwarding)', isCorrect: false, explanation: '-L binds a specific single local port to a fixed target.' },
      { id: 'b', text: '-R (Remote Port Forwarding)', isCorrect: false, explanation: '-R binds a port on the remote server back to a local port.' },
      { id: 'c', text: '-D (Dynamic Port Forwarding)', isCorrect: true, explanation: 'ssh -D 1080 user@host creates a local SOCKS5 proxy at port 1080. Browsers can send any traffic through this proxy.' },
      { id: 'd', text: '-N (No Command Execution)', isCorrect: false, explanation: '-N prevents remote shell execution, used alongside forwarding options.' },
    ],
    explanation: 'RFC 4254: Dynamic Port Forwarding (`ssh -D`) turns the SSH connection into a full SOCKS5 proxy server.',
    rfcNote: 'RFC 4254',
  },

  // ── TCP/IP Model ─────────────────────────────────────────────────────────────
  {
    id: 'tcpip-q1',
    topicId: 'tcpip-model',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'Which OSI model layers are combined into the single "Application Layer" in the 4-layer TCP/IP Model (RFC 1122)?',
    options: [
      { id: 'a', text: 'Layers 1, 2, and 3', isCorrect: false, explanation: 'These form Network Access and Internet layers.' },
      { id: 'b', text: 'Layers 5 (Session), 6 (Presentation), and 7 (Application)', isCorrect: true, explanation: 'RFC 1122 simplifies OSI layers 5, 6, and 7 into a single unified Application Layer.' },
      { id: 'c', text: 'Layers 3, 4, and 5', isCorrect: false, explanation: 'Layer 3 is Internet and Layer 4 is Transport.' },
      { id: 'd', text: 'Layers 4 and 7', isCorrect: false, explanation: 'Layer 4 is Transport in both models.' },
    ],
    explanation: 'The TCP/IP model combines OSI Application (L7), Presentation (L6), and Session (L5) into its Application layer.',
    rfcNote: 'RFC 1122 §1.1',
  },

  // ── Routing ──────────────────────────────────────────────────────────────────
  {
    id: 'routing-q1',
    topicId: 'routing',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'When an IP destination matches multiple routes in a router\'s FIB, which route is selected?',
    options: [
      { id: 'a', text: 'The route with the lowest metric', isCorrect: false, explanation: 'Metric is only used as a tie-breaker when prefix lengths are identical.' },
      { id: 'b', text: 'The route with the longest CIDR prefix mask (Longest Prefix Match)', isCorrect: true, explanation: 'RFC 1812: Routers ALWAYS select the route with the most specific (longest) subnet mask. For example, /28 is selected over /24.' },
      { id: 'c', text: 'The route added most recently', isCorrect: false, explanation: 'Time added does not determine route selection.' },
      { id: 'd', text: 'The default route (0.0.0.0/0)', isCorrect: false, explanation: '0.0.0.0/0 is the fallback of last resort (/0 is the shortest prefix).' },
    ],
    explanation: 'Longest Prefix Match (LPM) dictates that the route with the highest prefix length (/32 > /28 > /24 > /16 > /0) is chosen. RFC 1812.',
    rfcNote: 'RFC 1812 §5.2.4',
  },

  // ── Firewalls ────────────────────────────────────────────────────────────────
  {
    id: 'firewalls-q1',
    topicId: 'firewalls',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'Which Netfilter chain in Linux handles packets BEFORE any routing decision is made (used for DNAT)?',
    options: [
      { id: 'a', text: 'POSTROUTING', isCorrect: false, explanation: 'POSTROUTING handles packets AFTER routing (used for SNAT).' },
      { id: 'b', text: 'PREROUTING', isCorrect: true, explanation: 'PREROUTING hook intercepts packets as soon as they enter the NIC before the IP routing table decision is made, allowing destination IP/port rewriting.' },
      { id: 'c', text: 'INPUT', isCorrect: false, explanation: 'INPUT is for packets destined for local sockets.' },
      { id: 'd', text: 'FORWARD', isCorrect: false, explanation: 'FORWARD is for routed transit packets.' },
    ],
    explanation: 'PREROUTING runs before routing lookup. It is used for Destination NAT (DNAT / port forwarding).',
  },

  // ── Load Balancing ───────────────────────────────────────────────────────────
  {
    id: 'load-balancing-q1',
    topicId: 'load-balancing',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'What is a major advantage of L7 Load Balancing over L4 Load Balancing?',
    options: [
      { id: 'a', text: 'L7 load balancing is faster and uses less CPU', isCorrect: false, explanation: 'L4 load balancing is faster because it does not inspect HTTP payloads.' },
      { id: 'b', text: 'L7 load balancing can route based on HTTP headers, cookie session stickiness, and URL paths', isCorrect: true, explanation: 'L7 load balancers (like ALB / Nginx) inspect the HTTP layer, allowing path routing (/api vs /static) and TLS termination.' },
      { id: 'c', text: 'L7 load balancing works without IP addresses', isCorrect: false, explanation: 'All network routing requires IP addresses.' },
      { id: 'd', text: 'L7 load balancing does not support HTTPS', isCorrect: false, explanation: 'L7 load balancers frequently terminate HTTPS certificates.' },
    ],
    explanation: 'L7 (Application Layer) load balancing inspects HTTP/HTTPS data to perform smart routing based on paths, headers, and cookies.',
  },

  // ── AWS VPC ──────────────────────────────────────────────────────────────────
  {
    id: 'vpc-q1',
    topicId: 'vpc',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'What is the primary operational difference between an AWS Security Group and a Network ACL (NACL)?',
    options: [
      { id: 'a', text: 'Security Groups are stateless; NACLs are stateful', isCorrect: false, explanation: 'It is the opposite: Security Groups are stateful; NACLs are stateless.' },
      { id: 'b', text: 'Security Groups are stateful (ENI level); NACLs are stateless (Subnet level)', isCorrect: true, explanation: 'Security Groups track connection state (allowing return traffic automatically) at instance ENIs. NACLs evaluate rules in order per packet at subnet boundaries.' },
      { id: 'c', text: 'Security Groups support DENY rules; NACLs only ALLOW', isCorrect: false, explanation: 'Security Groups only support ALLOW. NACLs support ALLOW and DENY.' },
      { id: 'd', text: 'NACLs apply to IAM users; Security Groups apply to VMs', isCorrect: false, explanation: 'Both are network security controls, not IAM controls.' },
    ],
    explanation: 'Security Groups are stateful firewalls attached to ENIs. NACLs are stateless firewalls attached to Subnets.',
  },

  // ── Docker Networking ────────────────────────────────────────────────────────
  {
    id: 'docker-networking-q1',
    topicId: 'docker-networking',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'What Linux kernel mechanism provides network interface isolation for Docker containers on a single host?',
    options: [
      { id: 'a', text: 'Control Groups (cgroups)', isCorrect: false, explanation: 'cgroups manage CPU/Memory resource limits.' },
      { id: 'b', text: 'Network Namespaces (netns) connected via veth pairs', isCorrect: true, explanation: 'Linux `netns` gives each container its own isolated network stack (IP, interfaces, routing table), linked to the host bridge via a virtual ethernet (`veth`) pair.' },
      { id: 'c', text: 'seccomp profiles', isCorrect: false, explanation: 'seccomp restricts system calls.' },
      { id: 'd', text: 'CHROOT system calls', isCorrect: false, explanation: 'chroot isolates filesystem root directories.' },
    ],
    explanation: 'Linux Network Namespaces (`netns`) isolate network interfaces, IP addresses, and routing tables per container.',
  },

  // ── Kubernetes Networking ────────────────────────────────────────────────────
  {
    id: 'k8s-q1',
    topicId: 'kubernetes-networking',
    type: 'mcq',
    difficulty: 'advanced',
    question: 'Why does the Cilium CNI plugin outperform traditional kube-proxy iptables implementations in large Kubernetes clusters?',
    options: [
      { id: 'a', text: 'Cilium replaces Docker with podman', isCorrect: false, explanation: 'Container runtime is independent of CNI.' },
      { id: 'b', text: 'Cilium uses eBPF in the Linux kernel to bypass sequential O(N) iptables rules with O(1) hash maps', isCorrect: true, explanation: 'Traditional kube-proxy creates linear iptables rules for every service endpoint (O(N) search complexity). Cilium uses eBPF programs attached to kernel socket hooks, replacing iptables with fast BPF O(1) map lookups.' },
      { id: 'c', text: 'Cilium disables network security policies', isCorrect: false, explanation: 'Cilium provides richer L3/L4/L7 eBPF security policies.' },
      { id: 'd', text: 'Cilium requires external hardware routers', isCorrect: false, explanation: 'eBPF runs inside the standard Linux kernel.' },
    ],
    explanation: 'Cilium uses eBPF kernel technology to replace sequential iptables rule processing with O(1) BPF map lookups, drastically reducing packet latency in large clusters.',
  },

  // ── Ethernet & Frames ────────────────────────────────────────────────────────
  {
    id: 'ethernet-q1',
    topicId: 'ethernet',
    type: 'mcq',
    difficulty: 'beginner',
    question: 'What is the purpose of the 4-byte Frame Check Sequence (FCS) at the end of an Ethernet II frame?',
    options: [
      { id: 'a', text: 'To specify the destination MAC address', isCorrect: false, explanation: 'Destination MAC is in bytes 9-14.' },
      { id: 'b', text: 'To detect bit-level transmission errors using a CRC-32 checksum', isCorrect: true, explanation: 'FCS contains a CRC-32 checksum calculated over the frame. If the receiver recalculation fails, the frame is corrupted and discarded.' },
      { id: 'c', text: 'To encrypt payload data', isCorrect: false, explanation: 'Ethernet frames are unencrypted unless MACsec (802.1AE) or upper-layer TLS is used.' },
      { id: 'd', text: 'To assign VLAN tags', isCorrect: false, explanation: '802.1Q tags are inserted after the Source MAC.' },
    ],
    explanation: 'The 4-byte FCS field uses CRC-32 to detect frame corruption during physical medium transmission.',
  },

  // ── MAC Addresses ────────────────────────────────────────────────────────────
  {
    id: 'mac-q1',
    topicId: 'mac-address',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'How do you determine if a MAC address is a Unicast or Multicast address by looking at its raw bytes?',
    options: [
      { id: 'a', text: 'Check if the last octet is 255', isCorrect: false, explanation: 'MAC addresses use hexadecimal notation.' },
      { id: 'b', text: 'Examine Bit 0 (the least significant bit) of the first octet: 0 = Unicast, 1 = Multicast', isCorrect: true, explanation: 'Per IEEE 802, Bit 0 of the first octet is the I/G (Individual/Group) bit. 0 means unicast (individual device), 1 means multicast/broadcast (group).' },
      { id: 'c', text: 'Check if the first 3 bytes match 00:00:00', isCorrect: false, explanation: 'First 3 bytes are the manufacturer OUI.' },
      { id: 'd', text: 'Check if all bits are set to 0', isCorrect: false, explanation: 'All zeroes is an uninitialized/null MAC.' },
    ],
    explanation: 'Bit 0 of the first octet of a MAC address indicates Unicast (0) vs Multicast/Group (1).',
  },
  // ── Service Mesh & mTLS ──────────────────────────────────────────────────────
  {
    id: 'sm-q1',
    topicId: 'service-mesh',
    type: 'mcq',
    difficulty: 'advanced',
    question: 'How does Mutual TLS (mTLS) in a Service Mesh (e.g. Istio) authenticate workload identity without hardcoded passwords?',
    options: [
      { id: 'a', text: 'By passing bearer tokens in HTTP headers', isCorrect: false, explanation: 'Bearer tokens can leak and require app-level handling.' },
      { id: 'b', text: 'By exchanging X.509 certificates with SPIFFE ID SANs during the TLS handshake', isCorrect: true, explanation: 'Envoy proxies exchange short-lived X.509 certs with SPIFFE IDs in the SAN field, ensuring cryptographically verified pod identity.' },
      { id: 'c', text: 'By matching source IP addresses against a whitelist', isCorrect: false, explanation: 'Kubernetes Pod IPs are ephemeral and not trusted.' },
      { id: 'd', text: 'By storing shared SSH keys in Kubernetes Secrets', isCorrect: false, explanation: 'SSH is not used for Envoy mTLS.' },
    ],
    explanation: 'Service mesh mTLS uses SPIFFE X.509 certificates for mutual cryptographic identity verification between sidecar proxies.',
  },

  // ── eBPF ─────────────────────────────────────────────────────────────────────
  {
    id: 'ebpf-q1',
    topicId: 'ebpf',
    type: 'mcq',
    difficulty: 'advanced',
    question: 'Why does eBPF networking (e.g. Cilium CNI) achieve significantly lower latency than legacy iptables at scale?',
    options: [
      { id: 'a', text: 'Because eBPF runs in userspace with high priority', isCorrect: false, explanation: 'eBPF runs in kernel space, not userspace.' },
      { id: 'b', text: 'Because eBPF uses O(1) hash maps for routing instead of sequential O(N) iptables rule evaluation', isCorrect: true, explanation: 'iptables scans rules linearly O(N), whereas eBPF maps perform constant-time O(1) lookups and bypass netfilter.' },
      { id: 'c', text: 'Because eBPF disables TCP checksums', isCorrect: false, explanation: 'eBPF preserves full TCP checksum integrity.' },
      { id: 'd', text: 'Because eBPF relies on hardware switches', isCorrect: false, explanation: 'eBPF is pure Linux kernel software.' },
    ],
    explanation: 'eBPF replaces linear O(N) iptables rule scanning with O(1) kernel hash map lookups.',
  },

  // ── VPNs & Overlay Tunnels ───────────────────────────────────────────────────
  {
    id: 'vpn-q1',
    topicId: 'vpn-tunnels',
    type: 'mcq',
    difficulty: 'intermediate',
    question: 'What is the main difference between IPsec Transport Mode and IPsec Tunnel Mode?',
    options: [
      { id: 'a', text: 'Transport mode encrypts only the payload; Tunnel mode encrypts the entire original IP packet inside a new IP header', isCorrect: true, explanation: 'Transport mode preserves original IP headers for host-to-host; Tunnel mode encapsulates full packets inside outer IP headers for site-to-site VPNs.' },
      { id: 'b', text: 'Tunnel mode uses UDP, Transport mode uses TCP', isCorrect: false, explanation: 'Both use ESP/AH protocols.' },
      { id: 'c', text: 'Transport mode is unencrypted', isCorrect: false, explanation: 'Both modes encrypt traffic.' },
      { id: 'd', text: 'Tunnel mode only supports IPv6', isCorrect: false, explanation: 'Both support IPv4 and IPv6.' },
    ],
    explanation: 'IPsec Tunnel Mode encrypts the entire original IP packet and wraps it in a new outer IP header for gateway-to-gateway VPNs.',
  },

  // ── Kernel TCP Tuning ───────────────────────────────────────────────────────
  {
    id: 'kt-q1',
    topicId: 'kernel-tuning',
    type: 'mcq',
    difficulty: 'advanced',
    question: 'What happens if a high-throughput Linux server exceeds `net.netfilter.nf_conntrack_max`?',
    options: [
      { id: 'a', text: 'The kernel automatically switches to UDP', isCorrect: false, explanation: 'Kernel does not alter transport protocols.' },
      { id: 'b', text: 'The kernel drops incoming packets and logs "nf_conntrack: table full"', isCorrect: true, explanation: 'When conntrack table fills up, netfilter drops new packets immediately, causing service outages.' },
      { id: 'c', text: 'Connections are routed around the firewall', isCorrect: false, explanation: 'Firewall logic is enforced; packets are dropped.' },
      { id: 'd', text: 'Memory is swapped to disk', isCorrect: false, explanation: 'Conntrack operates in locked kernel memory.' },
    ],
    explanation: 'When the connection tracking table is full, Linux drops new connection packets immediately.',
  },
];

export default quizBank;


