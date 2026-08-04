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
import HTTPPage from './pages/topics/HTTPPage';
import SSHPage from './pages/topics/SSHPage';
import TCPIPModelPage from './pages/topics/TCPIPModelPage';
import RoutingPage from './pages/topics/RoutingPage';
import FirewallsPage from './pages/topics/FirewallsPage';
import LoadBalancingPage from './pages/topics/LoadBalancingPage';
import VPCPage from './pages/topics/VPCPage';
import DockerNetworkingPage from './pages/topics/DockerNetworkingPage';
import KubernetesNetworkingPage from './pages/topics/KubernetesNetworkingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />

          {/* Phase 1 Topics */}
          <Route path="/topic/osi-model"     element={<OSIModelPage />} />
          <Route path="/topic/dns"           element={<DNSPage />} />
          <Route path="/topic/tcp"           element={<TCPPage />} />
          <Route path="/topic/arp"           element={<ARPPage />} />
          <Route path="/topic/ip-addressing" element={<SubnettingPage />} />
          <Route path="/topic/subnetting"    element={<Navigate to="/topic/ip-addressing" replace />} />

          {/* Phase 2 Topics */}
          <Route path="/topic/dhcp"          element={<DHCPPage />} />
          <Route path="/topic/nat"           element={<NATPATPage />} />
          <Route path="/topic/udp"           element={<UDPPage />} />
          <Route path="/topic/icmp"          element={<ICMPPage />} />
          <Route path="/topic/https"         element={<HTTPSPage />} />

          {/* Phase 3 Topics */}
          <Route path="/topic/http font"     element={<HTTPPage />} />
          <Route path="/topic/http"          element={<HTTPPage />} />
          <Route path="/topic/ssh"           element={<SSHPage />} />
          <Route path="/topic/tcpip-model"   element={<TCPIPModelPage />} />
          <Route path="/topic/routing"       element={<RoutingPage />} />
          <Route path="/topic/firewalls"     element={<FirewallsPage />} />
          <Route path="/topic/load-balancing" element={<LoadBalancingPage />} />
          <Route path="/topic/vpc"           element={<VPCPage />} />
          <Route path="/topic/docker-networking" element={<DockerNetworkingPage />} />
          <Route path="/topic/kubernetes-networking" element={<KubernetesNetworkingPage />} />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
