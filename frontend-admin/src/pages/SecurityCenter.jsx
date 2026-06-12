import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Lock, ShieldAlert, ShieldCheck, Terminal, UserMinus, Shield } from 'lucide-react';
import API from '../services/api';

export default function SecurityCenter() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('audits'); // 'audits' | 'activities'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const auditRes = await API.get('/admin/audit-logs');
      // Fetch activity logs directly from Supabase using a client call or admin endpoint
      // We can also fallback to mock logs if database is empty
      if (auditRes.data.success) {
        setAuditLogs(auditRes.data.data);
      }
      
      // We can fetch activity_logs from database
      const actRes = await API.get('/admin/logs'); // can merge or fallback
      setActivityLogs(actRes.data.data || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-red-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64 pt-14 md:pt-0">
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Security Center & Audit Log</h1>
            <p className="text-xs text-slate-400">Review system activity records and administrative audit traces</p>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8 max-w-5xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold tracking-tight">Security Telemetry</h2>
          </div>

          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-6">
            <div className="flex border-b border-slate-800 pb-3 gap-6 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab('audits')}
                className={`pb-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'audits' ? 'border-red-500 text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Operator Audit Trails ({auditLogs.length})
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`pb-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'activities' ? 'border-red-500 text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                System Detections Log ({activityLogs.length})
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">Fetching security registry...</div>
            ) : activeTab === 'audits' ? (
              auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No admin audits logged.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 font-semibold">
                        <th className="py-3 px-4">Operator</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Details</th>
                        <th className="py-3 px-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition-all">
                          <td className="py-3 px-4 text-slate-300 font-semibold">{log.admin_email}</td>
                          <td className="py-3 px-4 font-mono">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 border border-slate-800 text-cyan-400">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                            {JSON.stringify(log.details)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-right">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              activityLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No detections recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 font-semibold">
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Threat Content</th>
                        <th className="py-3 px-4">Risk Level</th>
                        <th className="py-3 px-4">Risk Score</th>
                        <th className="py-3 px-4 text-right">Scanned At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition-all">
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.scan_type === 'URL' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'
                            }`}>
                              {log.scan_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-350 font-mono max-w-xs truncate">{log.content}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.risk_level === 'HIGH' 
                                ? 'bg-red-500/10 text-red-400' 
                                : log.risk_level === 'MEDIUM' 
                                  ? 'bg-amber-500/10 text-amber-400' 
                                  : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {log.risk_level}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-bold">{log.risk_score}%</td>
                          <td className="py-3 px-4 text-slate-500 text-right">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
