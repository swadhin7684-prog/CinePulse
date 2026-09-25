import React, { useState, useEffect } from 'react';
import { History, Play, Trash2, Clock, CheckCircle2, Loader2, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const HistoryPage = () => {
  const { activeProfile, isAuthenticated } = useAuth();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const toast = useToast();

  const formatTime = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    let isMounted = true;
    setLoading(true);

    api.get('/history')
      .then((res) => {
        if (isMounted) {
          setHistoryItems(res.data.items || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load watch history:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, activeProfile, navigate]);

  const handleRemove = async (contentId, title) => {
    try {
      await api.delete(`/history/${contentId}`);
      setHistoryItems((prev) => prev.filter((item) => (item.contentId?._id || item.contentId) !== contentId));
      toast.info(`Removed "${title}" from history`);
    } catch {
      toast.error('Failed to remove item from history');
    }
  };

  const handleResume = (item) => {
    const movie = item.contentId;
    if (!movie) return;
    navigate(`/watch/${movie._id}?t=${item.currentTime}`);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-amber-500" />
          Watch History
        </h1>
        <p className="text-slate-400 text-sm">
          Chronological playback logs and saved timestamps for <span className="text-amber-400 font-semibold">{activeProfile?.name || 'You'}</span>.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading playback logs...</p>
        </div>
      ) : historyItems.length > 0 ? (
        <div className="space-y-4">
          {historyItems.map((item) => {
            const movie = item.contentId;
            if (!movie) return null;

            return (
              <div
                key={item._id}
                className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5 border border-white/10 hover:border-amber-500/30 transition-all group"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => handleResume(item)}
                  className="relative aspect-[16/9] w-full sm:w-52 rounded-xl overflow-hidden bg-black/40 shrink-0 cursor-pointer"
                >
                  <img
                    src={movie.backdrop || movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${item.completionPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {movie.title}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {new Date(item.lastWatchedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{movie.description}</p>

                  <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      {item.isCompleted ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        `Watched ${item.completionPercentage}% (${formatTime(item.currentTime)} / ${formatTime(item.duration)})`
                      )}
                    </span>
                    <span>•</span>
                    <span>{movie.genres?.join(', ')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleResume(item)}
                    className="btn-primary text-xs !py-2 !px-4"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    {item.isCompleted ? 'Replay' : 'Resume'}
                  </button>

                  <button
                    onClick={() => handleRemove(movie._id, movie.title)}
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/10 max-w-md mx-auto p-8 space-y-4">
          <Film className="w-14 h-14 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No watch history yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            When you watch movies and shows, your progress and completed titles will be logged here so you can pick up right where you left off.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary text-xs mx-auto">
            Explore Featured Titles
          </button>
        </div>
      )}
    </div>
  );
};
