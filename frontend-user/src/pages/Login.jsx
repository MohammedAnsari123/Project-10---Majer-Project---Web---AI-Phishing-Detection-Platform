import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';
import API from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 2FA state flags
  const [tfaRequired, setTfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [tfaCode, setTfaCode] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const sanitizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return setError('Please enter a valid email address');
    }

    if (!password || password.length < 1) {
      return setError('Please enter your password');
    }

    setLoading(true);

    try {
      const response = await API.post('/auth/login', {
        email: sanitizedEmail,
        password
      });

      if (response.data.tfaRequired) {
        setTempToken(response.data.tempToken);
        setTfaRequired(true);
      } else if (response.data.success) {
        const { token, role, name } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('userName', name);
        localStorage.setItem('userEmail', sanitizedEmail);
        localStorage.setItem('userRole', role);

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

  const handleTfaSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!tfaCode || tfaCode.length < 6) {
      return setError('Please enter a valid 6-digit verification code');
    }

    setLoading(true);

    try {
      const response = await API.post('/auth/tfa/login-verify', {
        tempToken,
        code: tfaCode
      });

      if (response.data.success) {
        const { token, role, name } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('userName', name);
        localStorage.setItem('userEmail', email.trim().toLowerCase());
        localStorage.setItem('userRole', role);

        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Verification failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '2FA code verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-cyan-500 selection:text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.1),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Top Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 text-cyan-400 mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-center">
            {tfaRequired ? 'Identity Verification' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {tfaRequired ? 'Enter Google Authenticator Code' : 'Access SentinelScan dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {!tfaRequired ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-slate-100 placeholder-slate-600 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-slate-100 placeholder-slate-600 transition-all"
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
              className="w-full py-3.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:scale-100"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTfaSubmit} className="space-y-5">
            {/* 2FA Code Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Verification Code (TOTP)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={tfaCode}
                  onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-slate-100 placeholder-slate-650 transition-all text-center tracking-[1em] font-mono font-bold"
                  placeholder="000000"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                Open your authenticator app to find your 6-digit access code.
              </p>
            </div>

            {/* Submit 2FA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:scale-100"
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setTfaRequired(false)}
              className="w-full text-xs text-slate-500 hover:text-slate-300 font-semibold text-center mt-2 cursor-pointer transition-colors"
            >
              Back to credentials login
            </button>
          </form>
        )}

        <p className="text-sm text-slate-500 text-center mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Register free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
