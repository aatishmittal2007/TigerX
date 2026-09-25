import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, ArrowRight, Lock, Mail, Network, Cpu, FileCheck } from 'lucide-react';
import { Button } from '../components/common/Button';
import { apiLogin } from '../services/api';
import { UserProfile } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('analyst@tigerx.ai');
  const [password, setPassword] = useState('tigerx-secure-pass');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your corporate email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 500);
    } catch {
      setError('Invalid credentials. Please verify your corporate account.');
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    setEmail('analyst@tigerx.ai');
    setPassword('tigerx-demo-2026');
    setLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        name: 'Sarah Chen',
        email: 'analyst@tigerx.ai',
        role: 'Senior Fraud Specialist',
        organization: 'TigerX Global Financial Security',
        avatar: 'SC',
        permissions: ['CASE_VIEW', 'INVESTIGATION_RUN', 'APPROVAL_L1', 'APPROVAL_L2', 'SAR_FILE']
      });
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 select-none">
      {/* Left Branding & Visual Column */}
      <div className="md:w-1/2 bg-slate-900 text-white p-10 flex flex-col justify-between relative overflow-hidden border-r border-slate-800">
        {/* Subtle geometric background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2DD4BF" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Abstract network nodes graphic */}
        <div className="absolute right-[-60px] top-1/3 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-600/30">
              <span className="text-lg tracking-tight">TX</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>TigerX</span>
              </h1>
              <p className="text-xs text-teal-400 font-medium tracking-wide">Investigate. Connect. Decide.</p>
            </div>
          </div>
        </div>

        {/* Central Graphic & Value Props */}
        <div className="relative z-10 my-auto py-12 max-w-md">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800/80 text-teal-300 text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span>TigerGraph × Agentic Intelligence</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Autonomous Graph Intelligence for Modern Fraud Teams
          </h2>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed">
            Investigate multi-card syndicates, detect undocumented device proxies, and enforce two-tier policy approvals with calibrated AI agent reasoning.
          </p>

          <div className="mt-8 space-y-3.5">
            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <Network className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Multi-hop sub-millisecond traversal over 590,000 transactions and device profiles</span>
            </div>
            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <Cpu className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Two-pass agent reasoning with active customer verification under Policy R1</span>
            </div>
            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <FileCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Automated FinCEN-compliant Suspicious Activity Report (SAR) narrative generation</span>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-800/80">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            <span>Protected by TigerX Security Framework</span>
          </div>
          <span>v1.0.0 Enterprise</span>
        </div>
      </div>

      {/* Right Login Form Column */}
      <div className="md:w-1/2 p-10 md:p-16 flex items-center justify-center bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1.5">
              Access your TigerX financial crime investigation workspace
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@tigerx.ai"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[11px] text-teal-600 hover:text-teal-700 font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-9 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs text-slate-600">Remember session for 12 hours</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Demo Shortcut */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block mb-2">Hackathon Evaluation Demo</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDemoSignIn}
              className="w-full border-dashed"
            >
              Instant Analyst Sign-in (Demo Mode)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
