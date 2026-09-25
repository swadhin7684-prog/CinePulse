import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, Shield, LogOut, Settings, List, History, Menu, X, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, activeProfile, isAuthenticated, isAdmin, logout, setShowProfileSelector } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchInput(false);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Browse', path: '/browse' },
    { name: 'Movies', path: '/browse?type=movie' },
    { name: 'TV Shows', path: '/browse?type=tv' },
    { name: 'My List', path: '/my-list' },
    { name: 'History', path: '/history' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'glass-nav py-3' : 'bg-gradient-to-b from-[#08090d]/90 via-[#08090d]/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Left Brand and Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              </div>
              <span className="text-2xl font-black tracking-wider text-white flex items-center">
                CINE<span className="text-amber-500">PULSE</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = location.pathname + location.search === link.path || (link.path !== '/' && location.pathname === link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`text-sm font-medium transition-colors hover:text-amber-400 ${
                      isActive ? 'text-amber-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-xs uppercase tracking-wider font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-md hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              {showSearchInput ? (
                <div className="flex items-center bg-black/60 border border-slate-700/80 rounded-full pl-3 pr-2 py-1.5 focus-within:border-amber-500 transition-all">
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Titles, actors, genres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none w-36 sm:w-56"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSearchInput(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 text-slate-300 hover:text-amber-400 rounded-full hover:bg-white/5 transition-colors"
                  title="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </form>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-black text-sm uppercase shadow-md shadow-amber-500/20">
                    {activeProfile?.name ? activeProfile.name.charAt(0) : user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-slate-200">
                    {activeProfile?.name || 'Profile'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 glass-modal rounded-xl shadow-2xl py-2 z-50 animate-fade-in"
                    onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                      <p className="text-xs text-amber-400/90 font-medium capitalize mt-0.5">
                        Active: {activeProfile?.name}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowProfileSelector(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-amber-400" />
                      Switch Profile
                    </button>

                    <Link
                      to="/my-list"
                      onClick={() => setShowProfileMenu(false)}
                      className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <List className="w-4 h-4 text-slate-400" />
                      My Watchlist
                    </Link>

                    <Link
                      to="/history"
                      onClick={() => setShowProfileMenu(false)}
                      className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <History className="w-4 h-4 text-slate-400" />
                      Watch History
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Manage Profiles
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Account Settings
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <div className="border-t border-white/10 my-1"></div>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-xs !py-2 !px-4">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-modal border-t border-white/10 mt-2 px-4 py-4 animate-fade-in">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-amber-400 py-1"
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-amber-400 py-1 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
