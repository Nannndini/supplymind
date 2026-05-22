"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function Card3D({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [shadow, setShadow] = useState("none");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate tilt angles (max 6 degrees to maintain input focus usability)
    const rotateX = ((centerY - y) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * 6;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`);
    setShadow(`${(x - centerX) / 3}px ${(y - centerY) / 3}px 30px rgba(6, 182, 212, 0.12)`);
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setShadow("none");
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
      }}
      className={className}
    >
      {children}
    </div>
  );
}

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
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#040407] relative overflow-hidden min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Premium background radial glowing spotlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Decorative floating digital circuit grid inside background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f13_1px,transparent_1px),linear-gradient(to_bottom,#0f0f13_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center relative">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 shadow-2xl shadow-cyan-950/20 mb-4 group hover:border-cyan-500/40 hover:shadow-cyan-500/10 transition-all duration-500">
          <span className="text-3xl text-cyan-400 group-hover:scale-110 transition-transform duration-500 select-none">⚡</span>
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          SupplyMind
        </h2>
        <p className="mt-2.5 text-xs text-zinc-500 max-w-xs mx-auto tracking-wide uppercase font-semibold">
          Autonomous Supply Chain Monitor
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Dynamic 3D Card wrapper */}
        <Card3D className="relative bg-zinc-950/40 backdrop-blur-xl border border-zinc-900/80 p-8 shadow-2xl rounded-3xl sm:px-10 overflow-hidden">
          {/* Internal diagonal glint highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                Corporate ID / Username
              </label>
              <div className="relative group/input">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-zinc-900 rounded-xl bg-zinc-950/80 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/40 transition-all duration-300 text-sm font-mono tracking-wide"
                  placeholder="e.g. admin"
                />
                <div className="absolute inset-0 rounded-xl border border-transparent group-hover/input:border-zinc-800/80 pointer-events-none transition-colors duration-300" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                Security Passkey
              </label>
              <div className="relative group/input">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-zinc-900 rounded-xl bg-zinc-950/80 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/40 transition-all duration-300 text-sm font-mono tracking-wide"
                  placeholder="••••••••"
                />
                <div className="absolute inset-0 rounded-xl border border-transparent group-hover/input:border-zinc-800/80 pointer-events-none transition-colors duration-300" />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-950/20 border border-red-900/30 rounded-xl p-3 text-center flex items-center justify-center gap-2 animate-shake">
                <span className="text-sm">⚠️</span> {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-zinc-800 rounded-xl shadow-xl text-xs font-bold text-white bg-gradient-to-r from-zinc-900 to-zinc-950 hover:from-cyan-950 hover:to-indigo-950 hover:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300 disabled:opacity-50 cursor-pointer active:scale-98 tracking-wider uppercase"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    Establishing Link...
                  </span>
                ) : (
                  "Establish Secure Session"
                )}
              </button>
            </div>
          </form>
        </Card3D>
      </div>
    </div>
  );
}

