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

      <div className="w-full max-w-3xl md:max-w-4xl mx-auto text-center relative z-10 mb-16 px-4">
        
        {/* Boxed Grid Banner */}
        <div className="w-full border border-[#1F202E] rounded-xl overflow-hidden bg-[#12131A] grid grid-cols-11 divide-x divide-[#1F202E] shadow-2xl">
          {/* Brand Icon Cell */}
          <div className={`h-16 sm:h-22 md:h-28 lg:h-32 flex items-center justify-center bg-[#12131A] transition-all duration-350 ${loading ? "animate-flow-bold" : ""}`}>
            <svg className={`w-5 h-5 sm:w-8 sm:h-8 md:w-11 md:h-11 lg:w-14 lg:h-14 text-[#5E6AD2] ${loading ? "animate-flow-text" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          {"SUPPLYMIND".split("").map((char, index) => (
            <div
              key={index}
              className={`h-16 sm:h-22 md:h-28 lg:h-32 flex items-center justify-center bg-[#12131A] transition-all duration-350 ${loading ? "animate-flow-bold" : ""}`}
              style={{ animationDelay: `${(index + 1) * 0.06}s` }}
            >
              <span 
                className={`text-3xl sm:text-5xl md:text-6.5xl lg:text-7.5xl font-black text-white uppercase select-none font-sans ${loading ? "animate-flow-text" : ""}`}
                style={{ 
                  animationDelay: `${(index + 1) * 0.06}s`,
                  display: "inline-block",
                  transform: "scaleX(0.92) scaleY(1.45)"
                }}
              >
                {char}
              </span>
            </div>
          ))}
        </div>

        {/* Caption Status Bar */}
        <div className="flex items-center justify-between px-3 mt-5 text-zinc-550 text-[10px] sm:text-[11px] uppercase tracking-widest font-mono font-bold select-none">
          <div className="flex items-center gap-1.5 opacity-60">
            <span className="text-[11px]">🔇</span>
            <span>Sound Off</span>
          </div>
          <div className="opacity-75 tracking-[0.2em] font-mono text-zinc-400">
            Autonomous Threat Telemetry System
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
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
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flow-bold {
          0%, 100% {
            background-color: #12131A;
            border-color: #1F202E;
          }
          50% {
            background-color: #161722;
            border-color: #5E6AD2;
          }
        }
        @keyframes flow-text {
          0%, 100% {
            transform: translateY(0);
            color: #ffffff;
            opacity: 0.65;
          }
          50% {
            transform: translateY(-5px);
            color: #5E6AD2;
            opacity: 1;
            text-shadow: 0 0 10px rgba(94, 106, 210, 0.65);
          }
        }
        .animate-flow-bold {
          animation: flow-bold 1.2s ease-in-out infinite;
        }
        .animate-flow-text {
          animation: flow-text 1.2s ease-in-out infinite;
          display: inline-block;
        }
      `}} />
    </div>
  );
}
