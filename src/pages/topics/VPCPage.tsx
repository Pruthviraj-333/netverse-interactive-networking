import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Shield, Server, ArrowRight, Lock, Globe, Cpu } from 'lucide-react';
import CodeBlock from '../../components/shared/CodeBlock';
import ReferencePanel from '../../components/shared/ReferencePanel';
import Quiz from '../../components/quiz/Quiz';
import { OSILayerBadge } from '../../components/shared/OSIComponents';
import { useProgress } from '../../stores';
import type { Reference } from '../../types';

const REFERENCES: Reference[] = [
  { title: 'AWS VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html', type: 'aws' },
  { title: 'AWS Security Groups vs NACLs', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Security.html', type: 'aws' },
];

export default function VPCPage() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'secgroups' | 'quiz'>('architecture');
  const { markTopicViewed } = useProgress();

  useEffect(() => { markTopicViewed('vpc'); }, [markTopicViewed]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Cloud size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">AWS VPC — Virtual Private Cloud</h1>
            <p className="text-sm text-slate-500 mt-0.5">Cloud Infrastructure Networking · AWS Architecture</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge-amber">AWS Cloud</span>
            <span className="badge-green">Intermediate</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-semibold">Simple explanation: </span>
            An AWS VPC (Virtual Private Cloud) is your own isolated private data center inside AWS. You define the IP range, subnets, route tables, and firewalls.
          </p>
        </div>

        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-white font-semibold">Technical explanation: </span>
            A VPC is a logically isolated virtual network defined by an IPv4 CIDR block (e.g. <code className="font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 text-xs">10.0.0.0/16</code>). It spans all Availability Zones (AZs) in an AWS Region. Subnets reside inside specific AZs. Internet Gateways (IGW) provide public internet connectivity to Public Subnets, while NAT Gateways allow Private Subnets outbound-only internet access.
          </p>
        </div>
      </div>

      <div className="tab-bar mb-6">
        {(['architecture', 'secgroups', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'architecture' ? '☁️ VPC Topology' : tab === 'secgroups' ? '🛡️ Security Groups vs NACLs' : '🧪 Quiz'}
          </button>
        ))}
      </div>

      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="canvas-bg rounded-2xl border border-white/[0.06] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="font-mono text-sm font-bold text-orange-400">VPC (10.0.0.0/16)</span>
              <span className="text-xs text-slate-400">AWS Region: us-east-1</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Public Subnet */}
              <div className="glass rounded-xl p-4 border border-blue-500/30 bg-blue-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 font-mono">Public Subnet (10.0.1.0/24)</span>
                  <span className="text-[10px] font-mono text-slate-400">AZ-1a</span>
                </div>
                <p className="text-xs text-slate-300">Route table points `0.0.0.0/0` → Internet Gateway (`igw-xxxx`).</p>
                <div className="glass p-2.5 rounded-lg text-xs font-mono text-slate-300 space-y-1">
                  <div>• ALB / Bastion Host</div>
                  <div>• NAT Gateway (10.0.1.50)</div>
                </div>
              </div>

              {/* Private Subnet */}
              <div className="glass rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 font-mono">Private Subnet (10.0.2.0/24)</span>
                  <span className="text-[10px] font-mono text-slate-400">AZ-1a</span>
                </div>
                <p className="text-xs text-slate-300">Route table points `0.0.0.0/0` → NAT Gateway (`nat-xxxx`).</p>
                <div className="glass p-2.5 rounded-lg text-xs font-mono text-slate-300 space-y-1">
                  <div>• EC2 Application Instances</div>
                  <div>• RDS PostgreSQL Database</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'secgroups' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
              <h3 className="text-sm font-bold text-white">Security Groups (SG)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Operates at the Elastic Network Interface (ENI / EC2 instance) level.</p>
              <ul className="text-xs text-slate-400 space-y-1 pt-2">
                <li>• <strong className="text-white font-semibold">Stateful:</strong> Return traffic is automatically allowed.</li>
                <li>• Supports ALLOW rules only (no explicit DENY).</li>
              </ul>
            </div>

            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-2">
              <h3 className="text-sm font-bold text-white">Network ACLs (NACL)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Operates at the Subnet boundary level.</p>
              <ul className="text-xs text-slate-400 space-y-1 pt-2">
                <li>• <strong className="text-white font-semibold">Stateless:</strong> Must explicitly allow both inbound and outbound traffic.</li>
                <li>• Supports both ALLOW and DENY rules. Evaluated in rule number order.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && <Quiz topicId="vpc" />}

      <div className="mt-10 section-divider"><span className="text-xs text-slate-500">AWS CLI VPC Commands</span></div>
      <CodeBlock language="bash" filename="aws-vpc.sh" code={`# Create VPC with CIDR 10.0.0.0/16
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create Public Subnet
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.0.1.0/24 --availability-zone us-east-1a

# Attach Internet Gateway
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id vpc-12345678 --internet-gateway-id igw-12345678`} />

      <div className="mt-8"><ReferencePanel references={REFERENCES} /></div>
    </div>
  );
}
