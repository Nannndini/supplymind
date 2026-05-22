"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Supplier { _id: string; name: string; location: string; category: string; status: string; risk_score: number; }
interface Inventory { _id: string; item_name: string; supplier_name: string; quantity: number; unit: string; days_remaining: number; reorder_threshold: number; }
interface Alert { _id: string; supplier_name: string; risk_level: string; reason: string; resolved: boolean; gemini_analysis?: string; action_plan?: string; }
interface Contract { _id: string; supplier_name: string; contract_id: string; effective_date: string; expiration_date: string; contract_text: string; }

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
    // Highlight exact matches or search queries
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-500/40 text-yellow-100 border-b border-yellow-500 px-0.5 rounded">{part}</mark> : part
    );
  };

  if (!authenticated) {
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center font-sans">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">⚡ SupplyMind</h1>
            <p className="text-gray-400 mt-1">
              AI Disruption Monitor · Welcome back, <span className="text-cyan-400 font-semibold">{username}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={runPipeline} disabled={running}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg font-semibold transition">
              {running ? "Running..." : "▶ Run Pipeline"}
            </button>
            <button onClick={handleLogout}
              className="border border-zinc-800 hover:bg-zinc-900 text-zinc-300 px-4 py-2 rounded-lg font-semibold transition">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Suppliers</p>
            <p className="text-3xl font-bold mt-1 text-cyan-400">{suppliers.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Inventory Items</p>
            <p className="text-3xl font-bold mt-1 text-purple-400">{inventory.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Active Alerts</p>
            <p className="text-3xl font-bold mt-1 text-orange-400">{alerts.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Contracts Tracked</p>
            <p className="text-3xl font-bold mt-1 text-pink-400">{contracts.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Suppliers */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">🏭 Suppliers {isSearching && <span className="text-xs font-normal text-blue-400">(Filtered)</span>}</h2>
              {isSearching && (
                <button onClick={clearSearch} className="text-xs text-gray-400 hover:text-white underline">
                  Clear search
                </button>
              )}
            </div>
            
            {/* Semantic Search Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Semantic search (e.g. packaging in Mumbai)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition whitespace-nowrap"
              >
                🔍 Search
              </button>
            </div>

            <div className="space-y-3">
              {suppliers.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">No suppliers found.</p>
              ) : (
                suppliers.map(s => (
                  <div key={s._id} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center border border-zinc-800/80">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-gray-400 text-sm">{s.location} · {s.category}</p>
                    </div>
                    <span className="bg-green-600/20 text-green-400 border border-green-500/30 text-xs px-2.5 py-1 rounded-full">{s.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">📦 Inventory</h2>
            <div className="space-y-3">
              {inventory.map(i => (
                <div key={i._id} className="bg-gray-800 rounded-lg p-3 border border-zinc-800/80">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{i.item_name}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${i.days_remaining <= 5 ? "bg-red-600/20 text-red-400 border-red-500/30" : "bg-green-600/20 text-green-400 border-green-500/30"}`}>
                      {i.days_remaining}d left
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{i.quantity} {i.unit} · from {i.supplier_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Simulate Alert */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold mb-4">🧪 Simulate Disruption</h2>
          <div className="flex gap-3">
            <select value={simSupplier} onChange={e => setSimSupplier(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex-1 text-white">
              <option value="">Select supplier</option>
              {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
            </select>
            <input value={simReason} onChange={e => setSimReason(e.target.value)}
              placeholder="e.g. Flood warning in Mumbai"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex-2 w-full text-white placeholder-gray-500" />
            <button onClick={simulateAlert} disabled={running}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-5 py-2 rounded-lg font-semibold whitespace-nowrap transition">
              Simulate
            </button>
          </div>
        </div>

        {/* Supplier Contracts section */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">📄 Supplier Contracts & Clause Analysis</h2>
              <p className="text-xs text-gray-400 mt-0.5">Gemini-powered semantic search across Force Majeure and Penalty clauses</p>
            </div>
            {isContractSearching && (
              <button onClick={clearContractSearch} className="text-xs text-gray-400 hover:text-white underline">
                Clear search
              </button>
            )}
          </div>

          {/* Contracts Search Bar */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Query contract clauses (e.g. force majeure, late delivery penalty, lead time)..."
              value={contractSearchQuery}
              onChange={e => setContractSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleContractSearch(); }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:border-pink-500 text-white placeholder-gray-500"
            />
            <button
              onClick={handleContractSearch}
              className="bg-pink-600 hover:bg-pink-700 px-5 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
            >
              🔍 Analyze Clauses
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {contracts.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center col-span-3">No contracts found.</p>
            ) : (
              contracts.map(c => (
                <div key={c._id} className="bg-gray-800 rounded-xl p-4 border border-zinc-700/80 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-zinc-900 text-pink-400 border border-pink-500/20 text-xs px-2.5 py-0.5 rounded-md font-mono">
                        {c.contract_id}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {c.effective_date} to {c.expiration_date}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base mb-3 text-white">Supplier: {c.supplier_name}</h3>
                    <div className="bg-gray-950/80 rounded-lg p-3 text-xs text-zinc-300 leading-relaxed border border-zinc-900 max-h-48 overflow-y-auto font-mono">
                      {highlightText(c.contract_text, contractSearchQuery)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">🚨 Alerts & AI Analysis</h2>
          {alerts.length === 0 ? (
            <p className="text-gray-400">No alerts yet. Run the pipeline or simulate a disruption.</p>
          ) : (
            <div className="space-y-4">
              {alerts.map(a => (
                <div key={a._id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full text-white ${riskColor(a.risk_level)}`}>{a.risk_level}</span>
                    <p className="font-semibold">{a.supplier_name}</p>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{a.reason}</p>
                  {a.gemini_analysis && (
                    <div className="bg-gray-900 rounded p-3 text-sm text-green-400 whitespace-pre-wrap mb-2 border border-green-500/10 font-mono">
                      {a.gemini_analysis}
                    </div>
                  )}
                  {a.action_plan && (
                    <div className="bg-gray-900 rounded p-3 text-sm text-blue-400 whitespace-pre-wrap border border-blue-500/10 font-mono">
                      {a.action_plan}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}