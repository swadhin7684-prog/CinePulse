import app from './app.js';
import { connectDB } from './config/db.js';
import { Movie } from './models/Movie.js';
import { seedDatabase } from './utils/seedData.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Check if initial seed is needed
    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      console.log('[Server] Database is empty. Running initial seed...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` CinePulse API Server running on port: ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
      console.log(` Environment:  ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('[Server] Failed to initialize server:', err);
    process.exit(1);
  }
};

startServer();
