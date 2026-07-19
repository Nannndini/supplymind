"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Supplier { _id: string; name: string; location: string; category: string; status: string; risk_score: number; }
interface Inventory { _id: string; item_name: string; supplier_name: string; quantity: number; unit: string; days_remaining: number; reorder_threshold: number; }
interface Alert { _id: string; supplier_name: string; risk_level: string; reason: string; resolved: boolean; risk_analysis?: string; action_plan?: string; }
interface Contract { _id: string; supplier_name: string; contract_id: string; effective_date: string; expiration_date: string; contract_text: string; }

function Card({ children, className = "", style = {}, id }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; id?: string }) {
  return (
    <div
      id={id}
      style={style}
      className={`bg-[#12131A]/80 border border-[#1F202E] rounded-xl p-8 hover:border-zinc-800/80 transition-all duration-200 ${className}`}
    >
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
      <div className="relative h-80 w-full flex items-center justify-center bg-[#0D0E14] border border-[#1F202E] rounded-xl overflow-hidden">
        {/* Isometric Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1f2030_1px,transparent_1px)] [background-size:20px_20px] opacity-35" />
        
        {/* Connection flow lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 280">
          {/* Connection Lines with Dash Flow */}
          <path d="M 400 140 L 150 90" fill="none" stroke={hasAlert("RajPlastics") ? "rgba(239, 68, 68, 0.2)" : "rgba(94, 106, 210, 0.15)"} strokeWidth="1.5" />
          <path d="M 400 140 L 150 90" fill="none" stroke={hasAlert("RajPlastics") ? "#EF4444" : "#5E6AD2"} strokeWidth="2" strokeDasharray="5, 8" className="animate-dash-flow" />

          <path d="M 400 140 L 650 90" fill="none" stroke={hasAlert("ChennaiPolymers") ? "rgba(239, 68, 68, 0.2)" : "rgba(94, 106, 210, 0.15)"} strokeWidth="1.5" />
          <path d="M 400 140 L 650 90" fill="none" stroke={hasAlert("ChennaiPolymers") ? "#EF4444" : "#5E6AD2"} strokeWidth="2" strokeDasharray="5, 8" className="animate-dash-flow-fast" />

          <path d="M 400 140 L 400 220" fill="none" stroke={hasAlert("HydroLabels") ? "rgba(239, 68, 68, 0.2)" : "rgba(94, 106, 210, 0.15)"} strokeWidth="1.5" />
          <path d="M 400 140 L 400 220" fill="none" stroke={hasAlert("HydroLabels") ? "#EF4444" : "#5E6AD2"} strokeWidth="2" strokeDasharray="5, 8" className="animate-dash-flow" />

          {/* Threat Node Pulsing Rings (Subtle Pulse on Active Threat Nodes Only) */}
          {hasAlert("RajPlastics") && (
            <>
              <circle cx="150" cy="90" r="14" fill="none" stroke="#EF4444" strokeWidth="1.2" className="animate-pulse-opacity" />
              <circle cx="150" cy="90" r="20" fill="none" stroke="#EF4444" strokeWidth="0.6" className="animate-pulse-opacity-delayed" />
            </>
          )}
          {hasAlert("ChennaiPolymers") && (
            <>
              <circle cx="650" cy="90" r="14" fill="none" stroke="#EF4444" strokeWidth="1.2" className="animate-pulse-opacity" />
              <circle cx="650" cy="90" r="20" fill="none" stroke="#EF4444" strokeWidth="0.6" className="animate-pulse-opacity-delayed" />
            </>
          )}
          {hasAlert("HydroLabels") && (
            <>
              <circle cx="400" cy="220" r="14" fill="none" stroke="#EF4444" strokeWidth="1.2" className="animate-pulse-opacity" />
              <circle cx="400" cy="220" r="20" fill="none" stroke="#EF4444" strokeWidth="0.6" className="animate-pulse-opacity-delayed" />
            </>
          )}

          {/* Central Hub Core */}
          <circle cx="400" cy="140" r="8" fill="#12131A" stroke="#5E6AD2" strokeWidth="2" />
          <circle cx="400" cy="140" r="3.5" fill="#5E6AD2" />

          {/* Supplier Nodes */}
          {/* RajPlastics */}
          <circle cx="150" cy="90" r="5" fill="#12131A" stroke={hasAlert("RajPlastics") ? "#EF4444" : "#10B981"} strokeWidth="2" />
          <circle cx="150" cy="90" r="2" fill={hasAlert("RajPlastics") ? "#EF4444" : "#10B981"} />

          {/* ChennaiPolymers */}
          <circle cx="650" cy="90" r="5" fill="#12131A" stroke={hasAlert("ChennaiPolymers") ? "#EF4444" : "#10B981"} strokeWidth="2" />
          <circle cx="650" cy="90" r="2" fill={hasAlert("ChennaiPolymers") ? "#EF4444" : "#10B981"} />

          {/* HydroLabels */}
          <circle cx="400" cy="220" r="5" fill="#12131A" stroke={hasAlert("HydroLabels") ? "#EF4444" : "#10B981"} strokeWidth="2" />
          <circle cx="400" cy="220" r="2" fill={hasAlert("HydroLabels") ? "#EF4444" : "#10B981"} />

          {/* SVG Text Labels */}
          {/* Central core label */}
          <text x="400" y="115" textAnchor="middle" className="text-[10px] font-bold fill-zinc-400 font-mono tracking-widest uppercase">AI CORE</text>

          {/* RajPlastics */}
          <text x="150" y="65" textAnchor="middle" className="text-[10px] font-bold fill-zinc-100 tracking-tight">RajPlastics</text>
          <text x="150" y="53" textAnchor="middle" className="text-[8px] font-bold fill-zinc-500 font-mono tracking-widest">MUMBAI</text>

          {/* ChennaiPolymers */}
          <text x="650" y="65" textAnchor="middle" className="text-[10px] font-bold fill-zinc-100 tracking-tight">ChennaiPolymers</text>
          <text x="650" y="53" textAnchor="middle" className="text-[8px] font-bold fill-zinc-500 font-mono tracking-widest">CHENNAI</text>

          {/* HydroLabels */}
          <text x="400" y="248" textAnchor="middle" className="text-[10px] font-bold fill-zinc-100 tracking-tight">HydroLabels</text>
          <text x="400" y="260" textAnchor="middle" className="text-[8px] font-bold fill-zinc-500 font-mono tracking-widest">HYDERABAD</text>
        </svg>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes dash-animation {
            to {
              stroke-dashoffset: -40;
            }
          }
          .animate-dash-flow {
            animation: dash-animation 2s linear infinite;
          }
          .animate-dash-flow-fast {
            animation: dash-animation 1.2s linear infinite;
          }
          @keyframes pulse-opacity {
            0% { opacity: 0.1; }
            50% { opacity: 0.8; }
            100% { opacity: 0.1; }
          }
          @keyframes pulse-opacity-delayed {
            0% { opacity: 0.6; }
            50% { opacity: 0.1; }
            100% { opacity: 0.6; }
          }
          .animate-pulse-opacity {
            animation: pulse-opacity 2s ease-in-out infinite;
          }
          .animate-pulse-opacity-delayed {
            animation: pulse-opacity-delayed 2s ease-in-out infinite;
          }
        `}} />

        <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 bg-[#12131A] border border-[#1F202E] px-3 py-1 rounded shadow-sm font-mono">
          System Node Topology
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

  // Live updates states
  const [lastUpdated, setLastUpdated] = useState("Never updated");
  const [prevAlertsCount, setPrevAlertsCount] = useState(0);
  const [shouldFlashAlerts, setShouldFlashAlerts] = useState(false);

  const authenticatedFetch = async (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("supplymind_token");
    if (!token) {
      router.push("/login");
      throw new Error("No token found");
    }
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
    const response = await fetch(`${API}${path}`, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("supplymind_token");
      localStorage.removeItem("supplymind_username");
      router.push("/login");
      throw new Error("Session expired or unauthorized");
    }
    return response;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      fetch_data();
      return;
    }
    setIsSearching(true);
    try {
      const response = await authenticatedFetch(`/semantic-search?query=${encodeURIComponent(searchQuery)}`, {
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
      const response = await authenticatedFetch(`/contracts/search?query=${encodeURIComponent(contractSearchQuery)}`, {
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

  const updateTimestamp = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastUpdated(`Sync: ${timeStr}`);
  };

  const fetch_data = async () => {
    try {
      const [s, i, a] = await Promise.all([
        authenticatedFetch(`/suppliers`).then(r => r.json()).catch(() => []),
        authenticatedFetch(`/inventory`).then(r => r.json()).catch(() => []),
        authenticatedFetch(`/alerts`).then(r => r.json()).catch(() => []),
      ]);
      setSuppliers(s); setInventory(i); setAlerts(a);
      updateTimestamp();
    } catch (e) {
      console.error("Error fetching data from API backend:", e);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await authenticatedFetch(`/contracts`);
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

  // Flash alerts card on count increase (Live Reaction)
  useEffect(() => {
    if (alerts.length > prevAlertsCount) {
      setShouldFlashAlerts(true);
      const timer = setTimeout(() => setShouldFlashAlerts(false), 2000);
      return () => clearTimeout(timer);
    }
    setPrevAlertsCount(alerts.length);
  }, [alerts, prevAlertsCount]);

  const handleLogout = () => {
    localStorage.removeItem("supplymind_token");
    localStorage.removeItem("supplymind_username");
    router.push("/login");
  };

  const runPipeline = async () => {
    setRunning(true);
    try {
      await authenticatedFetch(`/run-pipeline`, { method: "POST" });
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
      await authenticatedFetch(`/simulate-alert?supplier_name=${simSupplier}&reason=${encodeURIComponent(simReason)}`, { method: "POST" });
      await fetch_data();
    } catch (e) {
      console.error("Error simulating alert:", e);
    }
    setRunning(false);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-indigo-950/80 text-indigo-300 border-b border-indigo-500 px-0.5 rounded font-semibold">{part}</mark> : part
    );
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0D0E14] text-zinc-300 flex items-center justify-center font-sans relative">
        {/* Background Dot Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1f2030_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="flex flex-col items-center gap-3 relative z-10">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-[#5E6AD2] border-t-transparent rounded-full" />
          <p className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest font-mono">Verifying Connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0E14] text-zinc-300 font-sans antialiased selection:bg-[#5E6AD2]/25 selection:text-white relative">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f2030_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Top Navigation Bar */}
      <nav className="w-full bg-[#0D0E14]/80 backdrop-blur-md border-b border-[#1F202E] sticky top-0 z-50 px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#12131A] border border-[#1F202E]">
              <span className="text-sm text-[#5E6AD2] select-none font-black">⚡</span>
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">SupplyMind</span>
            <span className="bg-[#1C1D2A] text-[#5E6AD2] border border-[#2A2B3E] text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              Core v1.2
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[11px] text-zinc-400 font-semibold tracking-wide">
            <a href="#telemetry" className="text-white hover:text-white transition-colors">Telemetry</a>
            <a href="#directory" className="hover:text-white transition-colors">Suppliers</a>
            <a href="#reserves" className="hover:text-white transition-colors">Reserves</a>
            <a href="#simulation" className="hover:text-white transition-colors">Simulation</a>
            <a href="#contracts" className="hover:text-white transition-colors">Contracts</a>
            <a href="#alerts" className="hover:text-white transition-colors">Alerts</a>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider bg-[#12131A] px-2.5 py-1 rounded border border-[#1F202E]">
              user: {username}
            </span>
            <button
              onClick={handleLogout}
              className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Grid Content */}
      <main className="max-w-6xl mx-auto px-8 py-16 space-y-24 relative z-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-[#1F202E] pb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              SLA Dashboard
            </h1>
            <p className="text-zinc-500 text-xs mt-1.5 font-medium">
              Real-time monitoring network, active mitigation workflows, and agent execution parameters.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={runPipeline}
              disabled={running}
              className="bg-[#5E6AD2] hover:bg-[#4E5AC2] text-white disabled:opacity-50 px-6 py-3 rounded-xl font-bold text-xs transition duration-200 shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
            >
              {running ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sync System
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="flex flex-col justify-between">
            <div>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest font-mono">Monitored Suppliers</p>
              <p className="text-6xl font-extrabold text-white tracking-tight leading-none mt-3">{suppliers.length}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#1F202E]/60 pt-3">
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider">{lastUpdated}</span>
              <span className="text-[9px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Online</span>
            </div>
          </Card>
          
          <Card className="flex flex-col justify-between">
            <div>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest font-mono">Inventory SKUs</p>
              <p className="text-6xl font-extrabold text-white tracking-tight leading-none mt-3">{inventory.length}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#1F202E]/60 pt-3">
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider">{lastUpdated}</span>
              <span className="text-[9px] text-[#5E6AD2] bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Loaded</span>
            </div>
          </Card>
          
          <Card className={`flex flex-col justify-between transition-all duration-500 ${shouldFlashAlerts ? "bg-[#251A25] border-[#D25E6A] ring-4 ring-[#D25E6A]/10 shadow-md" : ""}`}>
            <div>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest font-mono">Threat Alerts</p>
              <p className="text-6xl font-extrabold text-white tracking-tight leading-none mt-3">{alerts.length}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#1F202E]/60 pt-3">
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider">{lastUpdated}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border ${alerts.length > 0 ? "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse" : "bg-zinc-800/40 border-zinc-700/50 text-zinc-500"}`}>
                {alerts.length > 0 ? "Threats Detected" : "Standby"}
              </span>
            </div>
          </Card>
          
          <Card className="flex flex-col justify-between">
            <div>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest font-mono">Legal Agreements</p>
              <p className="text-6xl font-extrabold text-white tracking-tight leading-none mt-3">{contracts.length}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#1F202E]/60 pt-3">
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider">Direct Sync</span>
              <span className="text-[9px] text-zinc-400 bg-zinc-800/40 border border-zinc-700/50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Scan Active</span>
            </div>
          </Card>
        </div>

        {/* 1. Hero Telemetry Map */}
        <Card id="telemetry" className="flex flex-col justify-between w-full min-h-[440px]">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#5E6AD2] animate-pulse" />
                Telemetry Channel Map
              </h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Live flow network mapping data stream triggers, node connectivity, and agent telemetry.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono tracking-wider">Nodes Stable</span>
            </div>
          </div>
          
          <div className="flex-1 min-h-[320px]">
            <TelemetryMap suppliers={suppliers} alerts={alerts} />
          </div>
        </Card>

        {/* Suppliers & Inventory side-by-side (Row-Based Lists) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Supplier Directory (Row-based list) */}
          <Card id="directory" className="flex flex-col h-full min-h-[420px] p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                🏭 Suppliers Directory
                {isSearching && (
                  <span className="bg-indigo-950/40 text-indigo-300 text-[9px] font-bold px-2.5 py-0.5 rounded border border-indigo-900/40 font-mono">
                    Filtered
                  </span>
                )}
              </h2>
              {isSearching && (
                <button onClick={clearSearch} className="text-[10px] text-zinc-500 hover:text-white underline cursor-pointer font-semibold">
                  Reset
                </button>
              )}
            </div>
            
            {/* Semantic Search */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Semantic search (e.g. packaging Mumbai)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                className="w-full bg-[#0D0E14] border border-[#1F202E] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#5E6AD2] focus:ring-2 focus:ring-[#5E6AD2]/10 text-white placeholder-zinc-650 transition-all font-mono"
              />
              <button
                onClick={handleSearch}
                className="bg-[#12131A] hover:bg-[#161722] border border-[#1F202E] hover:border-zinc-700 text-[#5E6AD2] px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scan
              </button>
            </div>

            {/* Suppliers List - Clean Linear Row Layout */}
            <div className="flex-1 overflow-y-auto max-h-[260px] pr-1 space-y-px">
              {suppliers.length === 0 ? (
                <p className="text-zinc-500 text-xs py-8 text-center font-mono bg-[#12131A]/20 border border-[#1F202E] rounded-xl">No supply lines discovered.</p>
              ) : (
                <div className="divide-y divide-[#1F202E] border border-[#1F202E] rounded-xl overflow-hidden bg-[#12131A]/40">
                  {suppliers.map(s => (
                    <div key={s._id} className="flex justify-between items-center py-3.5 px-5 hover:bg-[#161722]/60 transition-colors duration-150">
                      <div className="flex items-center gap-3">
                        {/* 24px Avatar Icon */}
                        <div className="w-6 h-6 rounded-full bg-[#1C1D2A] border border-[#2D2E42] flex items-center justify-center text-[10px] font-bold text-zinc-300 uppercase select-none">
                          {s.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-white">{s.name}</p>
                          <p className="text-zinc-500 text-[10px] mt-0.5">{s.location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-semibold text-zinc-400 font-mono tracking-wider uppercase bg-[#181926] border border-[#2B2C43] px-2.5 py-0.5 rounded">
                          {s.category}
                        </span>
                        
                        {/* Linear tag style pill */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                            {s.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Stock Inventory Reserves (Row-based list with circular progress rings) */}
          <Card id="reserves" className="flex flex-col h-full min-h-[420px] p-8">
            <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-6 font-mono">
              📦 Inventory Reserves & Buffer
            </h2>
            
            <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 space-y-px">
              {inventory.length === 0 ? (
                <p className="text-zinc-500 text-xs py-8 text-center font-mono bg-[#12131A]/20 border border-[#1F202E] rounded-xl">No inventory loaded.</p>
              ) : (
                <div className="divide-y divide-[#1F202E] border border-[#1F202E] rounded-xl overflow-hidden bg-[#12131A]/40">
                  {inventory.map(i => {
                    const percent = Math.min(100, Math.max(10, (i.days_remaining / 14) * 100));
                    const isLow = i.days_remaining <= 5;
                    
                    return (
                      <div key={i._id} className="flex justify-between items-center py-3.5 px-5 hover:bg-[#161722]/60 transition-colors duration-150">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#1C1D2A] border border-[#2D2E42] flex items-center justify-center text-[10px] font-bold text-zinc-300 uppercase select-none">
                            📦
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-white">{i.item_name}</p>
                            <p className="text-zinc-500 text-[10px] mt-0.5">
                              {i.quantity.toLocaleString()} {i.unit} · sourced from <span className="text-[#5E6AD2] font-semibold">{i.supplier_name}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-5">
                          {/* Circular progress ring icon */}
                          <div className="relative w-5 h-5 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="transparent" />
                              <circle 
                                cx="10" 
                                cy="10" 
                                r="8" 
                                stroke={isLow ? "#EF4444" : "#5E6AD2"} 
                                strokeWidth="2" 
                                fill="transparent" 
                                strokeDasharray="50" 
                                strokeDashoffset={50 - (50 * percent) / 100}
                                className="transition-all duration-700"
                              />
                            </svg>
                            <span className="absolute text-[6px] font-mono text-zinc-400">{i.days_remaining}d</span>
                          </div>
                          
                          {/* Status Pill */}
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isLow ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-zinc-800/40 border-zinc-700/50 text-zinc-450"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLow ? "bg-red-400" : "bg-zinc-550"}`} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">
                              {isLow ? "LOW STOCK" : "STABLE"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Simulate Disruption Panel */}
        <Card id="simulation" className="bg-[#12131A]/80 border border-[#1F202E] rounded-xl p-8 shadow-sm">
          <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">
            🧪 Crisis Simulation Center
          </h2>
          <p className="text-zinc-500 text-xs mb-6 font-medium">
            Manually trigger local disruptions to test agent reaction capabilities and telemetry channel response.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <select
                value={simSupplier}
                onChange={e => setSimSupplier(e.target.value)}
                className="w-full bg-[#0D0E14] border border-[#1F202E] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#5E6AD2] focus:ring-2 focus:ring-[#5E6AD2]/10 font-sans appearance-none cursor-pointer"
              >
                <option value="" className="text-zinc-600">Choose Targeted Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s.name} className="text-white bg-[#0D0E14]">{s.name}</option>)}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500 text-[10px]">
                ▼
              </div>
            </div>
            
            <div>
              <input
                value={simReason}
                onChange={e => setSimReason(e.target.value)}
                placeholder="e.g. Flood warnings / Strikes / Power failures"
                className="w-full bg-[#0D0E14] border border-[#1F202E] rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5E6AD2] focus:ring-2 focus:ring-[#5E6AD2]/10 font-sans"
              />
            </div>

            <button
              onClick={simulateAlert}
              disabled={running || !simSupplier || !simReason}
              className="bg-[#5E6AD2] hover:bg-[#4E5AC2] text-white disabled:opacity-50 px-5 py-3 rounded-xl font-bold text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
            >
              Inject Simulation Event
            </button>
          </div>
        </Card>

        {/* Agreement vector scan */}
        <Card id="contracts" className="bg-[#12131A]/80 border border-[#1F202E] rounded-xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
              📄 Agreement & Clause Vector Scan
            </h2>
            {isContractSearching && (
              <button onClick={clearContractSearch} className="text-[10px] text-zinc-500 hover:text-white underline cursor-pointer font-medium">
                Reset Search
              </button>
            )}
          </div>
          <p className="text-zinc-500 text-xs mb-6 font-medium">
            Gemini vector search analyzes legal agreements for Force Majeure, Late Penalties, and Liability offsets.
          </p>

          {/* Search Bar */}
          <div className="flex gap-3 mb-8">
            <input
              type="text"
              placeholder="Query clauses (e.g. force majeure late penalty cap, delivery delays, SLA conditions)..."
              value={contractSearchQuery}
              onChange={e => setContractSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleContractSearch(); }}
              className="flex-1 bg-[#0D0E14] border border-[#1F202E] rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5E6AD2] focus:ring-2 focus:ring-[#5E6AD2]/10 transition-all font-sans"
            />
            <button
              onClick={handleContractSearch}
              className="bg-[#5E6AD2] hover:bg-[#4E5AC2] text-white px-5 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 shadow-sm"
            >
              Analyze SLA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contracts.length === 0 ? (
              <p className="text-zinc-500 text-xs py-8 text-center col-span-3 font-mono bg-[#12131A]/20 border border-[#1F202E] rounded-xl">
                {isContractSearching ? "No matching contract clauses found for this query." : "No contract documents uploaded."}
              </p>
            ) : (
              contracts.map(c => (
                <div 
                  key={c._id} 
                  className="bg-[#12131A] border border-[#1F202E] rounded-xl p-6 hover:border-zinc-800 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="bg-[#1C1D2A] text-zinc-300 border border-[#2D2E42] text-[10px] px-2 py-0.5 rounded font-mono">
                        {c.contract_id}
                      </span>
                      <span className="text-[10px] text-zinc-550 font-mono">
                        {c.effective_date} / {c.expiration_date}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs text-white mb-3">Supplier: {c.supplier_name}</h3>
                    <div className="bg-[#0D0E14] border border-[#1F202E] rounded-xl p-4 text-[11px] text-zinc-400 leading-relaxed font-mono max-h-48 overflow-y-auto scrollbar-thin">
                      {highlightText(c.contract_text, contractSearchQuery)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Threat Alerts row logs */}
        <Card id="alerts" className="bg-[#12131A]/80 border border-[#1F202E] rounded-xl p-8 shadow-sm">
          <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-6 font-mono">
            🚨 Threat Alerts & Agent Execution Logs
          </h2>
          
          {alerts.length === 0 ? (
            <p className="text-zinc-500 text-xs py-10 text-center bg-[#12131A]/20 border border-[#1F202E] rounded-xl font-mono">
              No current disruptions detected. Pipeline running in standby.
            </p>
          ) : (
            <div className="divide-y divide-[#1F202E] border border-[#1F202E] rounded-xl overflow-hidden bg-[#12131A]/40">
              {alerts.map(a => (
                <div key={a._id} className="p-6 hover:bg-[#161722]/30 transition-colors duration-150 relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1F202E]/60">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-350">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          {a.risk_level} THREAT
                        </span>
                      </div>
                      <p className="font-semibold text-xs text-white">Target Supplier: {a.supplier_name}</p>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Telemetry Trigger Active
                    </span>
                  </div>
                  
                  <div className="space-y-4 text-[11px] leading-relaxed text-zinc-400">
                    <div>
                      <p className="text-zinc-500 font-bold mb-1 uppercase tracking-wider text-[9px] font-mono">Disruption Details</p>
                      <p className="text-zinc-300 font-mono">{a.reason}</p>
                    </div>
                    
                    {a.risk_analysis && (
                      <div className="bg-[#161722]/50 border border-[#1F202E] rounded-xl p-4 space-y-2">
                        <p className="text-[#5E6AD2] font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2]" />
                          Risk Analyst Agent Output
                        </p>
                        <div className="text-zinc-400 whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
                          {a.risk_analysis}
                        </div>
                      </div>
                    )}
                    
                    {a.action_plan && (
                      <div className="bg-[#161722]/50 border border-[#1F202E] rounded-xl p-4 space-y-2">
                        <p className="text-zinc-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
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
        </Card>
      </main>
    </div>
  );
}