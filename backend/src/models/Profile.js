import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a profile name'],
      trim: true,
      maxlength: [30, 'Profile name cannot exceed 30 characters'],
    },
    avatar: {
      type: String,
      default: 'avatar-1',
    },
    language: {
      type: String,
      default: 'en',
    },
    maturityRating: {
      type: String,
      enum: ['ALL', 'PG', 'PG-13', 'R', 'NC-17'],
      default: 'ALL',
    },
    isKids: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Profile = mongoose.model('Profile', profileSchema);
