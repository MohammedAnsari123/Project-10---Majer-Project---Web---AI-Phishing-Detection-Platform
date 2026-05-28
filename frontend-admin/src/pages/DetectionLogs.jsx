import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, RefreshCw, Globe, Mail, ShieldAlert, Calendar } from 'lucide-react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

export default function DetectionLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('adminName');
    if (name) setAdminName(name);

    fetchLogs();
  }, [navigate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/logs');
      if (res.data && res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      (log.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = selectedRisk === 'ALL' || log.risk_level === selectedRisk;
    const matchesType = selectedType === 'ALL' || log.scan_type === selectedType;

    return matchesSearch && matchesRisk && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-red-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64">
        {/* Header */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">System Audit Logs</h1>
            <p className="text-xs text-slate-400">Security Operator: {adminName}</p>
          </div>
          <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-semibold text-red-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Live Audit Active
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 space-y-8 max-w-6xl w-full mx-auto animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold tracking-tight">Audit Scan History Logs</h2>
              </div>
              <p className="text-sm text-slate-400">
                Consolidated real-time listing of all automated URL reputations check and suspicious email scans.
              </p>
            </div>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:text-red-400 transition-all text-slate-400 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search + Filter Panel */}
          <div className="bg-slate-900/10 border border-slate-900 p-5 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search scanned content or user emails..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                />
              </div>

              {/* Type Select */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-red-500 outline-none transition-all cursor-pointer"
              >
                <option value="ALL">All Scan Types</option>
                <option value="URL">URLs Only</option>
                <option value="EMAIL">Emails Only</option>
              </select>

              {/* Severity Pill Selector */}
              <div className="flex bg-slate-950 border border-slate-800/80 p-1 rounded-xl w-full">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
                  <button
                    key={risk}
                    onClick={() => setSelectedRisk(risk)}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg uppercase transition-all cursor-pointer ${
                      selectedRisk === risk
                        ? 'bg-slate-850 text-red-400 shadow-sm border border-slate-800'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <span className="text-sm text-slate-500 animate-pulse">Consolidating system logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-900 bg-slate-900/10">
              <p className="text-sm text-slate-500">No scans matching the selection criteria were logged.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Scan Type</th>
                    <th className="px-6 py-4">Operator Email</th>
                    <th className="px-6 py-4">Scanned Content</th>
                    <th className="px-6 py-4">Risk Severity</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Audit Log Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold border ${
                          log.scan_type === 'URL' 
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {log.scan_type === 'URL' ? <Globe className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                          {log.scan_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-400">
                        {log.user_email}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs break-all max-w-sm select-all text-slate-300">
                        {log.content}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${
                          log.risk_level === 'HIGH'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : log.risk_level === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {log.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold font-mono">
                        {log.risk_score}%
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
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
