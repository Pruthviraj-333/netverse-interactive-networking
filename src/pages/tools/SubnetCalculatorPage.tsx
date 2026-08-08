import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { calculateSubnet, parseCIDR, isValidIPv4, cidrToMask, toBinaryDotted } from '../../utils/subnet';
import type { SubnetResult } from '../../types';

export default function SubnetCalculatorPage() {
  const [input, setInput] = useState('192.168.10.0/24');
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    calculate();
  }, []);

  const calculate = () => {
    setError('');
    const parsed = parseCIDR(input.trim());
    if (!parsed) {
      setError('Invalid CIDR notation. Use format: 192.168.1.0/24');
      setResult(null);
      return;
    }
    const res = calculateSubnet(parsed.ip, parsed.cidr);
    if (!res) {
      setError('Could not calculate subnet. Check IP and prefix length (0–32).');
      setResult(null);
    } else {
      setResult(res);
    }
  };

  const copyValue = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const QUICK_EXAMPLES = ['10.0.0.0/8', '172.16.0.0/12', '192.168.1.0/24', '10.200.100.128/25', '192.168.50.200/30', '10.10.10.10/31'];

  const resultRows = result ? [
    { label: 'CIDR Notation',       value: result.cidrNotation,         color: '#3b82f6' },
    { label: 'Network Address',     value: result.networkAddress,        color: '#10b981' },
    { label: 'Subnet Mask',         value: result.subnetMask,           color: '#8b5cf6' },
    { label: 'Wildcard Mask',       value: result.wildcardMask,         color: '#06b6d4' },
    { label: 'Broadcast Address',   value: result.broadcastAddress,     color: '#f59e0b' },
    { label: 'First Usable Host',   value: result.firstHost,            color: '#10b981' },
    { label: 'Last Usable Host',    value: result.lastHost,             color: '#10b981' },
    { label: 'Total Hosts',         value: result.totalHosts.toLocaleString(), color: '#ec4899' },
    { label: 'Usable Hosts',        value: result.usableHosts.toLocaleString(), color: '#ec4899' },
    { label: 'IP Class (Legacy)',   value: result.ipClass,              color: '#64748b' },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Calculator size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Subnet Calculator
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">CIDR · RFC 4632 · Visual Breakdown</p>
          </div>
          <span className="ml-auto badge-blue">Tool</span>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            Enter any IPv4 CIDR notation to instantly compute network address, broadcast, usable host range, subnet mask, wildcard mask, and binary representations. Results are RFC 791 / RFC 4632 accurate.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="glass rounded-2xl p-6 mb-6 space-y-4">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">CIDR Input</label>
        <div className="flex gap-3">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="192.168.1.0/24"
            className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white font-mono outline-none border border-white/[0.1] focus:border-blue-500 transition-colors"
          />
          <button onClick={calculate}
            className="btn-primary px-5 py-3 text-sm font-semibold rounded-xl flex items-center gap-2">
            <Calculator size={14} /> Calculate
          </button>
        </div>

        {/* Quick examples */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500">Quick:</span>
          {QUICK_EXAMPLES.map(ex => (
            <button key={ex} onClick={() => { setInput(ex); setTimeout(calculate, 0); }}
              className="text-xs font-mono px-2.5 py-1 rounded-lg glass border border-white/[0.06] text-slate-400 hover:text-blue-400 hover:border-blue-500/40 transition-all">
              {ex}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertTriangle size={12} /> {error}
          </div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              {result.isPrivate && (
                <span className="text-xs px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
                  🔒 Private — {result.privateRange}
                </span>
              )}
              {!result.isPrivate && (
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  🌐 Public Routable IP
                </span>
              )}
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                Class {result.ipClass}
              </span>
            </div>

            {/* Main results grid */}
            <div className="glass-strong rounded-2xl overflow-hidden border border-white/[0.06]">
              {resultRows.map((row, i) => (
                <div key={row.label}
                  className={`flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${i < resultRows.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
                  <span className="text-xs text-slate-400 font-medium">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold" style={{ color: row.color }}>{row.value}</span>
                    <button onClick={() => copyValue(row.value, row.label)}
                      className="opacity-40 hover:opacity-100 transition-opacity p-1">
                      {copied === row.label
                        ? <CheckCircle2 size={12} className="text-emerald-400" />
                        : <Copy size={12} className="text-slate-400" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Binary visualization */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Binary Visualization</h3>
              {[
                { label: 'Network Address', bin: result.binaryNetworkAddress, cidr: parseCIDR(input)?.cidr ?? 24 },
                { label: 'Subnet Mask', bin: result.binarySubnetMask, cidr: parseCIDR(input)?.cidr ?? 24 },
              ].map(({ label, bin, cidr }) => {
                const parts = bin.split('.');
                let bitCount = 0;
                return (
                  <div key={label} className="space-y-1">
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="font-mono text-xs flex gap-1 flex-wrap">
                      {parts.map((octet, oi) => (
                        <span key={oi}>
                          {octet.split('').map((bit, bi) => {
                            const globalIdx = oi * 8 + bi;
                            const isNetwork = globalIdx < cidr;
                            return (
                              <span key={bi}
                                className={`${isNetwork ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
                                {bit}
                              </span>
                            );
                          })}
                          {oi < 3 && <span className="text-slate-600">.</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="text-xs text-slate-500 flex items-center gap-3 pt-1 border-t border-white/[0.06]">
                <span><span className="text-blue-400 font-bold">Blue</span> = Network bits (prefix)</span>
                <span><span className="text-slate-400">Gray</span> = Host bits</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
