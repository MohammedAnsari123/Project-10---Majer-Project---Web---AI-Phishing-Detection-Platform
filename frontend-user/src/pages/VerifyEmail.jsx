import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, ShieldCheck, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import API from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [status, setStatus] = useState('pending'); // pending | success | error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (tokenToUse) => {
    if (!tokenToUse) return;
    try {
      setLoading(true);
      setStatus('pending');
      const res = await API.post('/auth/verify-email', { token: tokenToUse });
      if (res.data.success) {
        setStatus('success');
        setMessage('Your email address has been verified successfully!');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Email verification failed. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tokenQuery = searchParams.get('token');
    if (tokenQuery) {
      setTokenInput(tokenQuery);
      handleVerify(tokenQuery);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-slate-950">
      <div className="w-full max-w-md bg-slate-900/30 border border-slate-800 p-8 rounded-2xl backdrop-blur-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Verify Email Address</h2>
          <p className="text-sm text-slate-400">Security Verification Gateway</p>
        </div>

        {status === 'success' && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <ShieldCheck className="w-16 h-16 text-emerald-500 animate-bounce" />
            </div>
            <p className="text-sm text-slate-300">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              Continue to Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <ShieldAlert className="w-16 h-16 text-red-500" />
            </div>
            <p className="text-sm text-slate-300">{message}</p>
            <div className="border-t border-slate-850 pt-4 mt-2">
              <p className="text-xs text-slate-500 mb-3">Or paste your verification token manually below:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste token..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono focus:border-cyan-500 outline-none"
                />
                <button
                  onClick={() => handleVerify(tokenInput)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 cursor-pointer"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'pending' && loading && (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Verifying your token credentials...</p>
          </div>
        )}

        {status === 'pending' && !loading && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 text-center">Paste the verification token provided in your registration payload to activate your account.</p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Verification Token
              </label>
              <input
                type="text"
                placeholder="verification-token-string"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-mono"
              />
            </div>
            <button
              onClick={() => handleVerify(tokenInput)}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer"
            >
              Verify Token
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
