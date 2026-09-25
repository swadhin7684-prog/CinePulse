import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CustomVideoPlayer } from '../components/player/CustomVideoPlayer';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const WatchPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, activeProfile } = useAuth();

  const timeParam = searchParams.get('t');
  const typeParam = searchParams.get('type') || 'movie';

  const [content, setContent] = useState(null);
  const [initialTime, setInitialTime] = useState(timeParam ? parseFloat(timeParam) : 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadVideoData = async () => {
      try {
        let endpoint = `/movies/${id}`;
        if (typeParam === 'show') {
          // If a show ID was passed directly to watch, fetch show to get first episode
          const showRes = await api.get(`/movies/shows/${id}`);
          const episodes = showRes.data.show?.episodes || [];
          if (episodes.length > 0) {
            if (isMounted) {
              setContent({
                ...episodes[0],
                title: `${showRes.data.show.title} - S1:E1 ${episodes[0].title}`,
              });
              setLoading(false);
              return;
            }
          }
        }

        const res = await api.get(endpoint);
        const movie = res.data.movie;

        if (isMounted) {
          setContent(movie);

          // If no initial timestamp passed in URL and user is logged in, check watch history
          if (!timeParam && isAuthenticated && activeProfile) {
            try {
              const histRes = await api.get('/history');
              const found = (histRes.data.items || []).find(
                (h) => (h.contentId?._id || h.contentId) === id && !h.isCompleted
              );
              if (found && found.currentTime > 5) {
                setInitialTime(found.currentTime);
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load video stream');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadVideoData();

    return () => {
      isMounted = false;
    };
  }, [id, typeParam, timeParam, isAuthenticated, activeProfile]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Preparing cinema stream...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="w-full h-screen bg-[#08090d] flex flex-col items-center justify-center p-6 text-center text-white gap-4">
        <AlertCircle className="w-16 h-16 text-rose-500" />
        <h2 className="text-2xl font-bold">Content Unavailable</h2>
        <p className="text-slate-400 text-sm max-w-md">
          {error || 'The requested video title could not be retrieved from the catalog.'}
        </p>
        <button onClick={() => navigate(-1)} className="btn-primary text-sm mt-2">
          Return to Browse
        </button>
      </div>
    );
  }

  return (
    <CustomVideoPlayer
      content={content}
      initialTime={initialTime}
      contentType={typeParam}
      onBack={() => navigate(-1)}
    />
  );
};
