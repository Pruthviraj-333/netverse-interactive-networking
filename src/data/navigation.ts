import type { NavSection } from '../types';

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'fundamentals',
    title: 'Fundamentals',
    icon: 'BookOpen',
    color: '#3b82f6',
    items: [
      { id: 'osi-model',   title: 'OSI Model',         path: '/topic/osi-model',   topicId: 'osi-model' },
      { id: 'tcpip-model', title: 'TCP/IP Model',       path: '/topic/tcpip-model', topicId: 'tcpip-model' },
    ],
  },
  {
    id: 'data-link',
    title: 'Data Link Layer',
    icon: 'Link',
    color: '#f59e0b',
    items: [
      { id: 'ethernet',    title: 'Ethernet & Frames',  path: '/topic/ethernet',    topicId: 'ethernet' },
      { id: 'mac-address', title: 'MAC Addresses',      path: '/topic/mac-address', topicId: 'mac-address' },
      { id: 'arp',         title: 'ARP',                path: '/topic/arp',         topicId: 'arp' },
    ],
  },
  {
    id: 'network',
    title: 'Network Layer',
    icon: 'Globe',
    color: '#10b981',
    items: [
      { id: 'ip-addressing', title: 'IP Addressing & CIDR', path: '/topic/ip-addressing', topicId: 'ip-addressing' },
      { id: 'subnetting',    title: 'Subnetting',           path: '/topic/subnetting',    topicId: 'subnetting' },
      { id: 'routing',       title: 'Routing',              path: '/topic/routing',       topicId: 'routing', badge: 'Soon' },
      { id: 'nat',           title: 'NAT / PAT',            path: '/topic/nat',           topicId: 'nat' },
    ],
  },
  {
    id: 'transport',
    title: 'Transport Layer',
    icon: 'Activity',
    color: '#3b82f6',
    items: [
      { id: 'tcp', title: 'TCP',   path: '/topic/tcp', topicId: 'tcp' },
      { id: 'udp', title: 'UDP',   path: '/topic/udp', topicId: 'udp' },
      { id: 'icmp', title: 'ICMP', path: '/topic/icmp', topicId: 'icmp' },
    ],
  },
  {
    id: 'application',
    title: 'Application Layer',
    icon: 'Code2',
    color: '#8b5cf6',
    items: [
      { id: 'dns',   title: 'DNS',         path: '/topic/dns',   topicId: 'dns' },
      { id: 'dhcp',  title: 'DHCP',        path: '/topic/dhcp',  topicId: 'dhcp' },
      { id: 'http',  title: 'HTTP / REST', path: '/topic/http',  topicId: 'http',  badge: 'Soon' },
      { id: 'https', title: 'HTTPS & TLS', path: '/topic/https', topicId: 'https' },
      { id: 'ssh',   title: 'SSH',         path: '/topic/ssh',   topicId: 'ssh',   badge: 'Soon' },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    icon: 'Server',
    color: '#06b6d4',
    items: [
      { id: 'firewalls',      title: 'Firewalls & iptables', path: '/topic/firewalls',      badge: 'Soon' },
      { id: 'load-balancing', title: 'Load Balancing',       path: '/topic/load-balancing', badge: 'Soon' },
      { id: 'vpn',            title: 'VPN',                  path: '/topic/vpn',            badge: 'Soon' },
    ],
  },
  {
    id: 'cloud',
    title: 'Cloud Networking',
    icon: 'Cloud',
    color: '#f43f5e',
    items: [
      { id: 'aws-vpc', title: 'AWS VPC',     path: '/topic/aws-vpc', badge: 'Soon' },
      { id: 'docker',  title: 'Docker Nets', path: '/topic/docker',  badge: 'Soon' },
      { id: 'k8s-net', title: 'Kubernetes',  path: '/topic/k8s-networking', badge: 'Soon' },
    ],
  },
];

export const LEARNING_MODES = [
  { id: 'beginner',    label: 'Beginner',    description: 'Start from scratch' },
  { id: 'intermediate', label: 'Intermediate', description: 'Solidify concepts' },
  { id: 'advanced',    label: 'Advanced',    description: 'Deep technical detail' },
  { id: 'interview',   label: 'Interview',   description: 'Prep for technical rounds' },
  { id: 'cheatsheet',  label: 'Cheat Sheet', description: 'Quick reference' },
] as const;

export type LearningMode = typeof LEARNING_MODES[number]['id'];
