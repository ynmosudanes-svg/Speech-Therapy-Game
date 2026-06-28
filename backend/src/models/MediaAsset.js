const mongoose = require('mongoose');

const mediaAssetSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['image', 'audio', 'video', 'unknown'],
      default: 'unknown',
      index: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaFolder',
    },
    source: {
      type: String,
      default: 'upload',
      trim: true,
    },
    createdBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);
