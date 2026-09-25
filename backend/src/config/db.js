import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinepulse';

  try {
    // Attempt standard connection with 3-second server selection timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[DB] Connected successfully to MongoDB at: ${mongoose.connection.host}`);
  } catch (initialErr) {
    console.warn(`[DB] Direct connection to ${uri} failed: ${initialErr.message}`);
    console.log('[DB] Initializing embedded MongoDB engine for seamless development environment...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'cinepulse',
        },
      });
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Embedded MongoDB running and connected at: ${memoryUri}`);
    } catch (memErr) {
      console.error(`[DB] Critical: Failed to initialize embedded MongoDB: ${memErr.message}`);
      throw memErr;
    }
  }
};
