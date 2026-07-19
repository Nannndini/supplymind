"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Supplier { _id: string; name: string; location: string; category: string; status: string; risk_score: number; }
interface Inventory { _id: string; item_name: string; supplier_name: string; quantity: number; unit: string; days_remaining: number; reorder_threshold: number; }
interface Alert { _id: string; supplier_name: string; risk_level: string; reason: string; resolved: boolean; risk_analysis?: string; action_plan?: string; }
interface Contract { _id: string; supplier_name: string; contract_id: string; effective_date: string; expiration_date: string; contract_text: string; }

function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={`bg-white border border-zinc-200/80 rounded-2xl p-8 hover:shadow-sm hover:border-zinc-300/80 transition-all duration-200 ${className}`}
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
      <div className="relative h-80 w-full flex items-center justify-center bg-zinc-50 border border-zinc-200/80 rounded-2xl overflow-hidden shadow-inner">
        {/* Isometric Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
        
        {/* Connection flow lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 280">
          {/* Connection Lines with Dash Flow */}
          <path d="M 400 140 L 150 90" fill="none" stroke={hasAlert("RajPlastics") ? "rgba(239, 68, 68, 0.2)" : "rgba(79, 70, 229, 0.15)"} strokeWidth="1.5" />
          <path d="M 400 140 L 150 90" fill="none" stroke={hasAlert("RajPlastics") ? "#EF4444" : "#4F46E5"} strokeWidth="2" strokeDasharray="5, 8" className="animate-dash-flow" />

          <path d="M 400 140 L 650 90" fill="none" stroke={hasAlert("ChennaiPolymers") ? "rgba(239, 68, 68, 0.2)" : "rgba(79, 70, 229, 0.15)"} strokeWidth="1.5" />
          <path d="M 400 140 L 650 90" fill="none" stroke={hasAlert("ChennaiPolymers") ? "#EF4444" : "#4F46E5"} strokeWidth="2" strokeDasharray="5, 8" className="animate-dash-flow-fast" />

          <path d="M 400 140 L 400 220" fill="none" stroke={hasAlert("HydroLabels") ? "rgba(239, 68, 68, 0.2)" : "rgba(79, 70, 229, 0.15)"} strokeWidth="1.5" />
          <path d="M 400 140 L 400 220" fill="none" stroke={hasAlert("HydroLabels") ? "#EF4444" : "#4F46E5"} strokeWidth="2" strokeDasharray="5, 8" className="animate-dash-flow" />

          {/* Threat Node Pulsing Rings (Our Distinctive Signature Detail) */}
          {hasAlert("RajPlastics") && (
            <>
              <circle cx="150" cy="90" r="14" fill="none" stroke="#EF4444" strokeWidth="1.5" className="animate-pulse-opacity" />
              <circle cx="150" cy="90" r="22" fill="none" stroke="#EF4444" strokeWidth="0.8" className="animate-pulse-opacity-delayed" />
            </>
          )}
          {hasAlert("ChennaiPolymers") && (
            <>
              <circle cx="650" cy="90" r="14" fill="none" stroke="#EF4444" strokeWidth="1.5" className="animate-pulse-opacity" />
              <circle cx="650" cy="90" r="22" fill="none" stroke="#EF4444" strokeWidth="0.8" className="animate-pulse-opacity-delayed" />
            </>
          )}
          {hasAlert("HydroLabels") && (
            <>
              <circle cx="400" cy="220" r="14" fill="none" stroke="#EF4444" strokeWidth="1.5" className="animate-pulse-opacity" />
              <circle cx="400" cy="220" r="22" fill="none" stroke="#EF4444" strokeWidth="0.8" className="animate-pulse-opacity-delayed" />
            </>
          )}

          {/* Central Hub Core */}
          <circle cx="400" cy="140" r="10" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
          <circle cx="400" cy="140" r="5" fill="#4F46E5" />

          {/* Supplier Nodes */}
          {/* RajPlastics */}
          <circle cx="150" cy="90" r="7" fill="#FFFFFF" stroke={hasAlert("RajPlastics") ? "#EF4444" : "#10B981"} strokeWidth="2" />
          <circle cx="150" cy="90" r="3.5" fill={hasAlert("RajPlastics") ? "#EF4444" : "#10B981"} />

          {/* ChennaiPolymers */}
          <circle cx="650" cy="90" r="7" fill="#FFFFFF" stroke={hasAlert("ChennaiPolymers") ? "#EF4444" : "#10B981"} strokeWidth="2" />
          <circle cx="650" cy="90" r="3.5" fill={hasAlert("ChennaiPolymers") ? "#EF4444" : "#10B981"} />

          {/* HydroLabels */}
          <circle cx="400" cy="220" r="7" fill="#FFFFFF" stroke={hasAlert("HydroLabels") ? "#EF4444" : "#10B981"} strokeWidth="2" />
          <circle cx="400" cy="220" r="3.5" fill={hasAlert("HydroLabels") ? "#EF4444" : "#10B981"} />

          {/* SVGLabels */}
          {/* Central AI core status label */}
          <text x="400" y="115" textAnchor="middle" className="text-[10px] font-bold fill-indigo-650 tracking-widest font-mono">AI CORE</text>

          {/* RajPlastics */}
          <text x="150" y="65" textAnchor="middle" className="text-[10px] font-bold fill-zinc-900 tracking-tight">RajPlastics</text>
          <text x="150" y="53" textAnchor="middle" className="text-[8px] font-bold fill-zinc-400 font-mono tracking-widest">MUMBAI</text>

          {/* ChennaiPolymers */}
          <text x="650" y="65" textAnchor="middle" className="text-[10px] font-bold fill-zinc-900 tracking-tight">ChennaiPolymers</text>
          <text x="650" y="53" textAnchor="middle" className="text-[8px] font-bold fill-zinc-400 font-mono tracking-widest">CHENNAI</text>

          {/* HydroLabels */}
          <text x="400" y="248" textAnchor="middle" className="text-[10px] font-bold fill-zinc-900 tracking-tight">HydroLabels</text>
          <text x="400" y="260" textAnchor="middle" className="text-[8px] font-bold fill-zinc-400 font-mono tracking-widest">HYDERABAD</text>
        </svg>

        {/* CSS Animations injected for dashes & threat rings */}
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

        {/* Hover-revealed overlay badges */}
        <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 bg-white border border-zinc-200 px-3 py-1 rounded-md shadow-sm">
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
      regex.test(part) ? <mark key={i} className="bg-indigo-100 text-indigo-800 border-b border-indigo-400 px-0.5 rounded font-bold">{part}</mark> : part
    );
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Verifying Connection...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-zinc-900 px-8 py-16 font-sans antialiased selection:bg-indigo-500/10 selection:text-indigo-900">
      <div className="max-w-6xl mx-auto space-y-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-zinc-200/80 pb-10">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-zinc-200/85 shadow-sm hover:border-zinc-300 transition-all duration-300">
              <span className="text-3xl select-none">⚡</span>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 flex items-center gap-3">
                SupplyMind
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest font-mono">
                  Agent Core v1.2
                </span>
              </h1>
              <p className="text-zinc-400 text-xs mt-1.5 font-medium">
                AI-Powered Risk Analysis & Supplier Disruption Monitor · Welcome, <span className="text-indigo-600 font-bold">{username}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={runPipeline}
              disabled={running}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-50 px-6 py-3.5 rounded-xl font-bold text-xs transition duration-200 shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
            >
              {running ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Syncing Agents...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Execute Pipeline
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-650 px-6 py-3.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer flex items-center gap-2 active:scale-98 shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">Monitored Suppliers</p>
              <span className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
            </div>
            <div className="mt-6">
              <p className="text-6xl font-extrabold text-zinc-900 tracking-tight leading-none">{suppliers.length}</p>
              <p className="text-[10px] text-zinc-400 font-mono tracking-wider mt-4">{lastUpdated}</p>
            </div>
          </Card>
          
          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">Inventory SKUs</p>
              <span className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
            </div>
            <div className="mt-6">
              <p className="text-6xl font-extrabold text-zinc-900 tracking-tight leading-none">{inventory.length}</p>
              <p className="text-[10px] text-zinc-400 font-mono tracking-wider mt-4">{lastUpdated}</p>
            </div>
          </Card>
          
          <Card className={`flex flex-col justify-between transition-all duration-500 ${shouldFlashAlerts ? "bg-amber-50 border-amber-300 ring-4 ring-amber-500/10 shadow-md" : ""}`}>
            <div className="flex justify-between items-start">
              <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">Threat Alerts</p>
              <span className={`p-2 rounded-xl border transition-colors duration-300 ${alerts.length > 0 ? "bg-amber-100 border-amber-200 text-amber-700 font-bold" : "bg-zinc-50 border-zinc-200 text-zinc-450"}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            </div>
            <div className="mt-6">
              <p className="text-6xl font-extrabold text-zinc-900 tracking-tight leading-none">{alerts.length}</p>
              <p className="text-[10px] text-zinc-400 font-mono tracking-wider mt-4">{lastUpdated}</p>
            </div>
          </Card>
          
          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">Legal Agreements</p>
              <span className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
            </div>
            <div className="mt-6">
              <p className="text-6xl font-extrabold text-zinc-900 tracking-tight leading-none">{contracts.length}</p>
              <p className="text-[10px] text-zinc-400 font-mono tracking-wider mt-4">Direct Sync</p>
            </div>
          </Card>
        </div>

        {/* 1. Telemetry Map promoted to Hero - Spans full width */}
        <Card className="flex flex-col justify-between w-full min-h-[440px]">
          <div className="mb-6">
            <h2 className="text-[11px] font-bold text-zinc-450 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Telemetry Channel Map
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Autonomous node channels, active local threat routes, and telemetry data flow visualizations.
            </p>
          </div>
          
          <div className="flex-1 min-h-[320px]">
            <TelemetryMap suppliers={suppliers} alerts={alerts} />
          </div>
        </Card>

        {/* Suppliers Directory & Stock Inventory side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Supplier Directory */}
          <Card className="flex flex-col h-full min-h-[420px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[11px] font-bold text-zinc-450 uppercase tracking-widest flex items-center gap-2">
                🏭 Suppliers Directory
                {isSearching && (
                  <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-150 font-mono">
                    Filtered
                  </span>
                )}
              </h2>
              {isSearching && (
                <button onClick={clearSearch} className="text-[10px] text-zinc-450 hover:text-zinc-700 underline cursor-pointer font-medium">
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
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-indigo-500/10 text-zinc-900 placeholder-zinc-350 transition-all font-mono"
              />
              <button
                onClick={handleSearch}
                className="bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-indigo-600 px-4 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scan
              </button>
            </div>

            {/* Suppliers List */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px] pr-1">
              {suppliers.length === 0 ? (
                <p className="text-zinc-450 text-xs py-8 text-center font-mono">No supply lines discovered.</p>
              ) : (
                suppliers.map(s => (
                  <div key={s._id} className="bg-white border border-zinc-200/80 rounded-xl p-4 flex justify-between items-center transition-all duration-200 hover:border-zinc-300">
                    <div>
                      <p className="font-bold text-xs text-zinc-900">{s.name}</p>
                      <p className="text-zinc-400 text-[10px] mt-1">{s.location} · <span className="text-zinc-500 font-mono text-[9px]">{s.category}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded">
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Stock Inventory */}
          <Card className="flex flex-col h-full min-h-[420px]">
            <h2 className="text-[11px] font-bold text-zinc-450 uppercase tracking-widest mb-6">
              📦 Inventory Reserves & Buffer
            </h2>
            
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[320px] pr-1">
              {inventory.map(i => {
                const percent = Math.min(100, Math.max(10, (i.days_remaining / 14) * 100));
                const isLow = i.days_remaining <= 5;
                return (
                  <div key={i._id} className="bg-white border border-zinc-200/80 rounded-xl p-4 space-y-3 hover:border-zinc-300 transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-xs text-zinc-900">{i.item_name}</p>
                        <p className="text-zinc-400 text-[10px] mt-1">
                          {i.quantity.toLocaleString()} {i.unit} · sourced from <span className="text-indigo-600 font-medium">{i.supplier_name}</span>
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase ${isLow ? "bg-red-50 text-red-700 border-red-155" : "bg-zinc-50 text-zinc-650 border-zinc-200"}`}>
                        {i.days_remaining}d Reserve
                      </span>
                    </div>
                    
                    {/* Progress Bar Widget */}
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full transition-all duration-700 ${isLow ? "bg-red-500" : "bg-zinc-900"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Simulate Disruption Control Panel */}
        <Card className="bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-sm">
          <h2 className="text-[11px] font-bold text-zinc-450 uppercase tracking-widest mb-1">
            🧪 Crisis Simulation Center
          </h2>
          <p className="text-zinc-400 text-xs mb-6 font-medium">
            Manually trigger local disruptions to test agent reaction capabilities and telemetry channel response.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <select
                value={simSupplier}
                onChange={e => setSimSupplier(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-indigo-500/10 font-sans appearance-none cursor-pointer"
              >
                <option value="">Choose Targeted Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400 text-[10px]">
                ▼
              </div>
            </div>
            
            <div>
              <input
                value={simReason}
                onChange={e => setSimReason(e.target.value)}
                placeholder="e.g. Flood warnings / Strikes / Power failures"
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-indigo-500/10 font-sans"
              />
            </div>

            <button
              onClick={simulateAlert}
              disabled={running || !simSupplier || !simReason}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-50 px-5 py-3.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
            >
              Inject Simulation Event
            </button>
          </div>
        </Card>

        {/* Supplier Contracts & Clause Analysis */}
        <Card className="bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-[11px] font-bold text-zinc-450 uppercase tracking-widest">
              📄 Agreement & Clause Vector Scan
            </h2>
            {isContractSearching && (
              <button onClick={clearContractSearch} className="text-[10px] text-zinc-450 hover:text-zinc-700 underline cursor-pointer font-medium">
                Reset Search
              </button>
            )}
          </div>
          <p className="text-zinc-400 text-xs mb-6 font-medium">
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
              className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 placeholder-zinc-350 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-indigo-500/10 transition-all font-sans"
            />
            <button
              onClick={handleContractSearch}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-3.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 shadow-sm"
            >
              Analyze SLA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contracts.length === 0 ? (
              <p className="text-zinc-450 text-xs py-8 text-center col-span-3 font-mono">
                {isContractSearching ? "No matching contract clauses found for this query." : "No contract documents uploaded."}
              </p>
            ) : (
              contracts.map(c => (
                <div 
                  key={c._id} 
                  className="bg-white border border-zinc-200/80 rounded-2xl p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] px-2 py-0.5 rounded font-mono">
                        {c.contract_id}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {c.effective_date} / {c.expiration_date}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs text-zinc-900 mb-3">Supplier: {c.supplier_name}</h3>
                    <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-[11px] text-zinc-500 leading-relaxed font-mono max-h-48 overflow-y-auto scrollbar-thin">
                      {highlightText(c.contract_text, contractSearchQuery)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Threat Alerts Logs */}
        <Card className="bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-sm">
          <h2 className="text-[11px] font-bold text-zinc-450 uppercase tracking-widest mb-6">
            🚨 Threat Alerts & Agent Execution Logs
          </h2>
          
          {alerts.length === 0 ? (
            <p className="text-zinc-400 text-xs py-10 text-center bg-zinc-50 border border-zinc-150 rounded-2xl font-mono">
              No current disruptions detected. Pipeline running in standby.
            </p>
          ) : (
            <div className="space-y-6">
              {alerts.map(a => (
                <div key={a._id} className="bg-white border border-zinc-200/80 rounded-2xl p-6 relative overflow-hidden group/alert hover:border-zinc-300 transition-all duration-200">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                        {a.risk_level} THREAT
                      </span>
                      <p className="font-bold text-xs text-zinc-900">Target Supplier: {a.supplier_name}</p>
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Telemetry Trigger Active
                    </span>
                  </div>
                  
                  <div className="space-y-4 text-[11px] leading-relaxed text-zinc-650">
                    <div>
                      <p className="text-zinc-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Disruption Details</p>
                      <p className="text-zinc-700 font-mono">{a.reason}</p>
                    </div>
                    
                    {a.risk_analysis && (
                      <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-2">
                        <p className="text-indigo-650 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Risk Analyst Agent Output
                        </p>
                        <div className="text-zinc-600 whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
                          {a.risk_analysis}
                        </div>
                      </div>
                    )}
                    
                    {a.action_plan && (
                      <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-2">
                        <p className="text-zinc-700 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-550" />
                          Action Agent Output & Mitigation SLA
                        </p>
                        <div className="text-zinc-600 whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
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
      </div>
    </main>
  );
}