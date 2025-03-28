const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, auto: true, index: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  height: { type: Number },
  weight: { type: Number },
  appleId: { type: String },
  googleId: { type: String },
  token: { type: String },
  preferences: { type: Object, default: {} },
  stepTarget: { type: Number },
  dailyCalorieGoal: { type: Number },
  profileCompleted: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);