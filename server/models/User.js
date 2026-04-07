const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  totalWorkouts: { type: Number, default: 0 },
  strongSessions: { type: Number, default: 0 },
  hardSessions: { type: Number, default: 0 },
  history: [
    {
      date: { type: String },
      score: { type: Number },
      performance: { type: String }, // 'easy', 'normal', 'hard'
      level: { type: Number }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
