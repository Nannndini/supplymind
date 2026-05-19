"use client";
import { useEffect, useState } from "react";

const API = "http://localhost:8000";

interface Supplier { _id: string; name: string; location: string; category: string; status: string; risk_score: number; }
interface Inventory { _id: string; item_name: string; supplier_name: string; quantity: number; unit: string; days_remaining: number; reorder_threshold: number; }
interface Alert { _id: string; supplier_name: string; risk_level: string; reason: string; resolved: boolean; gemini_analysis?: string; action_plan?: string; }

export default function Home() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [running, setRunning] = useState(false);
  const [simSupplier, setSimSupplier] = useState("");
  const [simReason, setSimReason] = useState("");

  const fetch_data = async () => {
    const [s, i, a] = await Promise.all([
      fetch(`${API}/suppliers`).then(r => r.json()),
      fetch(`${API}/inventory`).then(r => r.json()),
      fetch(`${API}/alerts`).then(r => r.json()),
    ]);
    setSuppliers(s); setInventory(i); setAlerts(a);
  };

  useEffect(() => { fetch_data(); }, []);

  const runPipeline = async () => {
    setRunning(true);
    await fetch(`${API}/run-pipeline`, { method: "POST" });
    await fetch_data();
    setRunning(false);
  };

  const simulateAlert = async () => {
    if (!simSupplier || !simReason) return;
    setRunning(true);
    await fetch(`${API}/simulate-alert?supplier_name=${simSupplier}&reason=${encodeURIComponent(simReason)}`, { method: "POST" });
    await fetch_data();
    setRunning(false);
  };

  const riskColor = (level: string) => level === "CRITICAL" ? "bg-red-600" : level === "HIGH" ? "bg-orange-500" : level === "MEDIUM" ? "bg-yellow-500" : "bg-green-500";

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">⚡ SupplyMind</h1>
            <p className="text-gray-400 mt-1">AI-powered supply chain disruption monitor</p>
          </div>
          <button onClick={runPipeline} disabled={running}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg font-semibold transition">
            {running ? "Running..." : "▶ Run Pipeline"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Suppliers</p>
            <p className="text-3xl font-bold mt-1">{suppliers.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Inventory Items</p>
            <p className="text-3xl font-bold mt-1">{inventory.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Active Alerts</p>
            <p className="text-3xl font-bold mt-1 text-orange-400">{alerts.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Suppliers */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">🏭 Suppliers</h2>
            <div className="space-y-3">
              {suppliers.map(s => (
                <div key={s._id} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-gray-400 text-sm">{s.location} · {s.category}</p>
                  </div>
                  <span className="bg-green-600 text-xs px-2 py-1 rounded-full">{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">📦 Inventory</h2>
            <div className="space-y-3">
              {inventory.map(i => (
                <div key={i._id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{i.item_name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${i.days_remaining <= 5 ? "bg-red-600" : "bg-green-600"}`}>
                      {i.days_remaining}d left
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{i.quantity} {i.unit} · from {i.supplier_name}</p>
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
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex-1">
              <option value="">Select supplier</option>
              {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
            </select>
            <input value={simReason} onChange={e => setSimReason(e.target.value)}
              placeholder="e.g. Flood warning in Mumbai"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex-2 w-full" />
            <button onClick={simulateAlert} disabled={running}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold whitespace-nowrap">
              Simulate
            </button>
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
                    <div className="bg-gray-900 rounded p-3 text-sm text-green-400 whitespace-pre-wrap mb-2">
                      {a.gemini_analysis}
                    </div>
                  )}
                  {a.action_plan && (
                    <div className="bg-gray-900 rounded p-3 text-sm text-blue-400 whitespace-pre-wrap">
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