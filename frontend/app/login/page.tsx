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
    <div className="flex-1 flex flex-col justify-center py-20 px-4 sm:px-6 lg:px-8 bg-[#0D0E14] min-h-screen font-sans antialiased selection:bg-[#5E6AD2]/25 selection:text-white relative">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f2030_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#12131A] border border-[#1F202E] shadow-sm mb-5 transition-all duration-300">
          <span className="text-xl text-[#5E6AD2] select-none font-black">⚡</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          SupplyMind
        </h2>
        <p className="mt-2 text-[10px] text-zinc-550 uppercase tracking-widest font-semibold font-mono">
          Supply Chain Disruption Monitor
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#12131A] border border-[#1F202E] p-10 shadow-xl rounded-2xl overflow-hidden">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-[#1F202E] rounded-xl bg-[#0D0E14] text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/10 focus:border-[#5E6AD2] transition-all duration-200 text-sm font-sans tracking-wide"
                placeholder="e.g. admin"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-[#1F202E] rounded-xl bg-[#0D0E14] text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/10 focus:border-[#5E6AD2] transition-all duration-200 text-sm font-sans tracking-wide"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-950/20 border border-red-900/30 rounded-xl p-3 text-center flex items-center justify-center gap-2 font-mono">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#5E6AD2] hover:bg-[#4E5AC2] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E6AD2] transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-98"
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
