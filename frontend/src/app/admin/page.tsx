"use client";

import { useState, useEffect } from "react";

interface Analytics {
  total_queries: number;
  escalated_queries: number;
  automated_resolutions: number;
  escalation_rate: number;
  intent_trends: { name: string; value: number }[];
}

interface Log {
  id: number;
  user_id: string;
  channel: string;
  user_message: string;
  bot_response: string;
  intent: string;
  escalated: boolean;
  timestamp: string;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [analyticsRes, logsRes] = await Promise.all([
          fetch("http://localhost:8000/api/admin/analytics"),
          fetch("http://localhost:8000/api/admin/logs")
        ]);
        
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data);
        }
        if (logsRes.ok) {
          const data = await logsRes.json();
          setLogs(data.logs);
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
    // Setting up polling for real-time updates
    const interval = setInterval(fetchAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
              ChatFusion Command Center
            </h1>
            <p className="text-slate-400 mt-2 text-sm tracking-wide">Live Analytics & Conversation History</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-medium shadow-lg shadow-emerald-500/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Live
          </div>
        </header>

        {loading && !analytics ? (
          <div className="flex justify-center py-20">
             <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Queries", value: analytics?.total_queries || 0, color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20", text: "text-blue-400", shadow: "hover:shadow-blue-500/10" },
                { label: "Automated", value: analytics?.automated_resolutions || 0, color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-400", shadow: "hover:shadow-emerald-500/10" },
                { label: "Escalated", value: analytics?.escalated_queries || 0, color: "from-rose-500/20 to-rose-500/5", border: "border-rose-500/20", text: "text-rose-400", shadow: "hover:shadow-rose-500/10" },
                { label: "Escalation Rate", value: `${analytics?.escalation_rate || 0}%`, color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20", text: "text-amber-400", shadow: "hover:shadow-amber-500/10" }
              ].map((kpi, idx) => (
                <div key={idx} className={`p-6 rounded-3xl bg-gradient-to-br ${kpi.color} border ${kpi.border} backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/20 ${kpi.shadow} cursor-default`}>
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</p>
                  <p className={`text-4xl font-bold ${kpi.text}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Content Split: Intents & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Intent Trends */}
              <div className="lg:col-span-1 bg-slate-900/50 border border-white/5 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-slate-300 mb-6 flex items-center gap-2">
                   <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                   Intent Recognition
                </h3>
                <div className="space-y-4">
                  {analytics?.intent_trends.length === 0 && <p className="text-slate-500 text-sm">No data available.</p>}
                  {analytics?.intent_trends.map((intent, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 flex justify-between items-center hover:bg-slate-800 transition-colors">
                      <span className="text-slate-300 font-medium capitalize">{intent.name.replace("_", " ")}</span>
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-bold shadow-inner">
                        {intent.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logs Table */}
              <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
                <div className="p-6 border-b border-white/5 bg-slate-900/80 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-300 flex items-center gap-2">
                    <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Live Conversation Feed
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Auto-updating</span>
                </div>
                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-white/5 bg-slate-900/40 sticky top-0 backdrop-blur-md z-10">
                        <th className="p-4 font-semibold">User ID</th>
                        <th className="p-4 font-semibold">Message</th>
                        <th className="p-4 font-semibold">Intent</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 relative">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors group cursor-default">
                          <td className="p-4">
                            <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">{log.user_id}</span>
                          </td>
                          <td className="p-4 max-w-[200px] truncate text-slate-300 text-sm" title={log.user_message}>
                            {log.user_message}
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-md text-slate-400 capitalize">
                               {log.intent?.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-4">
                            {log.escalated ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                                Escalated
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Handled
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right text-xs text-slate-500 tabular-nums">
                             {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' })}
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">Waiting for live conversations...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
