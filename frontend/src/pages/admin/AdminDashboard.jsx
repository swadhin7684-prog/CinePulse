import React, { useState, useEffect } from 'react';
import {
  Shield,
  Film,
  Tv,
  Users,
  Tag,
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  Star,
  Check,
  X,
  Loader2,
  Eye,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AdminDashboard = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieFormData, setMovieFormData] = useState({
    title: '',
    description: '',
    poster: '',
    backdrop: '',
    videoUrl: '',
    releaseYear: 2024,
    duration: 15,
    genres: 'Sci-Fi, Action',
    cast: 'John Doe, Jane Smith',
    director: 'Director Name',
    rating: 8.5,
    maturityRating: 'PG-13',
    featured: false,
    trending: true,
  });

  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [selectedShowForEpisode, setSelectedShowForEpisode] = useState(null);
  const [episodeFormData, setEpisodeFormData] = useState({
    seasonNumber: 1,
    episodeNumber: 1,
    title: '',
    description: '',
    thumbnail: '',
    videoUrl: '',
    duration: 45,
  });

  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreDesc, setNewGenreDesc] = useState('');

  // Protect Admin route
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      toast.error('Access denied. Administrator privileges required.');
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, moviesRes, showsRes, usersRes, genresRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/movies'),
        api.get('/admin/shows'),
        api.get('/admin/users'),
        api.get('/admin/genres'),
      ]);

      setAnalytics(analyticsRes.data);
      setMovies(moviesRes.data.items || []);
      setShows(showsRes.data.items || []);
      setUsersList(usersRes.data.users || []);
      setGenres(genresRes.data.genres || []);
    } catch (err) {
      console.error('Failed to load admin dataset:', err);
      toast.error('Failed to load admin dataset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Movie Handlers
  const handleSaveMovie = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...movieFormData,
        genres: typeof movieFormData.genres === 'string'
          ? movieFormData.genres.split(',').map((s) => s.trim())
          : movieFormData.genres,
        cast: typeof movieFormData.cast === 'string'
          ? movieFormData.cast.split(',').map((s) => s.trim())
          : movieFormData.cast,
        releaseYear: Number(movieFormData.releaseYear),
        duration: Number(movieFormData.duration),
        rating: Number(movieFormData.rating),
      };

      if (editingMovie) {
        await api.put(`/admin/movies/${editingMovie._id}`, payload);
        toast.success(`Movie "${payload.title}" updated successfully!`);
      } else {
        await api.post('/admin/movies', payload);
        toast.success(`Movie "${payload.title}" added to catalogue!`);
      }
      setShowMovieForm(false);
      setEditingMovie(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save movie');
    }
  };

  const handleDeleteMovie = async (id, title) => {
    if (!window.confirm(`Delete movie "${title}"?`)) return;
    try {
      await api.delete(`/admin/movies/${id}`);
      toast.info(`Movie "${title}" deleted`);
      loadData();
    } catch (err) {
      toast.error('Failed to delete movie');
    }
  };

  const handleToggleMovieFeatured = async (movie) => {
    try {
      await api.put(`/admin/movies/${movie._id}`, { featured: !movie.featured });
      toast.success(`Updated featured status for "${movie.title}"`);
      loadData();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleToggleMovieTrending = async (movie) => {
    try {
      await api.put(`/admin/movies/${movie._id}`, { trending: !movie.trending });
      toast.success(`Updated trending status for "${movie.title}"`);
      loadData();
    } catch {
      toast.error('Update failed');
    }
  };

  // Episode Handlers
  const handleSaveEpisode = async (e) => {
    e.preventDefault();
    if (!selectedShowForEpisode) return;
    try {
      await api.post(`/admin/shows/${selectedShowForEpisode._id}/episodes`, {
        ...episodeFormData,
        seasonNumber: Number(episodeFormData.seasonNumber),
        episodeNumber: Number(episodeFormData.episodeNumber),
        duration: Number(episodeFormData.duration),
      });
      toast.success(`Episode added to "${selectedShowForEpisode.title}"!`);
      setShowEpisodeForm(false);
      setSelectedShowForEpisode(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to add episode');
    }
  };

  // Genre Handlers
  const handleAddGenre = async (e) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    try {
      await api.post('/admin/genres', { name: newGenreName.trim(), description: newGenreDesc.trim() });
      toast.success(`Genre "${newGenreName}" created!`);
      setNewGenreName('');
      setNewGenreDesc('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create genre');
    }
  };

  const handleDeleteGenre = async (id, name) => {
    if (!window.confirm(`Delete genre "${name}"?`)) return;
    try {
      await api.delete(`/admin/genres/${id}`);
      toast.info(`Genre "${name}" removed`);
      loadData();
    } catch {
      toast.error('Failed to delete genre');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#08090d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-500" />
            CinePulse Admin Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            System administration, catalog management, streaming metrics, and user controls.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'analytics' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'movies' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            Movies ({movies.length})
          </button>
          <button
            onClick={() => setActiveTab('shows')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'shows' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            Shows ({shows.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Users ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('genres')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'genres' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            Genres ({genres.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading admin datasets...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Registered Accounts</span>
                  <p className="text-3xl font-black text-white">{analytics?.totalUsers || 0}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Feature Movies</span>
                  <p className="text-3xl font-black text-amber-400">{analytics?.totalMovies || 0}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">TV Shows</span>
                  <p className="text-3xl font-black text-white">{analytics?.totalShows || 0}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Episodes Managed</span>
                  <p className="text-3xl font-black text-white">{analytics?.totalEpisodes || 0}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Total Streams Logged</span>
                  <p className="text-3xl font-black text-emerald-400">{analytics?.totalStreams || 0}</p>
                </div>
              </div>

              {/* Top Viewed Titles */}
              <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Most Watched Titles
                </h3>
                <div className="divide-y divide-white/5">
                  {analytics?.topMovies?.map((m, idx) => (
                    <div key={m._id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-amber-500 w-5">#{idx + 1}</span>
                        <span className="text-sm font-semibold text-white">{m.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {m.viewsCount || 0} views
                        </span>
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {m.rating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Movies Manager */}
          {activeTab === 'movies' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Feature Movies Catalogue</h2>
                <button
                  onClick={() => {
                    setEditingMovie(null);
                    setMovieFormData({
                      title: '',
                      description: '',
                      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
                      backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
                      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                      releaseYear: 2024,
                      duration: 15,
                      genres: 'Sci-Fi, Action',
                      cast: 'Derek de Lint',
                      director: 'Ian Hubert',
                      rating: 8.5,
                      maturityRating: 'PG-13',
                      featured: false,
                      trending: true,
                    });
                    setShowMovieForm(true);
                  }}
                  className="btn-primary text-xs !py-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Movie
                </button>
              </div>

              {/* Table */}
              <div className="glass-card rounded-2xl border border-white/10 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-white/10 text-xs text-slate-400 bg-black/40 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Title</th>
                      <th className="p-4">Year</th>
                      <th className="p-4">Genres</th>
                      <th className="p-4">Rating</th>
                      <th className="p-4">Featured</th>
                      <th className="p-4">Trending</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {movies.map((m) => (
                      <tr key={m._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-semibold text-white flex items-center gap-3">
                          <img
                            src={m.poster}
                            alt=""
                            className="w-10 h-14 object-cover rounded bg-black/60 shrink-0"
                          />
                          <span className="truncate max-w-[180px]">{m.title}</span>
                        </td>
                        <td className="p-4">{m.releaseYear}</td>
                        <td className="p-4 text-xs text-slate-400">{m.genres?.join(', ')}</td>
                        <td className="p-4 font-bold text-amber-400">{m.rating}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleMovieFeatured(m)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                              m.featured
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-white/5 text-slate-500 border-white/10'
                            }`}
                          >
                            {m.featured ? 'Featured' : 'Standard'}
                          </button>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleMovieTrending(m)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                              m.trending
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-white/5 text-slate-500 border-white/10'
                            }`}
                          >
                            {m.trending ? 'Trending' : 'Normal'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingMovie(m);
                                setMovieFormData({
                                  title: m.title,
                                  description: m.description,
                                  poster: m.poster,
                                  backdrop: m.backdrop,
                                  videoUrl: m.videoUrl,
                                  releaseYear: m.releaseYear,
                                  duration: m.duration,
                                  genres: m.genres?.join(', '),
                                  cast: m.cast?.join(', '),
                                  director: m.director,
                                  rating: m.rating,
                                  maturityRating: m.maturityRating,
                                  featured: m.featured,
                                  trending: m.trending,
                                });
                                setShowMovieForm(true);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMovie(m._id, m.title)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TV Shows Manager */}
          {activeTab === 'shows' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">TV Series & Episodic Productions</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shows.map((show) => (
                  <div key={show._id} className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                    <div className="flex gap-4">
                      <img
                        src={show.poster}
                        alt=""
                        className="w-20 h-28 object-cover rounded-xl shrink-0"
                      />
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">{show.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2">{show.description}</p>
                        <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold pt-1">
                          <span>{show.releaseYear}</span>
                          <span>•</span>
                          <span>{show.seasonsCount} Season{show.seasonsCount > 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {show.rating}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-xs text-slate-400">
                        {show.genres?.join(', ')}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedShowForEpisode(show);
                          setEpisodeFormData({
                            seasonNumber: 1,
                            episodeNumber: 1,
                            title: '',
                            description: '',
                            thumbnail: show.backdrop || show.poster,
                            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                            duration: 45,
                          });
                          setShowEpisodeForm(true);
                        }}
                        className="btn-primary text-xs !py-1.5 !px-3"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Episode
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Users Manager */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-white">Registered Users & Household Profiles</h2>
              <div className="glass-card rounded-2xl border border-white/10 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-white/10 text-xs text-slate-400 bg-black/40 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Profiles Count</th>
                      <th className="p-4">Member Since</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {usersList.map((u) => (
                      <tr key={u._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-semibold text-white">{u.name}</td>
                        <td className="p-4 text-slate-400">{u.email}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-white/5 text-slate-400 border-white/10'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 font-semibold">{u.profiles?.length || 1} profile(s)</td>
                        <td className="p-4 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Genres Manager */}
          {activeTab === 'genres' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
              {/* Add Genre Form */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 h-fit">
                <h3 className="text-base font-bold text-white">Add New Genre</h3>
                <form onSubmit={handleAddGenre} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1">Genre Name</label>
                    <input
                      type="text"
                      value={newGenreName}
                      onChange={(e) => setNewGenreName(e.target.value)}
                      placeholder="e.g. Cyberpunk"
                      required
                      className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1">Description</label>
                    <textarea
                      value={newGenreDesc}
                      onChange={(e) => setNewGenreDesc(e.target.value)}
                      placeholder="Brief category summary"
                      rows={2}
                      className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full text-xs !py-2">
                    <Plus className="w-3.5 h-3.5" />
                    Save Genre
                  </button>
                </form>
              </div>

              {/* Genres List */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-base font-bold text-white">Active System Genres</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {genres.map((g) => (
                    <div
                      key={g._id}
                      className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-white">{g.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{g.description || 'No description'}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteGenre(g._id, g.name)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Movie Modal Form */}
      {showMovieForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="glass-modal p-6 sm:p-8 rounded-3xl border border-white/10 max-w-2xl w-full my-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">
                {editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Add New Movie to Catalogue'}
              </h3>
              <button
                onClick={() => setShowMovieForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovie} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Movie Title</label>
                  <input
                    type="text"
                    value={movieFormData.title}
                    onChange={(e) => setMovieFormData({ ...movieFormData, title: e.target.value })}
                    required
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Release Year</label>
                  <input
                    type="number"
                    value={movieFormData.releaseYear}
                    onChange={(e) => setMovieFormData({ ...movieFormData, releaseYear: e.target.value })}
                    required
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  value={movieFormData.description}
                  onChange={(e) => setMovieFormData({ ...movieFormData, description: e.target.value })}
                  rows={3}
                  required
                  className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Poster Image URL</label>
                  <input
                    type="url"
                    value={movieFormData.poster}
                    onChange={(e) => setMovieFormData({ ...movieFormData, poster: e.target.value })}
                    required
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Backdrop Image URL</label>
                  <input
                    type="url"
                    value={movieFormData.backdrop}
                    onChange={(e) => setMovieFormData({ ...movieFormData, backdrop: e.target.value })}
                    required
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Video Stream URL (MP4 / WebM / HLS CDN URL)
                </label>
                <input
                  type="url"
                  value={movieFormData.videoUrl}
                  onChange={(e) => setMovieFormData({ ...movieFormData, videoUrl: e.target.value })}
                  required
                  placeholder="https://.../video.mp4"
                  className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={movieFormData.duration}
                    onChange={(e) => setMovieFormData({ ...movieFormData, duration: e.target.value })}
                    required
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Rating (0 - 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={movieFormData.rating}
                    onChange={(e) => setMovieFormData({ ...movieFormData, rating: e.target.value })}
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Maturity Rating</label>
                  <select
                    value={movieFormData.maturityRating}
                    onChange={(e) => setMovieFormData({ ...movieFormData, maturityRating: e.target.value })}
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ALL">ALL</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Genres (comma-separated)</label>
                  <input
                    type="text"
                    value={movieFormData.genres}
                    onChange={(e) => setMovieFormData({ ...movieFormData, genres: e.target.value })}
                    placeholder="Sci-Fi, Action"
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Director</label>
                  <input
                    type="text"
                    value={movieFormData.director}
                    onChange={(e) => setMovieFormData({ ...movieFormData, director: e.target.value })}
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={movieFormData.featured}
                    onChange={(e) => setMovieFormData({ ...movieFormData, featured: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-300">Feature on Hero Banner</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={movieFormData.trending}
                    onChange={(e) => setMovieFormData({ ...movieFormData, trending: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-300">Mark as Trending</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowMovieForm(false)}
                  className="btn-secondary text-xs !py-2.5 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs !py-2.5 px-6">
                  {editingMovie ? 'Update Movie' : 'Save Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Episode Modal */}
      {showEpisodeForm && selectedShowForEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="glass-modal p-6 sm:p-8 rounded-3xl border border-white/10 max-w-lg w-full space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">
                Add Episode to "{selectedShowForEpisode.title}"
              </h3>
              <button
                onClick={() => setShowEpisodeForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEpisode} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Season Number</label>
                  <input
                    type="number"
                    min="1"
                    value={episodeFormData.seasonNumber}
                    onChange={(e) => setEpisodeFormData({ ...episodeFormData, seasonNumber: e.target.value })}
                    required
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Episode Number</label>
                  <input
                    type="number"
                    min="1"
                    value={episodeFormData.episodeNumber}
                    onChange={(e) => setEpisodeFormData({ ...episodeFormData, episodeNumber: e.target.value })}
                    required
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Episode Title</label>
                <input
                  type="text"
                  value={episodeFormData.title}
                  onChange={(e) => setEpisodeFormData({ ...episodeFormData, title: e.target.value })}
                  required
                  placeholder="e.g. Pilot: Into the Void"
                  className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Episode Synopsis</label>
                <textarea
                  value={episodeFormData.description}
                  onChange={(e) => setEpisodeFormData({ ...episodeFormData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Video Stream URL</label>
                <input
                  type="url"
                  value={episodeFormData.videoUrl}
                  onChange={(e) => setEpisodeFormData({ ...episodeFormData, videoUrl: e.target.value })}
                  required
                  placeholder="https://.../episode.mp4"
                  className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEpisodeForm(false)}
                  className="btn-secondary text-xs !py-2 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs !py-2 px-5">
                  Save Episode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
