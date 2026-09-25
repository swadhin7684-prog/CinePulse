import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a movie title'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a movie description'],
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
    videoUrl: {
      type: String,
      required: [true, 'Please provide a playable video stream URL'],
    },
    releaseYear: {
      type: Number,
      required: true,
      index: true,
    },
    duration: {
      type: Number, // Duration in minutes
      required: true,
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
      default: 7.5,
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
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for robust full-text search
movieSchema.index({
  title: 'text',
  description: 'text',
  cast: 'text',
  director: 'text',
  genres: 'text',
});

export const Movie = mongoose.model('Movie', movieSchema);
