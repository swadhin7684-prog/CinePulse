import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinepulse';

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 4000,
    };

    cached.promise = mongoose.connect(uri, opts)
      .then((m) => {
        console.log(`[DB] Connected successfully to MongoDB at: ${m.connection.host}`);
        return m;
      })
      .catch(async (initialErr) => {
        // In local development without MongoDB daemon, spin up embedded engine
        if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
          console.warn(`[DB] Direct connection to ${uri} failed: ${initialErr.message}`);
          console.log('[DB] Initializing embedded MongoDB engine for seamless development environment...');

          const { MongoMemoryServer } = await import('mongodb-memory-server');
          const mongod = await MongoMemoryServer.create({
            instance: { dbName: 'cinepulse' },
          });
          const memoryUri = mongod.getUri();
          const m = await mongoose.connect(memoryUri);
          console.log(`[DB] Embedded MongoDB running and connected at: ${memoryUri}`);
          return m;
        } else {
          console.error(`[DB] Production MongoDB Connection Error: ${initialErr.message}`);
          throw initialErr;
        }
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
};
