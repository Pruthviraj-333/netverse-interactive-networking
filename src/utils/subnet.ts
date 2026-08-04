import type { SubnetResult } from '../types';

/**
 * Converts a dotted-decimal IP string to a 32-bit integer.
 * RFC 791 §3.1 – Internet Protocol defines 32-bit address space.
 */
export function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

/**
 * Converts a 32-bit integer back to dotted-decimal notation.
 */
export function intToIp(int: number): string {
  return [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>>  8) & 0xff,
    int & 0xff,
  ].join('.');
}

/**
 * Converts a CIDR prefix length to a dotted-decimal subnet mask.
 * e.g. 24 → "255.255.255.0"
 */
export function cidrToMask(cidr: number): string {
  if (cidr === 0) return '0.0.0.0';
  const mask = (~0 << (32 - cidr)) >>> 0;
  return intToIp(mask);
}

/**
 * Converts a dotted-decimal mask to CIDR prefix length.
 * e.g. "255.255.255.0" → 24
 */
export function maskToCidr(mask: string): number {
  return ipToInt(mask).toString(2).split('0')[0].length;
}

/**
 * Converts a 32-bit integer to a formatted binary string with dots
 * every 8 bits for readability.  e.g. "11000000.10101000.00000001.00000000"
 */
export function toBinaryDotted(ip: string): string {
  return ip
    .split('.')
    .map(octet => parseInt(octet, 10).toString(2).padStart(8, '0'))
    .join('.');
}

/**
 * Validates an IPv4 address string.
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && p !== '';
  });
}

/**
 * Determines the traditional classful IP class.
 * Note: Classful addressing is superseded by CIDR (RFC 1519), but
 * remains useful for understanding reserved ranges.
 */
export function getIPClass(ip: string): 'A' | 'B' | 'C' | 'D' | 'E' | 'Unknown' {
  const first = parseInt(ip.split('.')[0], 10);
  if (first >= 1   && first <= 126)  return 'A';
  if (first >= 128 && first <= 191)  return 'B';
  if (first >= 192 && first <= 223)  return 'C';
  if (first >= 224 && first <= 239)  return 'D'; // Multicast
  if (first >= 240 && first <= 255)  return 'E'; // Reserved
  return 'Unknown';
}

/**
 * Checks if an IPv4 address is in a private range per RFC 1918:
 *  10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
 * Also includes 127.0.0.0/8 (loopback, RFC 5735) and 169.254.0.0/16 (APIPA, RFC 3927).
 */
export function getPrivateRange(ip: string): { isPrivate: boolean; range?: string } {
  const n = ipToInt(ip);
  const ranges: Array<{ start: string; cidr: number; label: string }> = [
    { start: '10.0.0.0',      cidr: 8,  label: '10.0.0.0/8 (RFC 1918 Class A private)' },
    { start: '172.16.0.0',    cidr: 12, label: '172.16.0.0/12 (RFC 1918 Class B private)' },
    { start: '192.168.0.0',   cidr: 16, label: '192.168.0.0/16 (RFC 1918 Class C private)' },
    { start: '127.0.0.0',     cidr: 8,  label: '127.0.0.0/8 (Loopback – RFC 5735)' },
    { start: '169.254.0.0',   cidr: 16, label: '169.254.0.0/16 (Link-local / APIPA – RFC 3927)' },
    { start: '100.64.0.0',    cidr: 10, label: '100.64.0.0/10 (Shared Address Space – RFC 6598)' },
  ];
  for (const r of ranges) {
    const net  = ipToInt(r.start);
    const mask = (~0 << (32 - r.cidr)) >>> 0;
    if ((n & mask) === (net & mask)) return { isPrivate: true, range: r.label };
  }
  return { isPrivate: false };
}

/**
 * Full subnet calculation.
 * Given an IP and CIDR prefix, returns all useful subnet information.
 * Accuracy: network address = IP & mask (RFC 791, RFC 1812).
 */
export function calculateSubnet(ip: string, cidr: number): SubnetResult | null {
  if (!isValidIPv4(ip) || cidr < 0 || cidr > 32) return null;

  const ipInt    = ipToInt(ip);
  const maskInt  = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const netInt   = (ipInt & maskInt) >>> 0;
  const wildInt  = (~maskInt) >>> 0;
  const bcInt    = (netInt | wildInt) >>> 0;

  const totalHosts  = cidr <= 30 ? Math.pow(2, 32 - cidr) : cidr === 31 ? 2 : 1;
  const usableHosts = cidr <= 30 ? totalHosts - 2 : cidr === 31 ? 2 : 1;

  const firstHost = cidr <= 30 ? intToIp(netInt + 1) : intToIp(netInt);
  const lastHost  = cidr <= 30 ? intToIp(bcInt - 1)  : intToIp(bcInt);

  const subnetMask = intToIp(maskInt);
  const { isPrivate, range } = getPrivateRange(intToIp(netInt));

  return {
    networkAddress: intToIp(netInt),
    broadcastAddress: intToIp(bcInt),
    firstHost,
    lastHost,
    totalHosts,
    usableHosts,
    subnetMask,
    wildcardMask: intToIp(wildInt),
    cidrNotation: `${intToIp(netInt)}/${cidr}`,
    binaryNetworkAddress: toBinaryDotted(intToIp(netInt)),
    binarySubnetMask: toBinaryDotted(subnetMask),
    ipClass: getIPClass(ip),
    isPrivate,
    privateRange: range,
  };
}

/**
 * Parses a CIDR string like "192.168.1.0/24" into { ip, cidr }.
 */
export function parseCIDR(cidrStr: string): { ip: string; cidr: number } | null {
  const parts = cidrStr.trim().split('/');
  if (parts.length !== 2) return null;
  const ip   = parts[0].trim();
  const cidr = parseInt(parts[1], 10);
  if (!isValidIPv4(ip) || isNaN(cidr)) return null;
  return { ip, cidr };
}
