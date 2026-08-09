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

// Advanced & SRE Pages
const ServiceMeshPage = lazy(() => import('./pages/topics/ServiceMeshPage'));
const EBPFPage = lazy(() => import('./pages/topics/EBPFPage'));
const VPNPage = lazy(() => import('./pages/topics/VPNPage'));
const KernelTuningPage = lazy(() => import('./pages/topics/KernelTuningPage'));

// Lazy-loaded Tool Pages
const SubnetCalculatorPage = lazy(() => import('./pages/tools/SubnetCalculatorPage'));
const PacketJourneyPage = lazy(() => import('./pages/tools/PacketJourneyPage'));
const DNSResolverPage = lazy(() => import('./pages/tools/DNSResolverPage'));
const HTTPSandboxPage = lazy(() => import('./pages/tools/HTTPSandboxPage'));
const PacketPlaygroundPage = lazy(() => import('./pages/tools/PacketPlaygroundPage'));
const ExamModePage = lazy(() => import('./pages/tools/ExamModePage'));
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

            {/* Advanced & SRE */}
            <Route path="/topic/service-mesh"  element={<ServiceMeshPage />} />
            <Route path="/topic/ebpf"          element={<EBPFPage />} />
            <Route path="/topic/vpn-tunnels"   element={<VPNPage />} />
            <Route path="/topic/kernel-tuning" element={<KernelTuningPage />} />

            {/* Standalone Tools & Practice */}
            <Route path="/tools/subnet"        element={<SubnetCalculatorPage />} />
            <Route path="/tools/packet-journey"element={<PacketJourneyPage />} />
            <Route path="/tools/dns-resolver"  element={<DNSResolverPage />} />
            <Route path="/tools/http-sandbox"element={<HTTPSandboxPage />} />
            <Route path="/tools/packets"     element={<PacketPlaygroundPage />} />
            <Route path="/tools/exam"        element={<ExamModePage />} />
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
