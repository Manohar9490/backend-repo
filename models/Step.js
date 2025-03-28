const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  stepCount: { type: Number, required: true },
  caloriesBurned: { type: Number, default: 0 },
  distanceKm: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

stepSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Step", stepSchema);
