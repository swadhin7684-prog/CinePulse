import React, { useState } from 'react';
import { Play, Plus, Check, Star, Info, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const MovieCard = ({ item, progress, onSelect, onListToggle }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [inList, setInList] = useState(item?.inList || false);
  const [listLoading, setListLoading] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated, activeProfile } = useAuth();
  const toast = useToast();

  const isMovie = item.contentType !== 'tv' && !item.seasonsCount;
  const watchUrl = `/watch/${item._id}${progress?.currentTime ? `?t=${progress.currentTime}` : ''}`;

  const handleListClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please sign in to save titles to your list');
      navigate('/login');
      return;
    }

    setListLoading(true);
    try {
      if (inList) {
        await api.delete(`/my-list/${item._id}`);
        setInList(false);
        toast.info(`Removed "${item.title}" from My List`);
      } else {
        await api.post(`/my-list/${item._id}`, {
          contentModel: isMovie ? 'Movie' : 'TVShow',
          contentType: isMovie ? 'movie' : 'show',
        });
        setInList(true);
        toast.success(`Added "${item.title}" to My List`);
      }
      if (onListToggle) onListToggle(item._id, !inList);
    } catch (err) {
      toast.error('Failed to update My List');
    } finally {
      setListLoading(false);
    }
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    navigate(watchUrl);
  };

  return (
    <div
      className="relative shrink-0 w-[170px] sm:w-[210px] md:w-[250px] group cursor-pointer transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect && onSelect(item)}
    >
      {/* Thumbnail Card */}
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-cine-card border border-white/10 group-hover:border-amber-500/50 group-hover:shadow-lg group-hover:shadow-amber-500/10 transition-all duration-300">
        <img
          src={item.backdrop || item.poster}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>

        {/* Floating Rating Tag */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-semibold text-amber-400 border border-amber-500/20">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{item.rating || '8.5'}</span>
        </div>

        {/* Floating Maturity Tag */}
        {item.maturityRating && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-300 border border-white/10">
            {item.maturityRating}
          </div>
        )}

        {/* Hover Action Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] p-3 flex flex-col justify-between transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={handlePlayClick}
              className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/40 hover:scale-110 active:scale-95 transition-all"
              title="Play Now"
            >
              <Play className="w-5 h-5 fill-black ml-0.5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleListClick}
                disabled={listLoading}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-all"
                title={inList ? 'Remove from My List' : 'Add to My List'}
              >
                {inList ? <Check className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect && onSelect(item);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-all"
                title="Details"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-white text-xs sm:text-sm font-bold truncate">{item.title}</h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
              <span>{item.releaseYear}</span>
              <span>•</span>
              <span className="capitalize">{item.genres?.[0] || 'Drama'}</span>
              {item.duration && (
                <>
                  <span>•</span>
                  <span>{item.duration}m</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Continue Watching Progress Bar */}
        {progress && progress.completionPercentage !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              style={{ width: `${progress.completionPercentage}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Title Below Thumbnail */}
      <div className="mt-2 px-1">
        <h3 className="text-sm font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-400 mt-0.5">
          <span>{item.releaseYear || 2024}</span>
          <span className="text-slate-500 truncate max-w-[120px]">
            {item.genres?.slice(0, 2).join(', ')}
          </span>
        </div>
      </div>
    </div>
  );
};
