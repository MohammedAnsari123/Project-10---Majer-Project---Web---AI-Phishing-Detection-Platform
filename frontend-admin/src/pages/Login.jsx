import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import API from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, role, name } = response.data.data;
        
        if (role !== 'ADMIN') {
          setError('Access denied: Admin role required.');
          setLoading(false);
          return;
        }

        // Save admin auth details
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminName', name);
        localStorage.setItem('adminEmail', email);

        // Redirect to admin dashboard
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Connection failed. Ensure the server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-red-500 selection:text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.08),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Top Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-red-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-center">Admin Console</h2>
          <p className="text-sm text-slate-400 mt-1">Authenticate to access system logs</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <span className="font-semibold">Access Alert:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Admin Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm text-slate-100 placeholder-slate-600 transition-all"
                placeholder="admin@sentinelscan.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Secure Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm text-slate-100 placeholder-slate-600 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-red-500 text-slate-950 font-bold hover:bg-red-400 transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)] flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:scale-100 mt-6"
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-6">
          Need a new operator account?{' '}
          <Link to="/register" className="text-red-400 hover:underline">
            Register here
          </Link>
        </p>

        <div className="mt-6 text-center border-t border-slate-900 pt-4">
          <a
            href="http://localhost:5173/login"
            className="text-xs text-slate-500 hover:text-cyan-400 hover:underline transition-colors"
          >
            Switch to User Portal
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
