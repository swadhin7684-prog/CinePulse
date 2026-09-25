import React from 'react';
import { Settings, Shield, CreditCard, User, LogOut, CheckCircle2, Tv, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SettingsPage = () => {
  const { user, activeProfile, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#08090d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-white/10">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-amber-500" />
          Account & Subscription Settings
        </h1>
        <p className="text-slate-400 text-sm">
          Manage your login credentials, subscription benefits, and streaming playback preferences.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Membership Details</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-xs text-slate-500 block">Full Name</span>
            <p className="text-white font-semibold mt-0.5">{user?.name || 'Account Holder'}</p>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Email Address</span>
            <p className="text-white font-semibold mt-0.5">{user?.email}</p>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Account Role</span>
            <p className="text-amber-400 font-semibold uppercase tracking-wider text-xs mt-0.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              {user?.role || 'user'}
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Current Active Profile</span>
            <p className="text-white font-semibold mt-0.5">{activeProfile?.name || 'Primary'}</p>
          </div>
        </div>
      </div>

      {/* Subscription Tier Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Streaming Plan</h2>
          </div>
          <span className="bg-amber-500 text-black text-xs font-black uppercase px-3 py-1 rounded shadow-md shadow-amber-500/20">
            Premium Ultra HD
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-xs text-slate-400">Resolution</span>
              <p className="text-white font-bold text-sm">4K Ultra HD + HDR</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-xs text-slate-400">Concurrent Streams</span>
              <p className="text-white font-bold text-sm">Up to 5 Screens</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-xs text-slate-400">Spatial Audio</span>
              <p className="text-white font-bold text-sm">Dolby Atmos</p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Your CinePulse plan automatically renews on an annual billing schedule. All open cinematic titles are streamed without commercial interruptions.
          </p>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="glass-card rounded-2xl p-6 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Sign Out of CinePulse</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Log out of this browser session. Your profiles, bookmarks, and watch history remain securely stored.
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="btn-danger text-xs !py-2.5 px-6 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
