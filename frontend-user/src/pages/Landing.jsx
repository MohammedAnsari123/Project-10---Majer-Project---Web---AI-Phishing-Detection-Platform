import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20 text-cyan-400">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            SentinelScan AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all hover:scale-105"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
          <Lock className="w-3.5 h-3.5" /> Next-Generation Threat intelligence
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6">
          Detect and Neutralize{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Phishing Threats
          </span>{' '}
          Instantly
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mb-12">
          Analyze suspicious URLs, verify deceptive email templates, and stay ahead of modern social engineering tactics using our dual-rule ML analyzer.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 text-center"
          >
            Protect Your Account Now
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-300 font-semibold hover:bg-slate-900 hover:border-slate-700 transition-all text-center"
          >
            Access Scanner Dashboard
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm hover:border-cyan-500/30 hover:bg-slate-900/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-3">Live URL Scanner</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Verify unknown links immediately using automated heuristics, blacklists, and advanced deep reputation lookup.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm hover:border-blue-500/30 hover:bg-slate-900/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-3">Email Threat Analysis</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Inspect suspicious requests, deceptive urgent language, and credential theft templates using NLP pattern matching.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm hover:border-indigo-500/30 hover:bg-slate-900/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-3">Cyber Security Intelligence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Access risk level graphs, detailed warning summaries, and step-by-step guides to protect your personal details.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} SentinelScan AI. All rights reserved. Secure cybersecurity practice tool.
      </footer>
    </div>
  );
};

export default Landing;
