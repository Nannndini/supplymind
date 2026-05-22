"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Supplier { _id: string; name: string; location: string; category: string; status: string; risk_score: number; }
interface Inventory { _id: string; item_name: string; supplier_name: string; quantity: number; unit: string; days_remaining: number; reorder_threshold: number; }
interface Alert { _id: string; supplier_name: string; risk_level: string; reason: string; resolved: boolean; gemini_analysis?: string; action_plan?: string; }
interface Contract { _id: string; supplier_name: string; contract_id: string; effective_date: string; expiration_date: string; contract_text: string; }

function Card3D({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [shadow, setShadow] = useState("none");
  const [glintStyle, setGlintStyle] = useState<React.CSSProperties>({
    opacity: 0,
    transform: "translate(-50%, -50%)",
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((centerY - y) / centerY) * 4; // Max 4 degrees tilt
    const rotateY = ((x - centerX) / centerX) * 4; // Max 4 degrees tilt
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`);
    setShadow(`${(x - centerX) / 4}px ${(y - centerY) / 4}px 25px rgba(6, 182, 212, 0.08)`);
    setGlintStyle({
      opacity: 1,
      left: `${x}px`,
      top: `${y}px`,
    });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setShadow("none");
    setGlintStyle(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        boxShadow: shadow,
        transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
        willChange: "transform, box-shadow",
        transformStyle: "preserve-3d",
        ...style
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Dynamic light reflection glint */}
      <div
        className="absolute w-[200px] h-[200px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-300"
        style={{
          ...glintStyle,
          transform: "translate(-50%, -50%)",
        }}
      />
      {children}
    </div>
  );
}

function TelemetryMap({ suppliers, alerts }: { suppliers: Supplier[]; alerts: Alert[] }) {
  const hasAlert = (supplierName: string) => {
    return alerts.some(a => a.supplier_name.toLowerCase() === supplierName.toLowerCase() && !a.resolved);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between">
      <div className="relative h-64 w-full flex items-center justify-center bg-zinc-950/80 rounded-2xl border border-zinc-900/60 overflow-hidden shadow-inner">
        {/* Isometric Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        
        {/* Connection flow lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 280">
          {/* Connection Lines with Dash Flow */}
          <path d="M 200 130 L 80 70" fill="none" stroke={hasAlert("RajPlastics") ? "rgba(244, 63, 94, 0.4)" : "rgba(6, 182, 212, 0.3)"} strokeWidth="1.5" />
          <path d="M 200 130 L 80 70" fill="none" stroke={hasAlert("RajPlastics") ? "#f43f5e" : "#06b6d4"} strokeWidth="2" strokeDasharray="5, 8" className="animate-dash-flow" />

          <path d="M 200 130 L 320 70" fill="none" stroke={hasAlert("ChennaiPolymers") ? "rgba(244, 63, 94, 0.4)" : "rgba(6, 182, 212, 0.3)"} strokeWidth="1.5" />
          <path d="M 200 130 L 320 70" fill="none" stroke={hasAlert("ChennaiPolymers") ? "#f43f5e" : "#06b6d4"} strokeWidth="2" strokeDasharray="5, 8" className="animate-dash-flow-fast" />

          <path d="M 200 130 L 200 220" fill="none" stroke={hasAlert("HydroLabels") ? "rgba(244, 63, 94, 0.4)" : "rgba(6, 182, 212, 0.3)"} strokeWidth="1.5" />
          <path d="M 200 130 L 200 220" fill="none" stroke={hasAlert("HydroLabels") ? "#f43f5e" : "#06b6d4"} strokeWidth="2" strokeDasharray="5, 8" className="animate-dash-flow" />

          {/* Central Hub Core */}
          <circle cx="200" cy="130" r="14" fill="#09090b" stroke="#06b6d4" strokeWidth="2.5" />
          <circle cx="200" cy="130" r="22" fill="none" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.4" className="animate-ping-slow" />
          <circle cx="200" cy="130" r="6" fill="#06b6d4" className="animate-pulse" />

          {/* Supplier Nodes */}
          {/* RajPlastics */}
          <circle cx="80" cy="70" r="8" fill="#09090b" stroke={hasAlert("RajPlastics") ? "#f43f5e" : "#10b981"} strokeWidth="2" />
          <circle cx="80" cy="70" r="14" fill="none" stroke={hasAlert("RajPlastics") ? "#f43f5e" : "#10b981"} strokeWidth="1" strokeOpacity="0.4" className="animate-ping-slow animate-origin-raj" />
          <circle cx="80" cy="70" r="3" fill={hasAlert("RajPlastics") ? "#f43f5e" : "#10b981"} />

          {/* ChennaiPolymers */}
          <circle cx="320" cy="70" r="8" fill="#09090b" stroke={hasAlert("ChennaiPolymers") ? "#f43f5e" : "#10b981"} strokeWidth="2" />
          <circle cx="320" cy="70" r="14" fill="none" stroke={hasAlert("ChennaiPolymers") ? "#f43f5e" : "#10b981"} strokeWidth="1" strokeOpacity="0.4" className="animate-ping-slow animate-origin-chennai" />
          <circle cx="320" cy="70" r="3" fill={hasAlert("ChennaiPolymers") ? "#f43f5e" : "#10b981"} />

          {/* HydroLabels */}
          <circle cx="200" cy="220" r="8" fill="#09090b" stroke={hasAlert("HydroLabels") ? "#f43f5e" : "#10b981"} strokeWidth="2" />
          <circle cx="200" cy="220" r="14" fill="none" stroke={hasAlert("HydroLabels") ? "#f43f5e" : "#10b981"} strokeWidth="1" strokeOpacity="0.4" className="animate-ping-slow animate-origin-hydro" />
          <circle cx="200" cy="220" r="3" fill={hasAlert("HydroLabels") ? "#f43f5e" : "#10b981"} />
        </svg>

        {/* CSS Animations injected for dashes & pings */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes dash-animation {
            to {
              stroke-dashoffset: -40;
            }
          }
          @keyframes ping-slow {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          .animate-dash-flow {
            animation: dash-animation 2s linear infinite;
          }
          .animate-dash-flow-fast {
            animation: dash-animation 1.2s linear infinite;
          }
          .animate-ping-slow {
            animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          .animate-origin-raj {
            transform-origin: 80px 70px;
          }
          .animate-origin-chennai {
            transform-origin: 320px 70px;
          }
          .animate-origin-hydro {
            transform-origin: 200px 220px;
          }
        `}} />

        {/* Hover-revealed overlay badges */}
        <div className="absolute top-2 left-2 text-[9px] uppercase tracking-wider text-zinc-500 bg-zinc-900/60 border border-zinc-800/80 px-2 py-0.5 rounded">
          Supply Chain Nodes Map
        </div>
        
        {/* Floating Labels over Nodes */}
        <div className="absolute" style={{ left: "12%", top: "15%" }}>
          <p className="text-[10px] font-bold text-white leading-none">RajPlastics</p>
          <p className="text-[8px] text-zinc-500 leading-none mt-0.5">Mumbai</p>
        </div>

        <div className="absolute" style={{ right: "12%", top: "15%" }}>
          <p className="text-[10px] font-bold text-white leading-none text-right">ChennaiPolymers</p>
          <p className="text-[8px] text-zinc-500 text-right leading-none mt-0.5">Chennai</p>
        </div>

        <div className="absolute" style={{ left: "calc(50% - 25px)", top: "calc(78% + 14px)" }}>
          <p className="text-[10px] font-bold text-white leading-none text-center">HydroLabels</p>
          <p className="text-[8px] text-zinc-500 text-center leading-none mt-0.5">Hyderabad</p>
        </div>

        <div className="absolute" style={{ left: "calc(50% - 25px)", top: "calc(46% - 22px)" }}>
          <p className="text-[9px] font-extrabold text-cyan-400 leading-none text-center tracking-wider">AI CORE</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [running, setRunning] = useState(false);
  const [simSupplier, setSimSupplier] = useState("");
  const [simReason, setSimReason] = useState("");
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const [contractSearchQuery, setContractSearchQuery] = useState("");
  const [isContractSearching, setIsContractSearching] = useState(false);
  
  // Auth states
  const [username, setUsername] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      fetch_data();
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`${API}/semantic-search?query=${encodeURIComponent(searchQuery)}`, {
        method: "POST"
      });
      const data = await response.json();
      setSuppliers(data);
    } catch (e) {
      console.error("Error performing semantic search:", e);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    fetch_data();
  };

  const handleContractSearch = async () => {
    if (!contractSearchQuery.trim()) {
      setIsContractSearching(false);
      fetchContracts();
      return;
    }
    setIsContractSearching(true);
    try {
      const response = await fetch(`${API}/contracts/search?query=${encodeURIComponent(contractSearchQuery)}`, {
        method: "POST"
      });
      const data = await response.json();
      setContracts(data);
    } catch (e) {
      console.error("Error searching contracts:", e);
    }
  };

  const clearContractSearch = () => {
    setContractSearchQuery("");
    setIsContractSearching(false);
    fetchContracts();
  };

  const fetch_data = async () => {
    try {
      const [s, i, a] = await Promise.all([
        fetch(`${API}/suppliers`).then(r => r.json()).catch(() => []),
        fetch(`${API}/inventory`).then(r => r.json()).catch(() => []),
        fetch(`${API}/alerts`).then(r => r.json()).catch(() => []),
      ]);
      setSuppliers(s); setInventory(i); setAlerts(a);
    } catch (e) {
      console.error("Error fetching data from API backend:", e);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await fetch(`${API}/contracts`);
      const data = await response.json();
      setContracts(data);
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("supplymind_token");
    const user = localStorage.getItem("supplymind_username") || "Admin";
    if (!token) {
      router.push("/login");
    } else {
      setAuthenticated(true);
      setUsername(user);
      fetch_data();
      fetchContracts();
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("supplymind_token");
    localStorage.removeItem("supplymind_username");
    router.push("/login");
  };

  const runPipeline = async () => {
    setRunning(true);
    try {
      await fetch(`${API}/run-pipeline`, { method: "POST" });
      await fetch_data();
    } catch (e) {
      console.error("Error running pipeline:", e);
    }
    setRunning(false);
  };

  const simulateAlert = async () => {
    if (!simSupplier || !simReason) return;
    setRunning(true);
    try {
      await fetch(`${API}/simulate-alert?supplier_name=${simSupplier}&reason=${encodeURIComponent(simReason)}`, { method: "POST" });
      await fetch_data();
    } catch (e) {
      console.error("Error simulating alert:", e);
    }
    setRunning(false);
  };

  const riskColor = (level: string) => level === "CRITICAL" ? "bg-red-600" : level === "HIGH" ? "bg-orange-500" : level === "MEDIUM" ? "bg-yellow-500" : "bg-green-500";

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-cyan-500/20 text-cyan-200 border-b border-cyan-400 px-0.5 rounded font-bold">{part}</mark> : part
    );
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#040407] text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Verifying Connection...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#040407] text-zinc-100 p-6 relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background radial glowing spotlights */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[700px] h-[700px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Digital Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f13_1px,transparent_1px),linear-gradient(to_bottom,#0f0f13_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_80%,transparent_100%)] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-900/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl shadow-cyan-950/10">
                <span className="text-2xl text-cyan-400 select-none">⚡</span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                  SupplyMind
                  <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Agent Core v1.2
                  </span>
                </h1>
                <p className="text-zinc-500 text-xs mt-0.5">
                  AI-Powered Risk Analysis & Supplier Disruption Monitor · Welcome, <span className="text-cyan-400 font-bold">{username}</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={runPipeline}
              disabled={running}
              className="bg-white hover:bg-zinc-200 text-zinc-950 disabled:opacity-50 px-5 py-3 rounded-xl font-bold text-xs transition duration-200 shadow-xl shadow-white/5 flex items-center gap-2 cursor-pointer active:scale-98"
            >
              {running ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full" />
                  Syncing Agents...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Execute Monitoring Pipeline
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 px-4 py-3 rounded-xl font-bold text-xs transition duration-200 cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card3D className="bg-zinc-900/30 backdrop-blur-xl rounded-2xl p-5 border border-zinc-900 shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Monitored Suppliers</p>
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white">{suppliers.length}</p>
              <div className="w-full bg-zinc-950/60 rounded-full h-1 mt-4 border border-zinc-900">
                <div className="bg-cyan-500 h-full rounded-full w-[80%] shadow-lg shadow-cyan-500/50" />
              </div>
            </div>
          </Card3D>
          
          <Card3D className="bg-zinc-900/30 backdrop-blur-xl rounded-2xl p-5 border border-zinc-900 shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Inventory SKUs</p>
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white">{inventory.length}</p>
              <div className="w-full bg-zinc-950/60 rounded-full h-1 mt-4 border border-zinc-900">
                <div className="bg-indigo-500 h-full rounded-full w-[65%] shadow-lg shadow-indigo-500/50" />
              </div>
            </div>
          </Card3D>
          
          <Card3D className="bg-zinc-900/30 backdrop-blur-xl rounded-2xl p-5 border border-zinc-900 shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Threat Alerts</p>
              <span className={`p-1.5 rounded-lg transition-colors duration-300 ${alerts.length > 0 ? "bg-amber-500/20 text-amber-400" : "bg-zinc-850 text-zinc-650"}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white">{alerts.length}</p>
              <div className="w-full bg-zinc-950/60 rounded-full h-1 mt-4 border border-zinc-900">
                <div className={`h-full rounded-full transition-all duration-300 ${alerts.length > 0 ? "bg-amber-500 w-[45%] shadow-lg shadow-amber-500/50" : "bg-zinc-800 w-0"}`} />
              </div>
            </div>
          </Card3D>
          
          <Card3D className="bg-zinc-900/30 backdrop-blur-xl rounded-2xl p-5 border border-zinc-900 shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Legal Agreements</p>
              <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white">{contracts.length}</p>
              <div className="w-full bg-zinc-950/60 rounded-full h-1 mt-4 border border-zinc-900">
                <div className="bg-pink-500 h-full rounded-full w-full shadow-lg shadow-pink-500/50" />
              </div>
            </div>
          </Card3D>
        </div>

        {/* Live Map & Suppliers/Inventory Group */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Telemetry Map - Takes 1 column */}
          <Card3D className="lg:col-span-1 bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 border border-zinc-900 shadow-xl flex flex-col justify-between h-full min-h-[380px]">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                Telemetry Channel Map
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">
                Visualizing active supply line node channels, alert pathways, and data flows.
              </p>
            </div>
            
            <TelemetryMap suppliers={suppliers} alerts={alerts} />
          </Card3D>

          {/* Supplier Directory - Takes 1 column */}
          <Card3D className="lg:col-span-1 bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 border border-zinc-900 shadow-xl flex flex-col h-full min-h-[380px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                🏭 Suppliers Directory
                {isSearching && (
                  <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/20">
                    Filtered
                  </span>
                )}
              </h2>
              {isSearching && (
                <button onClick={clearSearch} className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer">
                  Reset
                </button>
              )}
            </div>
            
            {/* Semantic Search */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1 group/input">
                <input
                  type="text"
                  placeholder="Semantic search (e.g. packaging Mumbai)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                  className="w-full bg-zinc-950/80 border border-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30 text-white placeholder-zinc-700 transition-all font-mono"
                />
                <div className="absolute inset-0 rounded-xl border border-transparent group-hover/input:border-zinc-800/80 pointer-events-none transition-colors duration-300" />
              </div>
              <button
                onClick={handleSearch}
                className="bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/30 text-cyan-400 px-3 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scan
              </button>
            </div>

            {/* Suppliers List */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[250px] pr-1">
              {suppliers.length === 0 ? (
                <p className="text-zinc-600 text-xs py-8 text-center font-mono">No supply lines discovered.</p>
              ) : (
                suppliers.map(s => (
                  <div key={s._id} className="bg-zinc-950/30 hover:bg-zinc-950/80 border border-zinc-900/60 rounded-xl p-3 flex justify-between items-center transition-all duration-300 hover:border-zinc-800">
                    <div>
                      <p className="font-bold text-xs text-white">{s.name}</p>
                      <p className="text-zinc-500 text-[10px] mt-0.5">{s.location} · <span className="text-zinc-400 font-mono text-[9px]">{s.category}</span></p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded">
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card3D>

          {/* Stock Inventory - Takes 1 column */}
          <Card3D className="lg:col-span-1 bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 border border-zinc-900 shadow-xl flex flex-col h-full min-h-[380px]">
            <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              📦 Inventory Reserves & Buffer
            </h2>
            
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {inventory.map(i => {
                const percent = Math.min(100, Math.max(10, (i.days_remaining / 14) * 100));
                const isLow = i.days_remaining <= 5;
                return (
                  <div key={i._id} className="bg-zinc-950/30 border border-zinc-900/60 rounded-xl p-3.5 space-y-2 hover:border-zinc-800 transition-colors duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-xs text-white">{i.item_name}</p>
                        <p className="text-zinc-500 text-[10px] mt-0.5">
                          {i.quantity.toLocaleString()} {i.unit} · sourced from <span className="text-cyan-400 font-medium">{i.supplier_name}</span>
                        </p>
                      </div>
                      <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded border tracking-wider uppercase ${isLow ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                        {i.days_remaining}d Reserve
                      </span>
                    </div>
                    
                    {/* Progress Bar Widget */}
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-900">
                      <div 
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full transition-all duration-700 ${isLow ? "bg-gradient-to-r from-rose-500 to-red-500 shadow-md shadow-red-500/50" : "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/50"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card3D>
        </div>

        {/* Simulate Disruption Control Panel */}
        <Card3D className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 border border-zinc-900 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            🧪 Crisis Simulation Center
          </h2>
          <p className="text-zinc-500 text-xs mb-4">
            Manually trigger local disruptions to test agent reaction capabilities and telemetry channel response.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative group/select">
              <select
                value={simSupplier}
                onChange={e => setSimSupplier(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-800 font-mono appearance-none cursor-pointer"
              >
                <option value="">Choose Targeted Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                ▼
              </div>
            </div>
            
            <div className="relative group/input">
              <input
                value={simReason}
                onChange={e => setSimReason(e.target.value)}
                placeholder="e.g. Flood warnings / Strikes / Power failures"
                className="w-full bg-zinc-950/80 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-800 font-mono"
              />
              <div className="absolute inset-0 rounded-xl border border-transparent group-hover/input:border-zinc-800/80 pointer-events-none transition-colors duration-300" />
            </div>

            <button
              onClick={simulateAlert}
              disabled={running || !simSupplier || !simReason}
              className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white disabled:opacity-50 px-5 py-2.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer shadow-lg shadow-rose-950/20 flex items-center justify-center gap-1.5 active:scale-98"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Inject Simulation Event
            </button>
          </div>
        </Card3D>

        {/* Supplier Contracts & Clause Analysis */}
        <Card3D className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 border border-zinc-900 shadow-xl">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              📄 Agreement & Clause Vector Scan
            </h2>
            {isContractSearching && (
              <button onClick={clearContractSearch} className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer">
                Reset Search
              </button>
            )}
          </div>
          <p className="text-zinc-500 text-xs mb-4">
            Gemini vector search analyzes legal agreements for Force Majeure, Late Penalties, and Liability offsets.
          </p>

          {/* Search Bar */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1 group/input">
              <input
                type="text"
                placeholder="Query clauses (e.g. force majeure late penalty cap, delivery delays, SLA conditions)..."
                value={contractSearchQuery}
                onChange={e => setContractSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleContractSearch(); }}
                className="w-full bg-zinc-950/80 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/30 transition-all font-mono"
              />
              <div className="absolute inset-0 rounded-xl border border-transparent group-hover/input:border-zinc-800/80 pointer-events-none transition-colors duration-300" />
            </div>
            <button
              onClick={handleContractSearch}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-pink-500/30 text-pink-400 px-5 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analyze SLA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contracts.length === 0 ? (
              <p className="text-zinc-600 text-xs py-8 text-center col-span-3 font-mono">No contract documents uploaded.</p>
            ) : (
              contracts.map(c => (
                <div 
                  key={c._id} 
                  className="bg-zinc-950/40 border border-zinc-900/60 rounded-2xl p-5 hover:border-pink-500/20 hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-0.5 group/card"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="bg-zinc-900/80 text-pink-400 border border-pink-500/15 text-[9px] px-2 py-0.5 rounded font-mono">
                        {c.contract_id}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {c.effective_date} / {c.expiration_date}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs text-white mb-2.5">Supplier: {c.supplier_name}</h3>
                    <div className="bg-zinc-950/90 border border-zinc-900/60 rounded-xl p-3.5 text-[10px] text-zinc-400 leading-relaxed font-mono max-h-48 overflow-y-auto shadow-inner relative z-10 scrollbar-thin">
                      {highlightText(c.contract_text, contractSearchQuery)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card3D>

        {/* Threat Alerts Logs */}
        <Card3D className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 border border-zinc-900 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            🚨 Threat Alerts & Agent Execution Logs
          </h2>
          
          {alerts.length === 0 ? (
            <p className="text-zinc-600 text-xs py-10 text-center bg-zinc-950/10 border border-zinc-900/40 rounded-2xl font-mono">
              No current disruptions detected. Pipeline running in standby.
            </p>
          ) : (
            <div className="space-y-4">
              {alerts.map(a => (
                <div key={a._id} className="bg-zinc-950/40 border border-zinc-900/60 rounded-2xl p-5 relative overflow-hidden group/alert hover:border-zinc-800 transition-colors duration-300">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/80" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-zinc-900">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[9px] uppercase font-extrabold tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                        {a.risk_level} THREAT
                      </span>
                      <p className="font-bold text-xs text-white">Target Supplier: {a.supplier_name}</p>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      Telemetry Trigger Active
                    </span>
                  </div>
                  
                  <div className="space-y-3.5 text-[11px]">
                    <div>
                      <p className="text-zinc-500 font-bold mb-1 uppercase tracking-widest text-[9px]">Disruption Details</p>
                      <p className="text-zinc-300 font-mono">{a.reason}</p>
                    </div>
                    
                    {a.gemini_analysis && (
                      <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 space-y-1.5">
                        <p className="text-cyan-400 font-extrabold uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          Risk Analyst Agent Output
                        </p>
                        <div className="text-zinc-400 whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
                          {a.gemini_analysis}
                        </div>
                      </div>
                    )}
                    
                    {a.action_plan && (
                      <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 space-y-1.5">
                        <p className="text-indigo-400 font-extrabold uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                          Action Agent Output & Mitigation SLA
                        </p>
                        <div className="text-zinc-400 whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
                          {a.action_plan}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card3D>
      </div>
    </main>
  );
}