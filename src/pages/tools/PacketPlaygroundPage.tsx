import React from 'react';
import { Binary } from 'lucide-react';
import PacketInspector from '../../components/shared/PacketInspector';

export default function PacketPlaygroundPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Binary size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Packet Inspector Playground
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Interactive Protocol Header Byte Analysis</p>
          </div>
          <span className="ml-auto badge-blue">Tool</span>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            Inspect raw protocol headers byte-by-byte. Click any field to see its bit offset, hex value, and RFC-accurate technical description. Switch between Ethernet, IPv4, TCP, UDP, and ICMP headers.
          </p>
        </div>
      </div>
      <PacketInspector />
    </div>
  );
}
