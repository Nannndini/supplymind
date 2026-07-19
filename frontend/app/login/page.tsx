"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
      const response = await fetch(`${API}/login`, {
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
    <div className="flex-1 flex flex-col justify-center py-20 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA] min-h-screen font-sans antialiased selection:bg-indigo-500/10 selection:text-indigo-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-zinc-200/80 shadow-sm mb-5 transition-all duration-300">
          <span className="text-2xl select-none">⚡</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          SupplyMind
        </h2>
        <p className="mt-2 text-xs text-zinc-400 uppercase tracking-widest font-semibold">
          Supply Chain Disruption Monitor
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-zinc-200/80 p-10 shadow-sm rounded-2xl overflow-hidden relative">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-sans tracking-wide"
                placeholder="e.g. admin"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-sans tracking-wide"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Connecting...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
