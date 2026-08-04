// ─── OSI Layers ──────────────────────────────────────────────────────────────
export type OSILayerNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface OSILayer {
  number: OSILayerNumber;
  name: string;
  shortName: string;
  pdu: string;
  protocols: string[];
  devices: string[];
  responsibility: string;
  color: string;
  tcpIpEquivalent?: string;
}

// ─── Network Packet ───────────────────────────────────────────────────────────
export type Protocol =
  | 'TCP' | 'UDP' | 'ICMP' | 'ARP' | 'DNS' | 'HTTP' | 'HTTPS'
  | 'TLS' | 'DHCP' | 'BGP' | 'OSPF' | 'SSH' | 'Ethernet' | 'IP';

export interface TCPFlags {
  SYN: boolean;
  ACK: boolean;
  FIN: boolean;
  RST: boolean;
  PSH: boolean;
  URG: boolean;
  ECE: boolean;
  CWR: boolean;
}

export interface NetworkPacket {
  id: string;
  label: string;
  srcIP?: string;
  dstIP?: string;
  srcMAC?: string;
  dstMAC?: string;
  ttl?: number;
  protocol: Protocol;
  srcPort?: number;
  dstPort?: number;
  tcpFlags?: Partial<TCPFlags>;
  seqNum?: number;
  ackNum?: number;
  windowSize?: number;
  payload?: string;
  checksum?: string;
  queryType?: string;    // DNS
  queryName?: string;    // DNS
  opCode?: string;       // ARP
  osiLayer: OSILayerNumber;
  color: string;
  description: string;
}

// ─── Topic Structure ──────────────────────────────────────────────────────────
export type TopicCategory =
  | 'fundamentals'
  | 'data-link'
  | 'network'
  | 'transport'
  | 'application'
  | 'security'
  | 'infrastructure'
  | 'cloud'
  | 'kubernetes'
  | 'docker';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LinuxCommand {
  command: string;
  description: string;
  example?: string;
  output?: string;
  manPage?: string;
}

export interface CloudMapping {
  aws?: string[];
  azure?: string[];
  gcp?: string[];
  kubernetes?: string[];
  docker?: string[];
  linux?: string[];
}

export interface Reference {
  title: string;
  url: string;
  type: 'rfc' | 'cisco' | 'linux' | 'aws' | 'azure' | 'gcp' | 'k8s' | 'ietf' | 'official';
  rfcNumber?: number;
  description?: string;
}

export interface Topic {
  id: string;
  title: string;
  subtitle: string;
  category: TopicCategory;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  tags: string[];
  simpleExplanation: string;
  technicalExplanation: string;
  linuxCommands: LinuxCommand[];
  cloudMapping: CloudMapping;
  references: Reference[];
  quizIds: string[];
  hasAnimation: boolean;
  hasPacketFlow: boolean;
  hasPlayground: boolean;
}

// ─── Animation / Simulation ───────────────────────────────────────────────────
export interface AnimationStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  technicalDetail: string;
  packet?: NetworkPacket;
  highlightedOSILayers?: OSILayerNumber[];
  duration: number; // ms
}

export interface AnimationState {
  isPlaying: boolean;
  currentStep: number;
  speed: number; // 0.5 | 1 | 1.5 | 2
  totalSteps: number;
}

// ─── Quiz System ──────────────────────────────────────────────────────────────
export type QuizType = 'mcq' | 'scenario' | 'fill-blank' | 'packet-analysis' | 'drag-drop';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  type: QuizType;
  difficulty: DifficultyLevel;
  question: string;
  context?: string;        // for scenario questions
  packetData?: Partial<NetworkPacket>; // for packet analysis
  options: QuizOption[];
  explanation: string;
  references?: Reference[];
  rfcNote?: string;
}

export interface QuizSession {
  topicId: string;
  questions: QuizQuestion[];
  answers: Record<string, string>; // questionId → chosenOptionId
  score: number;
  completed: boolean;
  startedAt: number;
  completedAt?: number;
}

// ─── AI Tutor ─────────────────────────────────────────────────────────────────
export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  relatedTopicId?: string;
  references?: Reference[];
  timestamp: number;
  confidence: 'high' | 'medium' | 'low' | 'uncertain';
}

export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  topicId?: string;
  references?: Reference[];
  confidence: 'high' | 'medium' | 'low' | 'uncertain';
}

// ─── Progress Tracking ────────────────────────────────────────────────────────
export interface TopicProgress {
  topicId: string;
  viewed: boolean;
  animationCompleted: boolean;
  quizScore?: number;
  quizAttempts: number;
  lastVisited?: number;
}

export interface UserProgress {
  topics: Record<string, TopicProgress>;
  totalQuizzes: number;
  averageScore: number;
  streak: number;
  lastActive?: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon?: string;
  badge?: string;
  topicId?: string;
}

export interface NavSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: NavItem[];
}

// ─── Subnet Calculator ───────────────────────────────────────────────────────
export interface SubnetResult {
  networkAddress: string;
  broadcastAddress: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  subnetMask: string;
  wildcardMask: string;
  cidrNotation: string;
  binaryNetworkAddress: string;
  binarySubnetMask: string;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'Unknown';
  isPrivate: boolean;
  privateRange?: string;
}
