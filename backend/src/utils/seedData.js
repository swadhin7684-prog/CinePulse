import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import * as dbService from '../services/firestoreDb.js';

dotenv.config();

const genresData = [
  { name: 'Sci-Fi', slug: 'sci-fi', icon: 'Rocket', description: 'Futuristic technologies, space exploration, and cybernetic realities' },
  { name: 'Action', slug: 'action', icon: 'Flame', description: 'High-octane thrillers, martial arts, and explosive encounters' },
  { name: 'Drama', slug: 'drama', icon: 'Drama', description: 'Emotionally driven narratives, intimate conflicts, and character depth' },
  { name: 'Fantasy', slug: 'fantasy', icon: 'Sparkles', description: 'Mythic realms, enchanted creatures, and epic sagas' },
  { name: 'Animation', slug: 'animation', icon: 'Clapperboard', description: 'Cutting-edge animated artistry, open source cinema, and family adventures' },
  { name: 'Thriller', slug: 'thriller', icon: 'Eye', description: 'Suspenseful investigations, psychological twists, and high stakes' },
];

const moviesData = [
  {
    title: 'Tears of Steel: Neo Amsterdam',
    description: 'In a dystopian future Neo Amsterdam, a passionate group of scientists and freedom fighters attempt to salvage earth from a runaway cybernetic apocalypse using forgotten biomechanical technology.',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    releaseYear: 2024,
    duration: 12,
    genres: ['Sci-Fi', 'Action'],
    cast: ['Derek de Lint', 'Vanja Rukavina', 'Denise Rebergen'],
    director: 'Ian Hubert',
    rating: 8.7,
    maturityRating: 'PG-13',
    featured: true,
    trending: true,
    popularityScore: 98,
    viewsCount: 14200,
  },
  {
    title: 'Cosmos Laundromat: The First Cycle',
    description: 'On a desolate wind-swept Scottish island, a suicidal sheep named Franck meets a flamboyant salesman who offers him the deal of a lifetime: a magical journey through surreal parallel dimensions.',
    poster: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    releaseYear: 2023,
    duration: 12,
    genres: ['Animation', 'Fantasy', 'Drama'],
    cast: ['Pierre Bokma', 'Reinout Scholten van Aschat'],
    director: 'Mathieu Auvray',
    rating: 8.9,
    maturityRating: 'PG-13',
    featured: true,
    trending: true,
    popularityScore: 94,
    viewsCount: 18900,
  },
  {
    title: 'Sintel: The Dragon Chronicles',
    description: 'A resilient loner searches tirelessly across snow-capped peaks and unforgiving deserts for a kidnapped infant dragon companion that she saved from death.',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    releaseYear: 2023,
    duration: 15,
    genres: ['Fantasy', 'Animation', 'Action'],
    cast: ['Halina Reijn', 'Thom Hoffman'],
    director: 'Colin Levy',
    rating: 8.5,
    maturityRating: 'PG',
    featured: false,
    trending: true,
    popularityScore: 89,
    viewsCount: 11200,
  },
  {
    title: 'Elephants Dream: The Machine Protocol',
    description: 'Two cybernetic cartographers venture deep into the infinitely recursive heart of an enigmatic, colossal machine world where perception dictates physical reality.',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    releaseYear: 2022,
    duration: 11,
    genres: ['Sci-Fi', 'Animation'],
    cast: ['Tygo Gernandt', 'Cas Jansen'],
    director: 'Bassam Kurdali',
    rating: 7.9,
    maturityRating: 'PG-13',
    featured: false,
    trending: false,
    popularityScore: 78,
    viewsCount: 8400,
  },
  {
    title: 'Vortex: The Deep Horizon',
    description: 'An elite orbital deep-space crew discovers an uncharted spatial rift emitting encrypted harmonic signals that predate the dawn of the universe.',
    poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    releaseYear: 2024,
    duration: 18,
    genres: ['Sci-Fi', 'Thriller'],
    cast: ['Elena Rostova', 'Marcus Thorne', 'Sarah Jenkins'],
    director: 'Alexander Cole',
    rating: 8.8,
    maturityRating: 'PG-13',
    featured: false,
    trending: true,
    popularityScore: 92,
    viewsCount: 15400,
  },
  {
    title: 'Solaris Echo',
    description: 'When solar flares destabilize Earth’s magnetic shield, an atmospheric physicist and a rogue engineer embark on a perilous high-altitude expedition into the stratosphere.',
    poster: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    releaseYear: 2023,
    duration: 14,
    genres: ['Action', 'Thriller'],
    cast: ['Christian Bale', 'Alicia Vikander'],
    director: 'Claire Denis',
    rating: 8.1,
    maturityRating: 'PG-13',
    featured: false,
    trending: false,
    popularityScore: 82,
    viewsCount: 9700,
  },
  {
    title: 'The Great Meadow',
    description: 'A lighthearted forest fable following a giant jovial rabbit who defends his idyllic forest clearing against three mischievous critters bent on disturbing the peace.',
    poster: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    releaseYear: 2021,
    duration: 10,
    genres: ['Animation', 'Action'],
    cast: ['Bunny', 'Rinky', 'Gimera'],
    director: 'Sacha Goedegebure',
    rating: 8.4,
    maturityRating: 'ALL',
    featured: false,
    trending: false,
    popularityScore: 88,
    viewsCount: 22000,
  },
  {
    title: 'Shadows in the Mist',
    description: 'A quiet forensic investigator in a secluded coastal village unravels a series of cryptographic ciphers carved into stone piers along the North Sea.',
    poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    releaseYear: 2024,
    duration: 16,
    genres: ['Drama', 'Thriller'],
    cast: ['Mads Mikkelsen', 'Rebecca Ferguson'],
    director: 'Thomas Vinterberg',
    rating: 9.0,
    maturityRating: 'R',
    featured: false,
    trending: true,
    popularityScore: 91,
    viewsCount: 13800,
  },
];

const showsData = [
  {
    title: 'Silicon Chrono',
    description: 'When a distributed computing network gains temporal awareness, a team of quantum engineers must stop historical anomalies from cascading into our timeline.',
    poster: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    releaseYear: 2024,
    seasonsCount: 1,
    genres: ['Sci-Fi', 'Thriller'],
    cast: ['Rami Malek', 'Gemma Chan'],
    director: 'Sam Esmail',
    rating: 8.9,
    maturityRating: 'PG-13',
    featured: true,
    trending: true,
    popularityScore: 95,
  },
  {
    title: 'The Mythic Archives',
    description: 'A global anthology tracing modern encounters with ancient folklore beings living quietly in contemporary metropolises around the globe.',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    releaseYear: 2023,
    seasonsCount: 1,
    genres: ['Fantasy', 'Drama'],
    cast: ['Dev Patel', 'Eva Green'],
    director: 'Guillermo del Toro',
    rating: 8.6,
    maturityRating: 'PG-13',
    featured: false,
    trending: true,
    popularityScore: 88,
  },
];

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Seeding CinePulse Firestore collections...');

    // 1. Seed Genres
    console.log('[Seed] Seeding Genres...');
    for (const genre of genresData) {
      const existing = await dbService.findOne('genres', { slug: genre.slug });
      if (!existing) {
        await dbService.createDoc('genres', genre);
      }
    }

    // 2. Seed Movies
    console.log('[Seed] Seeding Movies...');
    for (const movie of moviesData) {
      const existing = await dbService.findOne('movies', { title: movie.title });
      if (!existing) {
        await dbService.createDoc('movies', movie);
      }
    }

    // 3. Seed TV Shows & Episodes
    console.log('[Seed] Seeding TV Shows & Episodes...');
    for (const showData of showsData) {
      let show = await dbService.findOne('tvShows', { title: showData.title });
      if (!show) {
        show = await dbService.createDoc('tvShows', showData);
      }

      // Check existing episodes for this show
      const existingEpisodes = await dbService.findAll('episodes', { showId: show._id.toString() });
      if (existingEpisodes.length === 0) {
        await Promise.all([
          dbService.createDoc('episodes', {
            showId: show._id.toString(),
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Pilot: The Echo in the Wire',
            description: 'A routine quantum cluster diagnostics check reveals an anomalous echo responding from seven years in the future.',
            thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            duration: 48,
          }),
          dbService.createDoc('episodes', {
            showId: show._id.toString(),
            seasonNumber: 1,
            episodeNumber: 2,
            title: 'Temporal Parallax',
            description: 'As timelines begin to diverge, unexpected memories surface among the research team members.',
            thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            duration: 52,
          }),
          dbService.createDoc('episodes', {
            showId: show._id.toString(),
            seasonNumber: 1,
            episodeNumber: 3,
            title: 'Zero Latency',
            description: 'A high-stakes covert extraction in downtown Zurich tests whether future warnings can truly prevent catastrophes.',
            thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            duration: 46,
          }),
        ]);
      }
    }

    // 4. Seed Admin & Standard Users
    console.log('[Seed] Seeding Users & Multi-Profiles...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123', salt);

    // Admin user
    let adminUser = await dbService.findOne('users', { email: 'admin@cinepulse.io' });
    if (!adminUser) {
      adminUser = await dbService.createDoc('users', {
        name: 'Admin Supervisor',
        email: 'admin@cinepulse.io',
        password: passwordHash,
        role: 'admin',
        profiles: [],
      });

      const adminProfile = await dbService.createDoc('profiles', {
        userId: adminUser._id.toString(),
        name: 'Admin HQ',
        avatar: 'avatar-1',
        maturityRating: 'ALL',
        isKids: false,
      });

      await dbService.updateDoc('users', adminUser._id, {
        profiles: [adminProfile._id],
      });

      await dbService.createDoc('subscriptions', {
        userId: adminUser._id.toString(),
        plan: 'premium',
        status: 'active',
        maxProfiles: 5,
      });
    }

    // Standard demo user with multiple profiles
    let demoUser = await dbService.findOne('users', { email: 'user@cinepulse.io' });
    if (!demoUser) {
      demoUser = await dbService.createDoc('users', {
        name: 'Alex Mercer',
        email: 'user@cinepulse.io',
        password: passwordHash,
        role: 'user',
        profiles: [],
      });

      const profileMain = await dbService.createDoc('profiles', {
        userId: demoUser._id.toString(),
        name: 'Alex',
        avatar: 'avatar-2',
        maturityRating: 'ALL',
        isKids: false,
      });

      const profileCinema = await dbService.createDoc('profiles', {
        userId: demoUser._id.toString(),
        name: 'Sci-Fi Vault',
        avatar: 'avatar-3',
        maturityRating: 'ALL',
        isKids: false,
      });

      const profileKids = await dbService.createDoc('profiles', {
        userId: demoUser._id.toString(),
        name: 'Kids Corner',
        avatar: 'avatar-4',
        maturityRating: 'PG',
        isKids: true,
      });

      await dbService.updateDoc('users', demoUser._id, {
        profiles: [profileMain._id, profileCinema._id, profileKids._id],
      });

      await dbService.createDoc('subscriptions', {
        userId: demoUser._id.toString(),
        plan: 'premium',
        status: 'active',
        maxProfiles: 5,
      });
    }

    console.log('[Seed] Successfully seeded CinePulse Firestore collections!');
    console.log('--- CinePulse Credentials ---');
    console.log('Admin User: admin@cinepulse.io / Password123');
    console.log('Demo User:  user@cinepulse.io  / Password123');
    console.log('-----------------------------');

    return true;
  } catch (err) {
    console.error('[Seed] Database seeding failed:', err);
    throw err;
  }
};

// If run directly via node
if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
