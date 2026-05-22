"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("supplymind_token");
    if (token) {
      router.push("/");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem("supplymind_token", data.token);
      localStorage.setItem("supplymind_username", data.username);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-zinc-950 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>⚡</span> SupplyMind
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Autonomous Supply Chain Disruption Monitor
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Glowing border card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent sm:text-sm"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent sm:text-sm"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg p-3 text-center">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-zinc-950 bg-gradient-to-r from-cyan-400 to-purple-400 hover:from-cyan-300 hover:to-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-150 ease-in-out disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-zinc-800/80 pt-6">
              <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                <span className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Demo Credentials</span>
                <div className="flex gap-4 text-sm">
                  <div className="text-zinc-400">
                    User: <code className="text-cyan-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">admin</code>
                  </div>
                  <div className="text-zinc-400">
                    Pass: <code className="text-purple-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">admin123</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
