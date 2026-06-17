const mongoose = require('mongoose');

const gameOptionSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, default: '' },
    textAr: { type: String, trim: true, default: '' },
    label: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
);

const gameItemSchema = new mongoose.Schema(
  {
    image: { type: String, trim: true, default: '' },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
);

const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameAr: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    titleAr: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      required: true,
      enum: [
        'listen_choose',
        'action_drag_drop',
        'matching.similar',
        'matching.different',
        'matching.find',
        'matching.shadow',
        'sequence.order',
        'action.drag_to_target',
        'navigation.move_to_target',
        'navigation.maze',
        'text.missing_word',
        'cards.audio_flashcards',
        'puzzle.jigsaw',
        'matching.connect',
      ],
    },
    level: {
      type: Number,
      required: true,
      min: 1,
    },
    questionText: {
      type: String,
      trim: true,
      default: '',
    },
    questionTextAr: {
      type: String,
      trim: true,
      default: '',
    },
    questionAudio: {
      type: String,
      trim: true,
      default: '',
    },
    instructionText: {
      type: String,
      trim: true,
      default: '',
    },
    instructionTextAr: {
      type: String,
      trim: true,
      default: '',
    },
    instructionAudio: {
      type: String,
      trim: true,
      default: '',
    },
    targetImage: {
      type: String,
      trim: true,
      default: '',
    },
    options: {
      type: [gameOptionSchema],
      default: [],
    },
    items: {
      type: [gameItemSchema],
      default: [],
    },
    successSound: {
      type: String,
      trim: true,
      default: '',
    },
    failSound: {
      type: String,
      trim: true,
      default: '',
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

gameSchema.pre('validate', function syncNaming(next) {
  if (!this.title) this.title = this.name;
  if (!this.name) this.name = this.title;
  if (!this.titleAr) this.titleAr = this.nameAr || '';
  if (!this.nameAr) this.nameAr = this.titleAr || '';
  next();
});

module.exports = mongoose.model('Game', gameSchema);
