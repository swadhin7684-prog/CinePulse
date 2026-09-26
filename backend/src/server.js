import app from './app.js';
import * as dbService from './services/firestoreDb.js';
import { seedDatabase } from './utils/seedData.js';
import { isLiveFirestore } from './config/firebase.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Check if initial seed is needed
    const movieCount = await dbService.count('movies');
    if (movieCount === 0) {
      console.log('[Server] Firestore database is empty. Running initial seed...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` CinePulse API Server running on port: ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
      console.log(` Database:     Firebase Firestore (${isLiveFirestore ? 'Google Cloud' : 'Dev Mode'})`);
      console.log(` Environment:  ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('[Server] Failed to initialize server:', err);
    process.exit(1);
  }
};

startServer();
