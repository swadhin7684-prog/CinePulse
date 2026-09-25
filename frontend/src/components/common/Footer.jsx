import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, Film, Globe } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-[#06070a] pt-16 pb-12 mt-20 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <Play className="w-4 h-4 text-black fill-black ml-0.5" />
              </div>
              <span className="text-xl font-bold tracking-wider text-white">
                CINE<span className="text-amber-500">PULSE</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              CinePulse is a premier video streaming platform engineered with modern full-stack web technologies. Featuring open-source cinematic releases and high-fidelity video playback.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-500/80">
              <Globe className="w-3.5 h-3.5" />
              <span>Worldwide Creative Commons Cinema</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Explore</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/browse" className="hover:text-amber-400 transition-colors">Catalog Overview</Link></li>
              <li><Link to="/browse?type=movie" className="hover:text-amber-400 transition-colors">Feature Films</Link></li>
              <li><Link to="/browse?type=tv" className="hover:text-amber-400 transition-colors">TV Series & Shows</Link></li>
              <li><Link to="/search" className="hover:text-amber-400 transition-colors">Universal Search</Link></li>
              <li><Link to="/my-list" className="hover:text-amber-400 transition-colors">My Watchlist</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Account</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/profile" className="hover:text-amber-400 transition-colors">Manage Profiles</Link></li>
              <li><Link to="/history" className="hover:text-amber-400 transition-colors">Watch History</Link></li>
              <li><Link to="/settings" className="hover:text-amber-400 transition-colors">Subscription & Settings</Link></li>
              <li><Link to="/login" className="hover:text-amber-400 transition-colors">Account Login</Link></li>
            </ul>
          </div>

          {/* Legal / Tech */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Technology</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Powered by React 18, Tailwind CSS, Node.js, Express REST API, and MongoDB with custom hybrid recommendation engine.
            </p>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-400">
              Legal Disclaimer: CinePulse streams open-source, Creative Commons media exclusively. Zero copyrighted Netflix assets.
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CinePulse Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted for premium cinematic experience</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
