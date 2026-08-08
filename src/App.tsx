import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';

// Lazy-loaded Topic Pages for Code-Splitting
const OSIModelPage = lazy(() => import('./pages/topics/OSIModelPage'));
const TCPIPModelPage = lazy(() => import('./pages/topics/TCPIPModelPage'));
const EthernetPage = lazy(() => import('./pages/topics/EthernetPage'));
const MACAddressPage = lazy(() => import('./pages/topics/MACAddressPage'));
const ARPPage = lazy(() => import('./pages/topics/ARPPage'));
const SubnettingPage = lazy(() => import('./pages/topics/SubnettingPage'));
const RoutingPage = lazy(() => import('./pages/topics/RoutingPage'));
const NATPATPage = lazy(() => import('./pages/topics/NATPATPage'));
const TCPPage = lazy(() => import('./pages/topics/TCPPage'));
const UDPPage = lazy(() => import('./pages/topics/UDPPage'));
const ICMPPage = lazy(() => import('./pages/topics/ICMPPage'));
const DNSPage = lazy(() => import('./pages/topics/DNSPage'));
const DHCPPage = lazy(() => import('./pages/topics/DHCPPage'));
const HTTPPage = lazy(() => import('./pages/topics/HTTPPage'));
const HTTPSPage = lazy(() => import('./pages/topics/HTTPSPage'));
const SSHPage = lazy(() => import('./pages/topics/SSHPage'));
const FirewallsPage = lazy(() => import('./pages/topics/FirewallsPage'));
const LoadBalancingPage = lazy(() => import('./pages/topics/LoadBalancingPage'));
const VPCPage = lazy(() => import('./pages/topics/VPCPage'));
const DockerNetworkingPage = lazy(() => import('./pages/topics/DockerNetworkingPage'));
const KubernetesNetworkingPage = lazy(() => import('./pages/topics/KubernetesNetworkingPage'));

// Lazy-loaded Tool Pages
const SubnetCalculatorPage = lazy(() => import('./pages/tools/SubnetCalculatorPage'));
const PacketPlaygroundPage = lazy(() => import('./pages/tools/PacketPlaygroundPage'));
const CheatsheetPage = lazy(() => import('./pages/tools/CheatsheetPage'));
const InterviewPrepPage = lazy(() => import('./pages/tools/InterviewPrepPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />

            {/* Fundamentals */}
            <Route path="/topic/osi-model"     element={<OSIModelPage />} />
            <Route path="/topic/tcpip-model"   element={<TCPIPModelPage />} />

            {/* Data Link */}
            <Route path="/topic/ethernet"    element={<EthernetPage />} />
            <Route path="/topic/mac-address" element={<MACAddressPage />} />
            <Route path="/topic/arp"         element={<ARPPage />} />

            {/* Network Layer */}
            <Route path="/topic/ip-addressing" element={<SubnettingPage />} />
            <Route path="/topic/subnetting"    element={<Navigate to="/topic/ip-addressing" replace />} />
            <Route path="/topic/routing"       element={<RoutingPage />} />
            <Route path="/topic/nat"           element={<NATPATPage />} />

            {/* Transport Layer */}
            <Route path="/topic/tcp"  element={<TCPPage />} />
            <Route path="/topic/udp"  element={<UDPPage />} />
            <Route path="/topic/icmp" element={<ICMPPage />} />

            {/* Application Layer */}
            <Route path="/topic/dns"   element={<DNSPage />} />
            <Route path="/topic/dhcp"  element={<DHCPPage />} />
            <Route path="/topic/http"  element={<HTTPPage />} />
            <Route path="/topic/https" element={<HTTPSPage />} />
            <Route path="/topic/ssh"   element={<SSHPage />} />

            {/* Infrastructure */}
            <Route path="/topic/firewalls"      element={<FirewallsPage />} />
            <Route path="/topic/load-balancing" element={<LoadBalancingPage />} />

            {/* Cloud & Container */}
            <Route path="/topic/vpc"                   element={<VPCPage />} />
            <Route path="/topic/docker-networking"     element={<DockerNetworkingPage />} />
            <Route path="/topic/kubernetes-networking" element={<KubernetesNetworkingPage />} />

            {/* Standalone Tools & Practice */}
            <Route path="/tools/subnet font" element={<Navigate to="/tools/subnet" replace />} />
            <Route path="/tools/subnet font" element={<Navigate to="/tools/subnet" replace />} />
            <Route path="/tools/subnet"      element={<SubnetCalculatorPage />} />
            <Route path="/tools/packets"     element={<PacketPlaygroundPage />} />
            <Route path="/tools/cheatsheet"  element={<CheatsheetPage />} />
            <Route path="/tools/interview"   element={<InterviewPrepPage />} />

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
