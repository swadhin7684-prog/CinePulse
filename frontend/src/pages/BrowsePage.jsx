import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Film, Tv, Sparkles, Loader2 } from 'lucide-react';
import { MovieCard } from '../components/home/MovieCard';
import { ContentDetailModal } from '../components/modal/ContentDetailModal';
import api from '../services/api';

const GENRES = ['All', 'Sci-Fi', 'Action', 'Animation', 'Drama', 'Fantasy', 'Thriller'];

export const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const typeParam = searchParams.get('type') || 'all';
  const genreParam = searchParams.get('genre') || 'All';
  const sortParam = searchParams.get('sort') || 'popular';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchBrowseData = async () => {
      try {
        let endpoint = '/search?';
        const params = new URLSearchParams();

        if (typeParam !== 'all') params.append('type', typeParam);
        if (genreParam !== 'All') params.append('genre', genreParam);
        if (sortParam !== 'popular') params.append('sort', sortParam);

        const res = await api.get(`/search?${params.toString()}`);
        if (isMounted) {
          let results = res.data.items || [];
          if (sortParam === 'rating') {
            results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          } else if (sortParam === 'latest') {
            results.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
          }
          setItems(results);
        }
      } catch (err) {
        console.error('Failed to browse titles:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBrowseData();

    return () => {
      isMounted = false;
    };
  }, [typeParam, genreParam, sortParam]);

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'all' || val === 'All' || val === 'popular') {
      next.delete(key);
    } else {
      next.set(key, val);
    }
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <Film className="w-8 h-8 text-amber-500" />
          Browse Catalogue
        </h1>
        <p className="text-slate-400 text-sm">
          Explore our collection of cinematic masterpieces, independent productions, and original episodic stories.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl mb-8 flex flex-wrap items-center justify-between gap-4 border border-white/10">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setFilter('type', 'all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeParam === 'all' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-slate-300 hover:text-white'
            }`}
          >
            All Titles
          </button>
          <button
            onClick={() => setFilter('type', 'movie')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeParam === 'movie' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-slate-300 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setFilter('type', 'tv')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeParam === 'tv' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-slate-300 hover:text-white'
            }`}
          >
            TV Shows
          </button>
        </div>

        {/* Right side dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Genre select */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400 font-medium">Genre:</span>
            <select
              value={genreParam}
              onChange={(e) => setFilter('genre', e.target.value)}
              className="bg-transparent text-xs text-amber-400 font-semibold focus:outline-none cursor-pointer"
            >
              {GENRES.map((g) => (
                <option key={g} value={g} className="bg-cine-card text-white">
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Sort select */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortParam}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="bg-transparent text-xs text-amber-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="popular" className="bg-cine-card text-white">Most Popular</option>
              <option value="rating" className="bg-cine-card text-white">Highest Rated</option>
              <option value="latest" className="bg-cine-card text-white">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading catalog...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {items.map((item) => (
            <div key={item._id} className="w-full">
              <MovieCard
                item={item}
                onSelect={(selected) => setSelectedContent(selected)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/10 max-w-md mx-auto p-8 space-y-3">
          <Film className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No titles matched your filters</h3>
          <p className="text-xs text-slate-400">
            Try adjusting your genre or type selection to find available movies and series.
          </p>
          <button
            onClick={() => {
              setSearchParams(new URLSearchParams());
            }}
            className="btn-primary text-xs mx-auto mt-2"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Content Details Modal */}
      {selectedContent && (
        <ContentDetailModal
          item={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </div>
  );
};
