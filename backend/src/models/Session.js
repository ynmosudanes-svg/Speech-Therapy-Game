const mongoose = require('mongoose');
const { PROMPT_LEVELS } = require('../constants/promptLevels');

const sessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    attempts: {
      type: Number,
      required: true,
      min: 1,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    sessionType: {
      type: String,
      enum: ['clinic', 'home'],
      required: true,
    },
    promptLevel: {
      type: String,
      enum: PROMPT_LEVELS,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Session', sessionSchema);
