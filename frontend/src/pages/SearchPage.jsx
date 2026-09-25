import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Film, X, Loader2, Sparkles } from 'lucide-react';
import { MovieCard } from '../components/home/MovieCard';
import { ContentDetailModal } from '../components/modal/ContentDetailModal';
import api from '../services/api';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  // Debounce search query changes by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim()) {
        setSearchParams({ q: query.trim() });
      } else {
        setSearchParams({});
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, setSearchParams]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const performSearch = async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedQuery.trim()) params.append('q', debouncedQuery.trim());
        if (selectedGenre) params.append('genre', selectedGenre);

        const res = await api.get(`/search?${params.toString()}`);
        if (isMounted) {
          setResults(res.data.items || []);
        }
      } catch (err) {
        console.error('Search request error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, selectedGenre]);

  const quickGenres = ['Sci-Fi', 'Action', 'Animation', 'Drama', 'Fantasy', 'Thriller'];

  return (
    <div className="min-h-screen bg-[#08090d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Search Input Hero Box */}
      <div className="max-w-3xl mx-auto mb-10 space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-6 h-6 text-amber-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, director, cast, or genre..."
            autoFocus
            className="w-full bg-cine-card/80 border border-white/10 rounded-2xl pl-13 pr-12 py-4 text-white text-base sm:text-lg placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xl transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Genre Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-xs text-slate-500 font-medium mr-1">Trending Tags:</span>
          {quickGenres.map((g) => {
            const isSelected = selectedGenre === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGenre(isSelected ? '' : g)}
                className={`text-xs px-3 py-1 rounded-full transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-black font-bold border-amber-400'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:border-amber-500/40 hover:text-white'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {debouncedQuery || selectedGenre ? (
            <>
              Search Results for
              <span className="text-amber-400">
                "{debouncedQuery || selectedGenre}"
              </span>
            </>
          ) : (
            'Popular Catalogue Suggestions'
          )}
        </h2>
        <span className="text-xs text-slate-400">
          {results.length} title{results.length === 1 ? '' : 's'} found
        </span>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-400 text-sm">Searching CinePulse catalogue...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {results.map((item) => (
            <div key={item._id} className="w-full">
              <MovieCard
                item={item}
                onSelect={(selected) => setSelectedContent(selected)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/10 max-w-md mx-auto p-8 space-y-4">
          <Film className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No matching titles found</h3>
          <p className="text-xs text-slate-400">
            We couldn't find anything matching "{debouncedQuery}". Try checking for spelling errors or searching by a different genre or actor.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setSelectedGenre('');
            }}
            className="btn-primary text-xs mx-auto"
          >
            Clear Search
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
