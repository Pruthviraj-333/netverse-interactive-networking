import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import OSIModelPage from './pages/topics/OSIModelPage';
import DNSPage from './pages/topics/DNSPage';
import TCPPage from './pages/topics/TCPPage';
import ARPPage from './pages/topics/ARPPage';
import SubnettingPage from './pages/topics/SubnettingPage';
import DHCPPage from './pages/topics/DHCPPage';
import NATPATPage from './pages/topics/NATPATPage';
import UDPPage from './pages/topics/UDPPage';
import ICMPPage from './pages/topics/ICMPPage';
import HTTPSPage from './pages/topics/HTTPSPage';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in">
      <div className="text-6xl">🚧</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-slate-400 text-sm">This topic is coming in Phase 2. Stay tuned!</p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-electric-500/30 border-t-electric-500 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />

          {/* Phase 1 — Live topics */}
          <Route path="/topic/osi-model"     element={<OSIModelPage />} />
          <Route path="/topic/dns"           element={<DNSPage />} />
          <Route path="/topic/tcp"           element={<TCPPage />} />
          <Route path="/topic/arp"           element={<ARPPage />} />
          <Route path="/topic/ip-addressing" element={<SubnettingPage />} />
          <Route path="/topic/subnetting"    element={<Navigate to="/topic/ip-addressing" replace />} />

          {/* Phase 2 — Live */}
          <Route path="/topic/dhcp"          element={<DHCPPage />} />
          <Route path="/topic/nat"           element={<NATPATPage />} />
          <Route path="/topic/udp"           element={<UDPPage />} />
          <Route path="/topic/icmp"          element={<ICMPPage />} />
          <Route path="/topic/https"         element={<HTTPSPage />} />

          {/* Still coming */}
          <Route path="/topic/tcpip-model"   element={<ComingSoon title="TCP/IP Model" />} />
          <Route path="/topic/ethernet"      element={<ComingSoon title="Ethernet & Frames" />} />
          <Route path="/topic/mac-address"   element={<ComingSoon title="MAC Addresses" />} />
          <Route path="/topic/routing"       element={<ComingSoon title="Routing" />} />
          <Route path="/topic/http"          element={<ComingSoon title="HTTP / REST" />} />
          <Route path="/topic/ssh"           element={<ComingSoon title="SSH" />} />
          <Route path="/topic/firewalls"     element={<ComingSoon title="Firewalls & iptables" />} />
          <Route path="/topic/load-balancing" element={<ComingSoon title="Load Balancing" />} />
          <Route path="/topic/vpn"           element={<ComingSoon title="VPN" />} />
          <Route path="/topic/aws-vpc"       element={<ComingSoon title="AWS VPC" />} />
          <Route path="/topic/docker"        element={<ComingSoon title="Docker Networking" />} />
          <Route path="/topic/k8s-networking" element={<ComingSoon title="Kubernetes Networking" />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
