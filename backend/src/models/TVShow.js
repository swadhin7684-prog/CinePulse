import mongoose from 'mongoose';

const tvShowSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a TV show title'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a TV show description'],
    },
    poster: {
      type: String,
      required: true,
    },
    backdrop: {
      type: String,
      required: true,
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    releaseYear: {
      type: Number,
      required: true,
      index: true,
    },
    seasonsCount: {
      type: Number,
      default: 1,
    },
    genres: [
      {
        type: String,
        trim: true,
        index: true,
      },
    ],
    cast: [
      {
        type: String,
        trim: true,
      },
    ],
    director: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 8.0,
      min: 0,
      max: 10,
    },
    maturityRating: {
      type: String,
      enum: ['ALL', 'G', 'PG', 'PG-13', 'R', 'NC-17'],
      default: 'PG-13',
    },
    language: {
      type: String,
      default: 'en',
    },
    country: {
      type: String,
      default: 'USA',
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    trending: {
      type: Boolean,
      default: false,
      index: true,
    },
    popularityScore: {
      type: Number,
      default: 50,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

tvShowSchema.index({
  title: 'text',
  description: 'text',
  cast: 'text',
  director: 'text',
  genres: 'text',
});

export const TVShow = mongoose.model('TVShow', tvShowSchema);
