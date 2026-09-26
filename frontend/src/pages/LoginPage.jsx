import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Play, Lock, Mail, ArrowRight, Shield, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Welcome back to CinePulse!');
      navigate(from, { replace: true });
    } catch (err) {
      let msg = err.message || 'Login failed. Please check your credentials.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        msg.includes('invalid-credential') ||
        msg.includes('INVALID_LOGIN_CREDENTIALS') ||
        msg.includes('wrong-password') ||
        msg.includes('user-not-found')
      ) {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again in a few minutes.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#08090d] overflow-hidden">
      {/* Cinematic Ambient Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80"
          alt="Cinema Background"
          className="w-full h-full object-cover filter brightness-[0.25] blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/80 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
            <span className="text-3xl font-black tracking-wider text-white">
              CINE<span className="text-amber-500">PULSE</span>
            </span>
          </Link>
          <p className="text-slate-400 text-xs sm:text-sm">
            Sign in to resume watching on any screen
          </p>
        </div>

        {/* Login Glassmorphic Card */}
        <div className="glass-modal p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <h2 className="text-xl font-bold text-white tracking-wide">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cinepulse.io"
                  required
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm !py-3 font-bold mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[11px] text-slate-400 font-medium block text-center">
              Quick 1-Click Demo Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('user@cinepulse.io', 'Password123')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                Demo User
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin@cinepulse.io', 'Password123')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Admin Demo
              </button>
            </div>
          </div>

          {/* Register Prompt */}
          <div className="text-center text-xs text-slate-400">
            New to CinePulse?{' '}
            <Link to="/register" className="text-amber-400 hover:underline font-semibold">
              Create an account now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
