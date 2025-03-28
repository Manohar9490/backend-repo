const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
  name: String,
  quantity: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
});

const dietRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true },
    recommendedMeals: [mealSchema],
    totalRecommendedCalories: Number,
    totalRecommendedProtein: Number,
    totalRecommendedCarbs: Number,
    totalRecommendedFats: Number,
    waterLiters: Number,
    feedback: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DietRecommendation", dietRecommendationSchema);
