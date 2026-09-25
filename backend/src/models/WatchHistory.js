import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'contentModel',
    },
    contentModel: {
      type: String,
      required: true,
      enum: ['Movie', 'Episode'],
      default: 'Movie',
    },
    contentType: {
      type: String,
      enum: ['movie', 'episode', 'show'],
      default: 'movie',
    },
    currentTime: {
      type: Number, // Seconds into playback
      default: 0,
      min: 0,
    },
    duration: {
      type: Number, // Total duration in seconds
      default: 0,
      min: 0,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

watchHistorySchema.index({ profileId: 1, contentId: 1 }, { unique: true });

export const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);
