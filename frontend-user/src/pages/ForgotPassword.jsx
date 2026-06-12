import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, ArrowLeft, Send } from 'lucide-react';
import API from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = Request, 2 = Reset
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      setMessage('');
      const res = await API.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage('Reset token generated successfully! Copy it below to reset your password.');
        setResetToken(res.data.token);
        setStep(2);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;
    try {
      setLoading(true);
      setMessage('');
      const res = await API.post('/auth/reset-password', { token: resetToken, newPassword });
      if (res.data.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-slate-950">
      <div className="w-full max-w-md bg-slate-900/30 border border-slate-800 p-8 rounded-2xl backdrop-blur-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <Key className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Recover Credentials</h2>
          <p className="text-sm text-slate-400">Password Reset Manager</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
            message.toLowerCase().includes('failed') || message.toLowerCase().includes('invalid')
              ? 'border-red-500/20 bg-red-950/10 text-red-400'
              : 'border-cyan-500/20 bg-cyan-950/10 text-cyan-400'
          }`}>
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Account Email Address
              </label>
              <input
                type="email"
                placeholder="operator@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Requesting...' : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Reset Token
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Reset Token
              </label>
              <input
                type="text"
                placeholder="Enter token copy..."
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
