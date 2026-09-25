import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const fetchFromAPI = (path, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

const postToAPI = (path, body) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

const inspect = async () => {
  console.log('\n================== CINEPULSE LIVE DATABASE INSPECTOR ==================');
  
  try {
    // Attempt connecting to running backend API server
    const health = await fetchFromAPI('/api/health');

    if (health.success) {
      console.log(`[Status] Connected to live API server on port ${process.env.PORT || 5000}`);
      
      // Login as admin to get full analytics and users
      const adminLogin = await postToAPI('/api/auth/login', {
        email: 'admin@cinepulse.io',
        password: 'Password123',
      });

      const adminToken = adminLogin.data?.token;

      // 1. Fetch Analytics & Counts
      const analyticsRes = await fetchFromAPI('/api/admin/analytics', {
        Authorization: `Bearer ${adminToken}`,
      });
      const a = analyticsRes.data || {};

      console.log('\n--- LIVE DATABASE COLLECTION COUNTS ---');
      console.log(`• Users (Accounts):     ${a.totalUsers || 0}`);
      console.log(`• Feature Movies:       ${a.totalMovies || 0}`);
      console.log(`• TV Shows (Series):    ${a.totalShows || 0}`);
      console.log(`• Episodes:             ${a.totalEpisodes || 0}`);
      console.log(`• Total Streams Logged: ${a.totalStreams || 0}`);

      // 2. Fetch Users List
      const usersRes = await fetchFromAPI('/api/admin/users', {
        Authorization: `Bearer ${adminToken}`,
      });
      const users = usersRes.data?.users || [];
      console.log('\n--- REGISTERED USERS & PROFILES ---');
      users.forEach((u, i) => {
        const profNames = (u.profiles || []).map((p) => p.name).join(', ') || 'Default';
        console.log(`${i + 1}. [${u.role.toUpperCase()}] ${u.name} <${u.email}>`);
        console.log(`   Profiles: [${profNames}] | Member since: ${new Date(u.createdAt).toLocaleDateString()}`);
      });

      // 3. Fetch Movies
      const moviesRes = await fetchFromAPI('/api/movies?limit=8');
      const movies = moviesRes.data?.items || [];
      console.log('\n--- FEATURE MOVIES IN CATALOG ---');
      movies.forEach((m, i) => {
        console.log(`${i + 1}. "${m.title}" (${m.releaseYear})`);
        console.log(`   Rating: ${m.rating} ★ | Views: ${m.viewsCount} | Genres: ${m.genres?.join(', ')} | Maturity: ${m.maturityRating}`);
      });

      // 4. Fetch TV Shows
      const showsRes = await fetchFromAPI('/api/movies/shows');
      const shows = showsRes.data?.items || [];
      console.log('\n--- TV SHOWS IN CATALOG ---');
      shows.forEach((s, i) => {
        console.log(`${i + 1}. "${s.title}" (${s.releaseYear}) - ${s.seasonsCount} Season(s)`);
      });

      console.log('\n========================================================================\n');
      process.exit(0);
    }
  } catch (err) {
    console.log('[Notice] API server not responding directly, checking Mongoose direct connection...');
    await connectDB();
    const movieCount = await Movie.countDocuments();
    const userCount = await User.countDocuments();
    console.log(`Direct DB Connection -> Movies: ${movieCount}, Users: ${userCount}`);
    process.exit(0);
  }
};

inspect();
