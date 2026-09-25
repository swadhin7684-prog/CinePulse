import React, { useState, useEffect } from 'react';
import { X, Play, Plus, Check, Star, Clock, Calendar, Film, Tv, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const ContentDetailModal = ({ item, onClose, onListChange }) => {
  const [details, setDetails] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [inList, setInList] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [avgRating, setAvgRating] = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { isAuthenticated, activeProfile } = useAuth();
  const toast = useToast();

  const isShow = item?.contentType === 'tv' || item?.seasonsCount;

  useEffect(() => {
    if (!item?._id) return;

    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        // Fetch detailed data (with episodes if TV show)
        const endpoint = isShow ? `/movies/shows/${item._id}` : `/movies/${item._id}`;
        const res = await api.get(endpoint);
        const data = res.data.show || res.data.movie;
        if (isMounted) setDetails(data);

        // Fetch My List status
        if (isAuthenticated) {
          api.get(`/my-list/${item._id}/status`)
            .then((res) => isMounted && setInList(res.data?.inList || false))
            .catch(() => {});

          // Fetch Ratings
          api.get(`/ratings/${item._id}`)
            .then((res) => {
              if (isMounted) {
                setUserRating(res.data?.userRating || 0);
                setAvgRating(res.data?.averageRating || data.rating);
                setTotalRatings(res.data?.totalRatings || 0);
              }
            })
            .catch(() => {});
        } else {
          setAvgRating(data.rating);
        }

        // Fetch Similar
        api.get(`/recommendations/similar/${item._id}`)
          .then((res) => isMounted && setSimilar(res.data.items || []))
          .catch(() => {});
      } catch (err) {
        console.error('Failed to load content details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // Escape listener
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKey);
    };
  }, [item?._id, isShow, isAuthenticated]);

  if (!item) return null;

  const handlePlay = (episode = null) => {
    onClose();
    if (episode) {
      navigate(`/watch/${episode._id}?type=episode`);
    } else {
      navigate(`/watch/${item._id}${isShow ? '?type=show' : ''}`);
    }
  };

  const handleListToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Sign in to manage your watchlist');
      navigate('/login');
      return;
    }
    try {
      if (inList) {
        await api.delete(`/my-list/${item._id}`);
        setInList(false);
        toast.info(`Removed "${item.title}" from My List`);
      } else {
        await api.post(`/my-list/${item._id}`, {
          contentModel: isShow ? 'TVShow' : 'Movie',
          contentType: isShow ? 'show' : 'movie',
        });
        setInList(true);
        toast.success(`Added "${item.title}" to My List`);
      }
      if (onListChange) onListChange(item._id, !inList);
    } catch {
      toast.error('Could not update watchlist');
    }
  };

  const handleRate = async (score) => {
    if (!isAuthenticated) {
      toast.info('Sign in to rate titles');
      navigate('/login');
      return;
    }
    setRatingLoading(true);
    try {
      await api.post('/ratings', {
        contentId: item._id,
        contentModel: isShow ? 'TVShow' : 'Movie',
        score,
      });
      setUserRating(score);
      toast.success(`Rated ${score} stars! Thank you for your feedback.`);

      // Refresh average rating
      const ratingRes = await api.get(`/ratings/${item._id}`);
      setAvgRating(ratingRes.data?.averageRating);
      setTotalRatings(ratingRes.data?.totalRatings);
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  const content = details || item;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl glass-modal rounded-2xl overflow-hidden shadow-2xl my-8 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-slate-300 hover:text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Banner */}
        <div className="relative aspect-[16/8] sm:aspect-[21/9] w-full overflow-hidden bg-cine-darkest">
          <img
            src={content.backdrop || content.poster}
            alt={content.title}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1119] via-[#0e1119]/50 to-transparent"></div>

          {/* Action Row Inside Banner */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-4xl font-black text-white drop-shadow-md">
                {content.title}
              </h2>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-medium">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {avgRating || content.rating || '8.5'}
                  {totalRatings > 0 && <span className="text-[11px] text-slate-400 font-normal">({totalRatings} reviews)</span>}
                </span>
                <span>•</span>
                <span>{content.releaseYear}</span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded border border-white/20 text-xs">
                  {content.maturityRating || 'PG-13'}
                </span>
                {content.duration && (
                  <>
                    <span>•</span>
                    <span>{content.duration} min</span>
                  </>
                )}
                {content.seasonsCount && (
                  <>
                    <span>•</span>
                    <span>{content.seasonsCount} Season{content.seasonsCount > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePlay()}
                className="btn-primary text-sm !px-6 !py-2.5"
              >
                <Play className="w-4 h-4 fill-black" />
                Play Now
              </button>
              <button
                onClick={handleListToggle}
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10 backdrop-blur-md transition-all active:scale-95"
                title={inList ? 'In My List' : 'Add to My List'}
              >
                {inList ? <Check className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left 2 Cols: Synopsis & Interactive Rating */}
            <div className="md:col-span-2 space-y-5">
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {content.description}
              </p>

              {/* Interactive 5-Star Rating Widget */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">Your Rating</h4>
                  <p className="text-xs text-slate-400">Rate this title to train your personalized recommendations</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={ratingLoading}
                      onClick={() => handleRate(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          (hoverRating || userRating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  ))}
                  {userRating > 0 && (
                    <span className="text-xs font-bold text-amber-400 ml-2">
                      {userRating}/5
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Metadata info */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-400 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              {content.genres && (
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Genres</span>
                  <div className="flex flex-wrap gap-1.5">
                    {content.genres.map((g) => (
                      <span key={g} className="px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 text-xs">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {content.director && (
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Director</span>
                  <p className="text-slate-200 font-medium">{content.director}</p>
                </div>
              )}

              {content.cast && content.cast.length > 0 && (
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Cast</span>
                  <p className="text-slate-200 font-medium">{content.cast.join(', ')}</p>
                </div>
              )}

              {content.language && (
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Audio / Subtitles</span>
                  <p className="text-slate-200 font-medium capitalize">{content.language} (Original)</p>
                </div>
              )}
            </div>
          </div>

          {/* TV Show Episodes List */}
          {isShow && content.episodes && content.episodes.length > 0 && (
            <div className="pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-amber-400" />
                Episodes (Season 1)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.episodes.map((ep) => (
                  <div
                    key={ep._id}
                    onClick={() => handlePlay(ep)}
                    className="group/ep rounded-xl bg-white/5 hover:bg-white/10 p-3 border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer space-y-2"
                  >
                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-black/40">
                      <img
                        src={ep.thumbnail || content.backdrop}
                        alt={ep.title}
                        className="w-full h-full object-cover group-hover/ep:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-black ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white">
                        {ep.duration}m
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover/ep:text-amber-400 transition-colors truncate">
                        {ep.episodeNumber}. {ep.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {ep.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Recommendations */}
          {similar.length > 0 && (
            <div className="pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white">More Like This</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {similar.slice(0, 4).map((sim) => (
                  <div
                    key={sim._id}
                    onClick={() => {
                      onClose();
                      navigate(`/watch/${sim._id}`);
                    }}
                    className="group/sim rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/40 cursor-pointer transition-all"
                  >
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={sim.backdrop || sim.poster}
                        alt={sim.title}
                        className="w-full h-full object-cover group-hover/sim:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white truncate group-hover/sim:text-amber-400 transition-colors">
                        {sim.title}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>{sim.releaseYear}</span>
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {sim.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
