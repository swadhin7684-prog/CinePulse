import React, { useState } from 'react';
import { X, Plus, Check, Shield, User, Baby, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const AVATARS = [
  { id: 'avatar-1', bg: 'from-amber-600 to-amber-400', label: 'Golden Lynx' },
  { id: 'avatar-2', bg: 'from-blue-600 to-cyan-400', label: 'Cyber Falcon' },
  { id: 'avatar-3', bg: 'from-purple-600 to-pink-500', label: 'Vivid Neon' },
  { id: 'avatar-4', bg: 'from-emerald-600 to-teal-400', label: 'Emerald Dragon' },
  { id: 'avatar-5', bg: 'from-rose-600 to-orange-400', label: 'Solar Flare' },
  { id: 'avatar-6', bg: 'from-indigo-600 to-blue-400', label: 'Abyssal Deep' },
];

export const ProfileSelectModal = () => {
  const { profiles, activeProfile, switchProfile, refreshProfiles, showProfileSelector, setShowProfileSelector } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar-1');
  const [maturityRating, setMaturityRating] = useState('ALL');
  const [isKids, setIsKids] = useState(false);
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  if (!showProfileSelector) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/profiles', {
        name: newName.trim(),
        avatar: selectedAvatar,
        maturityRating: isKids ? 'PG' : maturityRating,
        isKids,
      });

      toast.success(`Profile "${res.data.profile.name}" created!`);
      setIsCreating(false);
      setNewName('');
      await refreshProfiles();
      switchProfile(res.data.profile);
    } catch (err) {
      toast.error(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarBg = (avatarId) => {
    const found = AVATARS.find((a) => a.id === avatarId);
    return found ? found.bg : 'from-amber-600 to-amber-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl text-center space-y-8 p-6 sm:p-10">
        {/* Close Button */}
        <button
          onClick={() => setShowProfileSelector(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {!isCreating ? (
          <>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Who's watching?
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Select your profile for personalized recommendations and watch history
              </p>
            </div>

            {/* Profiles Grid */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-4">
              {profiles.map((profile) => {
                const isActive = activeProfile?._id === profile._id;
                return (
                  <div
                    key={profile._id}
                    onClick={() => switchProfile(profile)}
                    className="flex flex-col items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr ${getAvatarBg(
                        profile.avatar
                      )} flex items-center justify-center shadow-xl group-hover:scale-105 group-hover:border-amber-400 border-2 transition-all duration-300 ${
                        isActive ? 'border-amber-500 shadow-amber-500/30' : 'border-transparent'
                      }`}
                    >
                      <span className="text-3xl font-black text-black uppercase">
                        {profile.name.charAt(0)}
                      </span>
                      {profile.isKids && (
                        <span className="absolute bottom-1 right-1 bg-black/70 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/20">
                          KIDS
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-sm sm:text-base font-semibold group-hover:text-amber-400 transition-colors ${
                        isActive ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      {profile.name}
                    </span>
                  </div>
                );
              })}

              {/* Add Profile Card (Max 5) */}
              {profiles.length < 5 && (
                <div
                  onClick={() => setIsCreating(true)}
                  className="flex flex-col items-center gap-3 cursor-pointer group"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 group-hover:border-amber-400 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                    <Plus className="w-10 h-10 text-slate-400 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-sm sm:text-base font-medium text-slate-400 group-hover:text-amber-400 transition-colors">
                    Add Profile
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Create Profile Form */
          <form onSubmit={handleCreate} className="glass-modal p-6 sm:p-8 rounded-2xl border border-white/10 text-left space-y-6 max-w-md mx-auto animate-fade-in">
            <h3 className="text-xl font-bold text-white text-center">Add New Profile</h3>

            {/* Profile Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Profile Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Cinema Vault, Kids, Alex"
                maxLength={30}
                required
                className="w-full bg-black/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            {/* Avatar Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Choose Avatar Color</label>
              <div className="flex gap-3 justify-center py-1">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${av.bg} flex items-center justify-center transition-all ${
                      selectedAvatar === av.id ? 'scale-110 ring-2 ring-amber-400 ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {selectedAvatar === av.id && <Check className="w-4 h-4 text-black stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Kids Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <Baby className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Kids Profile</h4>
                  <p className="text-[11px] text-slate-400">Only titles rated PG or below</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isKids}
                onChange={(e) => setIsKids(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* Maturity Rating */}
            {!isKids && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Maturity Rating Limit</label>
                <select
                  value={maturityRating}
                  onChange={(e) => setMaturityRating(e.target.value)}
                  className="w-full bg-black/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
                >
                  <option value="ALL">ALL (No Restrictions)</option>
                  <option value="PG-13">PG-13 (Teens & Above)</option>
                  <option value="R">R (Mature Audiences)</option>
                  <option value="PG">PG (Parental Guidance)</option>
                </select>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 text-sm !py-2.5"
              >
                {loading ? 'Creating...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="btn-secondary text-sm !py-2.5 px-4"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
