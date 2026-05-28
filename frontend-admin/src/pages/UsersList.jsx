import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, RefreshCw, UserMinus, UserCheck, Shield, Calendar } from 'lucide-react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

export default function UsersList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('adminName');
    if (name) setAdminName(name);

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/users');
      if (res.data && res.data.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmChange = window.confirm(`Are you sure you want to change this user status to ${newStatus}?`);
    if (!confirmChange) return;

    try {
      const res = await API.put(`/admin/users/${userId}/status`, { status: newStatus });
      if (res.data && res.data.success) {
        // Update user state locally
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
      console.error('Error changing user status:', err);
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-red-505 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64">
        {/* Header */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">User Administration</h1>
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
                <Users className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold tracking-tight">User Accounts</h2>
              </div>
              <p className="text-sm text-slate-400">
                Audit system accounts, monitor admin privileges, and suspend offending accounts.
              </p>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:text-red-400 transition-all text-slate-400 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name, email, or role..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
            />
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <span className="text-sm text-slate-500 animate-pulse">Loading system accounts...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-900 bg-slate-900/10">
              <p className="text-sm text-slate-500">No users found matching search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          user.role === 'ADMIN' 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.role === 'ADMIN' ? (
                          <span className="text-[10px] text-slate-600">Admin Locked</span>
                        ) : (
                          <button
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                              user.status === 'ACTIVE'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                          >
                            {user.status === 'ACTIVE' ? (
                              <>
                                <UserMinus className="w-3 h-3" />
                                Suspend Account
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                Activate Account
                              </>
                            )}
                          </button>
                        )}
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
