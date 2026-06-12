import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Shield, Plus, Trash2, ShieldAlert, ShieldCheck } from 'lucide-react';
import API from '../services/api';

export default function BlacklistWhitelist() {
  const [whitelist, setWhitelist] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [activeTab, setActiveTab] = useState('blacklist'); // 'blacklist' | 'whitelist'
  
  const [domainOrIp, setDomainOrIp] = useState('');
  const [reason, setReason] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const wlRes = await API.get('/admin/whitelist');
      const blRes = await API.get('/admin/blacklist');
      if (wlRes.data.success) setWhitelist(wlRes.data.data);
      if (blRes.data.success) setBlacklist(blRes.data.data);
    } catch (err) {
      console.error('Failed to load overrides:', err);
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
    fetchEntries();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!domainOrIp.trim()) return;
    try {
      setLoading(true);
      setMessage('');
      const endpoint = activeTab === 'blacklist' ? '/admin/blacklist' : '/admin/whitelist';
      const res = await API.post(endpoint, {
        domain_or_ip: domainOrIp.trim(),
        reason: reason.trim()
      });
      if (res.data.success) {
        setMessage(`Entry added to ${activeTab} successfully!`);
        setDomainOrIp('');
        setReason('');
        fetchEntries();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, entryType) => {
    if (!window.confirm(`Are you sure you want to remove this entry from ${entryType}?`)) return;
    try {
      setLoading(true);
      const endpoint = entryType === 'blacklist' ? `/admin/blacklist/${id}` : `/admin/whitelist/${id}`;
      const res = await API.delete(endpoint);
      if (res.data.success) {
        setMessage('Entry removed successfully!');
        fetchEntries();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to remove entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-red-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64 pt-14 md:pt-0">
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Domain & IP Overrides</h1>
            <p className="text-xs text-slate-400">Manage Whitelists and Blacklists to override scanner results instantly</p>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8 max-w-5xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold tracking-tight">Access Control Lists</h2>
          </div>

          {message && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              message.toLowerCase().includes('failed')
                ? 'border-red-500/20 bg-red-950/10 text-red-400'
                : 'border-emerald-500/20 bg-emerald-950/10 text-emerald-400'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Form */}
            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm h-fit space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Create Registry Entry
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">List Type</label>
                  <div className="flex border border-slate-800 rounded-xl overflow-hidden text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('blacklist')}
                      className={`flex-1 py-3 text-center transition-all cursor-pointer ${
                        activeTab === 'blacklist' ? 'bg-red-500/10 text-red-400 border-r border-slate-800' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Blacklist
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('whitelist')}
                      className={`flex-1 py-3 text-center transition-all cursor-pointer ${
                        activeTab === 'whitelist' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Whitelist
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">Domain or IP</label>
                  <input
                    type="text"
                    placeholder="e.g. malicious-link.ru"
                    value={domainOrIp}
                    onChange={(e) => setDomainOrIp(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-700 focus:border-red-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">Override Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Known malicious phishing clone"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-700 focus:border-red-500 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    activeTab === 'blacklist' 
                      ? 'bg-red-500 hover:bg-red-400 text-slate-950 shadow-red-500/10' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add to Registry
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
                  <button
                    onClick={() => setActiveTab('blacklist')}
                    className={`pb-2 border-b-2 transition-all cursor-pointer ${
                      activeTab === 'blacklist' ? 'border-red-500 text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Blacklist Registry ({blacklist.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('whitelist')}
                    className={`pb-2 border-b-2 transition-all cursor-pointer ${
                      activeTab === 'whitelist' ? 'border-emerald-500 text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Whitelist Registry ({whitelist.length})
                  </button>
                </div>
              </div>

              {activeTab === 'blacklist' ? (
                blacklist.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">No domains blacklisted.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-semibold">
                          <th className="py-3 px-4">Domain / IP</th>
                          <th className="py-3 px-4">Reason</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blacklist.map((entry) => (
                          <tr key={entry.id} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition-all">
                            <td className="py-3 px-4 font-mono font-medium text-red-400 flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-red-500/60" />
                              {entry.domain_or_ip}
                            </td>
                            <td className="py-3 px-4 text-slate-400">{entry.reason || 'None provided'}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDelete(entry.id, 'blacklist')}
                                className="p-1.5 rounded bg-slate-950 border border-slate-850 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                whitelist.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">No domains whitelisted.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-semibold">
                          <th className="py-3 px-4">Domain / IP</th>
                          <th className="py-3 px-4">Reason</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {whitelist.map((entry) => (
                          <tr key={entry.id} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition-all">
                            <td className="py-3 px-4 font-mono font-medium text-emerald-400 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-500/60" />
                              {entry.domain_or_ip}
                            </td>
                            <td className="py-3 px-4 text-slate-400">{entry.reason || 'None provided'}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDelete(entry.id, 'whitelist')}
                                className="p-1.5 rounded bg-slate-950 border border-slate-850 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
