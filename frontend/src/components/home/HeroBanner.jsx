import React from 'react';
import { Play, Info, Star, Calendar, Clock, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const HeroBanner = ({ movie, onOpenModal }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [inList, setInList] = React.useState(false);

  React.useEffect(() => {
    if (movie?._id && isAuthenticated) {
      api.get(`/my-list/${movie._id}/status`)
        .then((res) => setInList(res.data?.inList || false))
        .catch(() => {});
    }
  }, [movie?._id, isAuthenticated]);

  if (!movie) return null;

  const handlePlay = () => {
    navigate(`/watch/${movie._id}`);
  };

  const handleListToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add to My List');
      navigate('/login');
      return;
    }
    try {
      if (inList) {
        await api.delete(`/my-list/${movie._id}`);
        setInList(false);
        toast.info(`Removed "${movie.title}" from My List`);
      } else {
        await api.post(`/my-list/${movie._id}`, {
          contentModel: 'Movie',
          contentType: 'movie',
        });
        setInList(true);
        toast.success(`Added "${movie.title}" to My List`);
      }
    } catch {
      toast.error('Failed to update My List');
    }
  };

  return (
    <div className="relative w-full h-[75vh] min-h-[550px] max-h-[850px] overflow-hidden">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        <img
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover object-top filter brightness-[0.85] contrast-[1.05]"
        />
        {/* Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-[#08090d]/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/20 to-transparent"></div>
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-transparent to-[#08090d]/80 pointer-events-none"></div>
      </div>

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 z-20">
        <div className="max-w-2xl space-y-4">
          {/* Badge */}
          <div className="flex items-center gap-3">
            <span className="bg-amber-500 text-black text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-md shadow-amber-500/30">
              Featured Premiere
            </span>
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-sm">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{movie.rating || '8.8'}</span>
            </div>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded border border-white/20 text-slate-300">
              {movie.maturityRating || 'PG-13'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none drop-shadow-2xl">
            {movie.title}
          </h1>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {movie.releaseYear || 2024}
            </span>
            {movie.duration && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {movie.duration}m
              </span>
            )}
            <div className="flex items-center gap-2">
              {movie.genres?.map((g) => (
                <span key={g} className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] text-slate-200 border border-white/10">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed line-clamp-3 max-w-xl font-normal drop-shadow">
            {movie.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handlePlay}
              className="btn-primary text-sm sm:text-base !px-7 !py-3"
            >
              <Play className="w-5 h-5 fill-black" />
              Play Movie
            </button>

            <button
              onClick={() => onOpenModal && onOpenModal(movie)}
              className="btn-secondary text-sm sm:text-base !px-6 !py-3"
            >
              <Info className="w-5 h-5" />
              More Details
            </button>

            <button
              onClick={handleListToggle}
              className="w-12 h-12 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10 backdrop-blur-md transition-all active:scale-95"
              title={inList ? 'In My List' : 'Add to My List'}
            >
              {inList ? <Check className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
