import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, ShieldAlert, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

export default function ScanHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchHistory();
  }, [navigate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await API.get('/history');
      if (res.data && res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search term and risk filter button state
  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.url ? item.url.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesRisk = selectedRisk === 'ALL' || item.risk_level === selectedRisk;
    return matchesSearch && matchesRisk;
  });

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
        <main className="flex-1 p-8 space-y-8 max-w-5xl w-full mx-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold tracking-tight">Scan History</h2>
              </div>
              <p className="text-sm text-slate-400">
                Below are the phishing scans and reputation logs saved on your profile.
              </p>
            </div>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:text-cyan-400 transition-all text-slate-400 cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search and Filters Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by scanned URL..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              />
            </div>

            {/* Risk Filters Tabs */}
            <div className="flex bg-slate-900/30 border border-slate-800/80 p-1 rounded-xl">
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setSelectedRisk(risk)}
                  className={`flex-1 text-[10px] font-bold py-2 rounded-lg uppercase transition-all cursor-pointer ${
                    selectedRisk === risk
                      ? 'bg-slate-800 text-cyan-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <span className="text-sm text-slate-500 animate-pulse">Loading database logs...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-900 bg-slate-900/10">
              <p className="text-sm text-slate-500">No matching scan history found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">URL</th>
                    <th className="px-6 py-4">Risk Level</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Scan Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs break-all max-w-md select-all text-slate-300">
                        {item.url}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${
                          item.risk_level === 'HIGH'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : item.risk_level === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                        {item.status}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}