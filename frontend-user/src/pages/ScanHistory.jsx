import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function ScanHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/scan-history');
      const data = await res.json();

      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.log('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-cyan-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64">
        {/* Header */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Threat Intelligence Hub</h1>
            <p className="text-xs text-slate-400">View and audit previous scan metrics</p>
          </div>
          <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-semibold text-cyan-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> System Secured
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 space-y-8 max-w-4xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold tracking-tight">Scan History</h2>
          </div>
          <p className="text-sm text-slate-400">
            Below are the phishing scans and heuristic analytics logged on this account.
          </p>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <span className="text-sm text-slate-500 animate-pulse">Loading database logs...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-900 bg-slate-900/10">
              <p className="text-sm text-slate-500">No scan history found in Supabase.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="p-5 bg-slate-900/20 border border-slate-900 rounded-2xl space-y-3 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500 transition-colors" />
                  
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider block">CONTENT SCANNED</span>
                      <span className="font-mono text-sm text-slate-300 break-all">{item.content}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                      item.risk_level === 'HIGH'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : item.risk_level === 'MEDIUM'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {item.risk_level}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-900/60 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500 text-[10px] block">SCAN TYPE</span>
                      <span className="font-medium text-slate-300">{item.scan_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">RISK SCORE</span>
                      <span className="font-medium text-cyan-400">{item.risk_score}% Match</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-500 text-[10px] block">DETERMINATION</span>
                      <span className="font-medium text-slate-300">{item.result}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}