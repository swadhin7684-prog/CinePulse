import React, { useState, useEffect } from 'react';
import { List, Film, Play, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MovieCard } from '../components/home/MovieCard';
import { ContentDetailModal } from '../components/modal/ContentDetailModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const MyListPage = () => {
  const { activeProfile, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    let isMounted = true;
    setLoading(true);

    api.get('/my-list')
      .then((res) => {
        if (isMounted) {
          const listDocs = res.data.items || [];
          // Extract contentId documents
          const movies = listDocs.map((item) => ({
            ...item.contentId,
            inList: true,
          }));
          setItems(movies.filter((m) => !!m._id));
        }
      })
      .catch((err) => {
        console.error('Failed to load My List:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, activeProfile, navigate]);

  const handleListToggle = (contentId, isAdded) => {
    if (!isAdded) {
      setItems((prev) => prev.filter((item) => item._id !== contentId));
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <List className="w-8 h-8 text-amber-500" />
          My Watchlist
        </h1>
        <p className="text-slate-400 text-sm">
          Titles saved specifically for profile <span className="text-amber-400 font-semibold">{activeProfile?.name || 'You'}</span>.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading your saved titles...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {items.map((item) => (
            <div key={item._id} className="w-full">
              <MovieCard
                item={item}
                onSelect={(selected) => setSelectedContent(selected)}
                onListToggle={handleListToggle}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/10 max-w-md mx-auto p-8 space-y-4">
          <Film className="w-14 h-14 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Your list is empty</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Explore the catalog and click the "+" icon on any title to save it to your personal watchlist for easy access later.
          </p>
          <button onClick={() => navigate('/browse')} className="btn-primary text-xs mx-auto">
            Browse Trending Movies
          </button>
        </div>
      )}

      {selectedContent && (
        <ContentDetailModal
          item={selectedContent}
          onClose={() => setSelectedContent(null)}
          onListChange={handleListToggle}
        />
      )}
    </div>
  );
};
