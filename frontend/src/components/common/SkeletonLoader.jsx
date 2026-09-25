import React from 'react';

export const MovieCardSkeleton = () => (
  <div className="w-[180px] sm:w-[220px] md:w-[260px] aspect-[16/9] rounded-xl bg-cine-card animate-pulse shrink-0 border border-white/5 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
  </div>
);

export const MovieRowSkeleton = () => (
  <div className="py-6 space-y-3">
    <div className="h-6 w-48 bg-cine-card rounded-md animate-pulse"></div>
    <div className="flex gap-4 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <div className="w-full h-[70vh] bg-cine-card/40 animate-pulse relative flex items-end pb-20 px-8">
    <div className="max-w-2xl space-y-4">
      <div className="h-10 w-3/4 bg-white/10 rounded-lg"></div>
      <div className="h-4 w-1/2 bg-white/10 rounded"></div>
      <div className="h-16 w-full bg-white/10 rounded"></div>
      <div className="flex gap-4 pt-2">
        <div className="h-12 w-32 bg-amber-500/30 rounded-lg"></div>
        <div className="h-12 w-36 bg-white/10 rounded-lg"></div>
      </div>
    </div>
  </div>
);
