import React, { useState, useEffect } from 'react';
import { HeroBanner } from '../components/home/HeroBanner';
import { MovieRow } from '../components/home/MovieRow';
import { HeroSkeleton, MovieRowSkeleton } from '../components/common/SkeletonLoader';
import { ContentDetailModal } from '../components/modal/ContentDetailModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { activeProfile, isAuthenticated } = useAuth();

  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [continueWatching, setContinueWatching] = useState([]);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [sciFiMovies, setSciFiMovies] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [animationMovies, setAnimationMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadContent = async () => {
      try {
        const [
          trendingRes,
          popularRes,
          recRes,
          sciFiRes,
          actionRes,
          animRes,
        ] = await Promise.all([
          api.get('/recommendations/trending'),
          api.get('/recommendations/popular'),
          api.get('/recommendations'),
          api.get('/movies?genre=Sci-Fi'),
          api.get('/movies?genre=Action'),
          api.get('/movies?genre=Animation'),
        ]);

        if (isMounted) {
          const trendingItems = trendingRes.data.items || [];
          setTrending(trendingItems);
          setPopular(popularRes.data.items || []);
          setRecommendations(recRes.data.items || []);
          setSciFiMovies(sciFiRes.data.items || []);
          setActionMovies(actionRes.data.items || []);
          setAnimationMovies(animRes.data.items || []);

          // Pick featured movie (first featured in trending or first item)
          const featured = trendingItems.find((m) => m.featured) || trendingItems[0] || null;
          setFeaturedMovie(featured);
        }
      } catch (err) {
        console.error('Failed to load home catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch continue watching whenever activeProfile changes
  useEffect(() => {
    if (!isAuthenticated || !activeProfile) {
      setContinueWatching([]);
      return;
    }

    api.get('/history/continue')
      .then((res) => {
        setContinueWatching(res.data.items || []);
      })
      .catch(() => {});
  }, [isAuthenticated, activeProfile]);

  const handleListToggle = (contentId, isAdded) => {
    // Optionally update in-memory items
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090d] text-white">
        <HeroSkeleton />
        <div className="max-w-7xl mx-auto px-4 -mt-16 space-y-6">
          <MovieRowSkeleton />
          <MovieRowSkeleton />
          <MovieRowSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090d] text-white pb-16">
      {/* Featured Hero Banner */}
      <HeroBanner
        movie={featuredMovie}
        onOpenModal={(movie) => setSelectedContent(movie)}
      />

      {/* Row Containers */}
      <div className="relative z-20 -mt-12 sm:-mt-20 space-y-4">
        {/* Continue Watching (Only if active profile has partially watched items) */}
        {continueWatching.length > 0 && (
          <MovieRow
            title={`Continue Watching for ${activeProfile?.name || 'You'}`}
            items={continueWatching}
            isContinueWatching={true}
            onSelect={(item) => setSelectedContent(item)}
            onListToggle={handleListToggle}
          />
        )}

        {/* Personalized Recommendations */}
        {recommendations.length > 0 && (
          <MovieRow
            title={activeProfile ? `Recommended For ${activeProfile.name}` : 'Top Recommendations'}
            items={recommendations}
            onSelect={(item) => setSelectedContent(item)}
            onListToggle={handleListToggle}
          />
        )}

        {/* Trending Now */}
        <MovieRow
          title="Trending Now"
          items={trending}
          onSelect={(item) => setSelectedContent(item)}
          onListToggle={handleListToggle}
        />

        {/* Popular on CinePulse */}
        <MovieRow
          title="Popular Blockbusters"
          items={popular}
          onSelect={(item) => setSelectedContent(item)}
          onListToggle={handleListToggle}
        />

        {/* Sci-Fi & Speculative */}
        {sciFiMovies.length > 0 && (
          <MovieRow
            title="Sci-Fi & Cyberpunk Visions"
            items={sciFiMovies}
            onSelect={(item) => setSelectedContent(item)}
            onListToggle={handleListToggle}
          />
        )}

        {/* Action & Adventure */}
        {actionMovies.length > 0 && (
          <MovieRow
            title="High-Octane Action & Adventure"
            items={actionMovies}
            onSelect={(item) => setSelectedContent(item)}
            onListToggle={handleListToggle}
          />
        )}

        {/* Animation */}
        {animationMovies.length > 0 && (
          <MovieRow
            title="Open Source & Animated Cinema"
            items={animationMovies}
            onSelect={(item) => setSelectedContent(item)}
            onListToggle={handleListToggle}
          />
        )}
      </div>

      {/* Content Details Modal */}
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
