import mongoose from 'mongoose';

const episodeSchema = new mongoose.Schema(
  {
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TVShow',
      required: true,
      index: true,
    },
    seasonNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    episodeNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide an episode title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      required: [true, 'Please provide an episode video stream URL'],
    },
    duration: {
      type: Number, // In minutes
      required: true,
      default: 45,
    },
  },
  {
    timestamps: true,
  }
);

episodeSchema.index({ showId: 1, seasonNumber: 1, episodeNumber: 1 }, { unique: true });

export const Episode = mongoose.model('Episode', episodeSchema);
