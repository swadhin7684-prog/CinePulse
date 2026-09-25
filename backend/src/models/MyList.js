import mongoose from 'mongoose';

const myListSchema = new mongoose.Schema(
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
      enum: ['Movie', 'TVShow'],
      default: 'Movie',
    },
    contentType: {
      type: String,
      enum: ['movie', 'show'],
      default: 'movie',
    },
    addedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

myListSchema.index({ profileId: 1, contentId: 1 }, { unique: true });

export const MyList = mongoose.model('MyList', myListSchema);
