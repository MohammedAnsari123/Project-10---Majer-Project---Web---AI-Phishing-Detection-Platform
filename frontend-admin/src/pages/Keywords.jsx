import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Settings, Plus, Trash2, RefreshCw } from 'lucide-react';
import API from '../services/api';

export default function Keywords() {
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/keywords');
      if (res.data.success) {
        setKeywords(res.data.data);
      }
    } catch (err) {
      console.error(err);
      navigate('/login');
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
    fetchKeywords();
  }, []);

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    try {
      setLoading(true);
      setMessage('');
      const res = await API.post('/admin/keywords', {
        keyword: newKeyword.trim(),
        severity,
        category
      });
      if (res.data.success) {
        setMessage('Keyword added successfully!');
        setNewKeyword('');
        fetchKeywords();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to add keyword');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKeyword = async (id) => {
    if (!window.confirm('Are you sure you want to delete this keyword?')) return;
    try {
      setLoading(true);
      const res = await API.delete(`/admin/keywords/${id}`);
      if (res.data.success) {
        setMessage('Keyword deleted successfully');
        fetchKeywords();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Deletion failed');
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
            <h1 className="text-lg font-bold">Phishing Keyword Management</h1>
            <p className="text-xs text-slate-400">Configure dynamic detection keywords used in email and SMS filters</p>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8 max-w-5xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold tracking-tight">Keyword Dictionary</h2>
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
            {/* Create form */}
            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm h-fit space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Add New Keyword
              </h3>

              <form onSubmit={handleAddKeyword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">Keyword / Phrase</label>
                  <input
                    type="text"
                    placeholder="e.g. login credentials code"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-700 focus:border-red-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">Threat Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">Category Label</label>
                  <input
                    type="text"
                    placeholder="e.g. banking, urgency"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-700 focus:border-red-500 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                >
                  <Plus className="w-4 h-4" />
                  Add Keyword
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Active Keyword Rules ({keywords.length})
                </h3>
                <button
                  onClick={fetchKeywords}
                  className="p-2 rounded-lg border border-slate-800 hover:bg-slate-900/50 text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loading && keywords.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">Loading dictionary...</div>
              ) : keywords.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No custom phishing keywords configured.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 uppercase font-semibold">
                        <th className="py-3 px-4">Keyword</th>
                        <th className="py-3 px-4">Severity</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywords.map((kw) => (
                        <tr key={kw.id} className="border-b border-slate-900 hover:bg-slate-900/10 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-350">{kw.keyword}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              kw.severity === 'HIGH' 
                                ? 'bg-red-500/10 text-red-400' 
                                : kw.severity === 'MEDIUM' 
                                  ? 'bg-amber-500/10 text-amber-400' 
                                  : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {kw.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4 capitalize text-slate-400">{kw.category}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteKeyword(kw.id)}
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
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
