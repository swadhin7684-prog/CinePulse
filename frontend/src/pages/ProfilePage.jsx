import React, { useState } from 'react';
import { User, Plus, Edit2, Trash2, Check, Shield, Baby, ArrowLeft, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const AVATARS = [
  { id: 'avatar-1', bg: 'from-amber-600 to-amber-400' },
  { id: 'avatar-2', bg: 'from-blue-600 to-cyan-400' },
  { id: 'avatar-3', bg: 'from-purple-600 to-pink-500' },
  { id: 'avatar-4', bg: 'from-emerald-600 to-teal-400' },
  { id: 'avatar-5', bg: 'from-rose-600 to-orange-400' },
  { id: 'avatar-6', bg: 'from-indigo-600 to-blue-400' },
];

export const ProfilePage = () => {
  const { profiles, activeProfile, switchProfile, refreshProfiles, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    avatar: 'avatar-1',
    maturityRating: 'ALL',
    language: 'en',
    isKids: false,
  });
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const startCreate = () => {
    setIsNew(true);
    setFormData({
      name: '',
      avatar: `avatar-${(profiles.length % 6) + 1}`,
      maturityRating: 'ALL',
      language: 'en',
      isKids: false,
    });
    setEditingProfile({});
  };

  const startEdit = (prof) => {
    setIsNew(false);
    setEditingProfile(prof);
    setFormData({
      name: prof.name,
      avatar: prof.avatar || 'avatar-1',
      maturityRating: prof.maturityRating || 'ALL',
      language: prof.language || 'en',
      isKids: prof.isKids || false,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Profile name is required');
      return;
    }

    setLoading(true);
    try {
      if (isNew) {
        const res = await api.post('/profiles', formData);
        toast.success(`Profile "${res.data.profile.name}" created!`);
        await refreshProfiles();
        switchProfile(res.data.profile);
      } else {
        const res = await api.put(`/profiles/${editingProfile._id}`, formData);
        toast.success(`Profile "${res.data.profile.name}" updated!`);
        await refreshProfiles();
        if (activeProfile?._id === editingProfile._id) {
          switchProfile(res.data.profile);
        }
      }
      setEditingProfile(null);
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profileId, name) => {
    if (profiles.length <= 1) {
      toast.error('An account must retain at least one profile.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete profile "${name}"? Watch history and list items will be permanently erased.`)) {
      return;
    }

    try {
      await api.delete(`/profiles/${profileId}`);
      toast.info(`Profile "${name}" deleted`);
      const updated = await refreshProfiles();
      if (activeProfile?._id === profileId && updated.length > 0) {
        switchProfile(updated[0]);
      }
      setEditingProfile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete profile');
    }
  };

  const getAvatarBg = (avatarId) => {
    const found = AVATARS.find((a) => a.id === avatarId);
    return found ? found.bg : 'from-amber-600 to-amber-400';
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <User className="w-8 h-8 text-amber-500" />
            Manage Profiles
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Personalize avatars, language settings, and maturity limits for every viewer in your household.
          </p>
        </div>

        {profiles.length < 5 && !editingProfile && (
          <button onClick={startCreate} className="btn-primary text-xs !py-2">
            <Plus className="w-4 h-4" />
            Add Profile
          </button>
        )}
      </div>

      {!editingProfile ? (
        /* Profiles Overview Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {profiles.map((prof) => {
            const isActive = activeProfile?._id === prof._id;
            return (
              <div
                key={prof._id}
                className={`glass-card rounded-2xl p-5 border transition-all duration-300 relative flex flex-col justify-between ${
                  isActive ? 'border-amber-500/60 shadow-lg shadow-amber-500/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-tr ${getAvatarBg(
                        prof.avatar
                      )} flex items-center justify-center font-black text-black text-2xl uppercase shadow-md`}
                    >
                      {prof.name.charAt(0)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEdit(prof)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {profiles.length > 1 && (
                        <button
                          onClick={() => handleDelete(prof._id, prof.name)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{prof.name}</h3>
                      {isActive && (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        {prof.maturityRating || 'ALL'}
                      </span>
                      {prof.isKids && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Kids Mode
                        </span>
                      )}
                      <span className="text-slate-500 uppercase">{prof.language || 'en'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  {!isActive ? (
                    <button
                      onClick={() => {
                        switchProfile(prof);
                        toast.success(`Switched to profile "${prof.name}"`);
                      }}
                      className="w-full btn-secondary text-xs !py-2"
                    >
                      Select Profile
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center text-xs font-semibold text-amber-400 flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" /> Currently Watching
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Edit / Create Form */
        <div className="glass-modal p-6 sm:p-8 rounded-2xl border border-white/10 max-w-lg mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">
              {isNew ? 'Create New Profile' : `Edit "${editingProfile?.name}"`}
            </h3>
            <button
              onClick={() => setEditingProfile(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-sm">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Profile Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Profile Name"
                maxLength={30}
                required
                className="w-full bg-black/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Avatar Select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Choose Avatar Color</label>
              <div className="flex gap-3 justify-center py-2">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: av.id })}
                    className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${av.bg} flex items-center justify-center transition-all ${
                      formData.avatar === av.id
                        ? 'scale-110 ring-2 ring-amber-400 ring-offset-2 ring-offset-black'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {formData.avatar === av.id && <Check className="w-5 h-5 text-black stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Kids Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Baby className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Kids Profile</h4>
                  <p className="text-[11px] text-slate-400">Restricts content to PG or below automatically</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.isKids}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isKids: e.target.checked,
                    maturityRating: e.target.checked ? 'PG' : 'ALL',
                  })
                }
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* Maturity Rating */}
            {!formData.isKids && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Maturity Rating Limit</label>
                <select
                  value={formData.maturityRating}
                  onChange={(e) => setFormData({ ...formData, maturityRating: e.target.value })}
                  className="w-full bg-black/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">ALL (No restrictions)</option>
                  <option value="PG-13">PG-13 (Teens & Above)</option>
                  <option value="R">R (Mature Audiences Only)</option>
                  <option value="PG">PG (Parental Guidance)</option>
                  <option value="G">G (General Audiences)</option>
                </select>
              </div>
            )}

            {/* Language */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Audio & Subtitle Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full bg-black/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
                <option value="ja">Japanese (日本語)</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 text-sm !py-2.5"
              >
                {loading ? 'Saving...' : 'Save Profile Settings'}
              </button>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="btn-secondary text-sm !py-2.5 px-5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
