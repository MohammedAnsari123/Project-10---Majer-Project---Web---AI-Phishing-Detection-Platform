import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Users, FileText, Settings, Activity, AlertTriangle, UserMinus } from 'lucide-react';
import API from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [stats, setStats] = useState({ totalUsers: 34, totalScans: 284, detectionRate: '34.2%', highRisk: 42 });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const name = localStorage.getItem('adminName');
    if (name) {
      setAdminName(name);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-red-500 selection:text-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/60 backdrop-blur-md hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
          <span className="font-bold tracking-tight bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
            SentinelAdmin
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-medium text-sm transition-all">
            <Activity className="w-4 h-4" />
            System Overview
          </button>
          <button
            onClick={() => alert('User Management coming soon!')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 font-medium text-sm transition-all"
          >
            <Users className="w-4 h-4" />
            User Accounts
          </button>
          <button
            onClick={() => alert('Detection Logs coming soon!')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 font-medium text-sm transition-all"
          >
            <FileText className="w-4 h-4" />
            Scan Logs
          </button>
          <button
            onClick={() => alert('Keyword dictionary coming soon!')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 font-medium text-sm transition-all"
          >
            <Settings className="w-4 h-4" />
            Keyword Config
          </button>
        </nav>

        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-900 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all font-medium text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">System Administration</h1>
            <p className="text-xs text-slate-400">Security Operator: {adminName}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="md:hidden p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-semibold text-red-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> Live Audit Active
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Total Registrations
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{stats.totalUsers}</span>
                <span className="text-xs text-slate-500">Active accounts</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                System Scan Queries
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-cyan-400">{stats.totalScans}</span>
                <span className="text-xs text-cyan-500">API queries run</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Average Threat Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-500">{stats.detectionRate}</span>
                <span className="text-xs text-amber-500/80">Positives flagged</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Critical Attacks Stopped
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-red-500">{stats.highRisk}</span>
                <span className="text-xs text-red-500/80">Urgent risks blocked</span>
              </div>
            </div>
          </div>

          {/* Quick Stats list or Admin logs panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 lg:col-span-2">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">
                Recent Security Flags
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>http://verify-credentials-paypal.support-alert.com/login</span>
                  </div>
                  <span className="text-red-400 font-semibold px-2 py-0.5 rounded bg-red-950/20 border border-red-500/10">High Risk</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Suspicious Email Body: urgent credential verification requested</span>
                  </div>
                  <span className="text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/20 border border-amber-500/10">Medium Risk</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>http://chase-bank-verify-account.web.app</span>
                  </div>
                  <span className="text-red-400 font-semibold px-2 py-0.5 rounded bg-red-950/20 border border-red-500/10">High Risk</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 lg:col-span-1 space-y-4">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2">
                Quick Actions
              </h3>
              <button
                onClick={() => alert('User Management coming soon!')}
                className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-red-500/30 hover:bg-slate-900/20 transition-all flex items-center gap-4 group cursor-pointer text-left"
              >
                <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Review User Accounts</h4>
                  <p className="text-xs text-slate-500">Suspend offending users</p>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
