const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const Food = require("../models/Food");
const Diet = require("../models/DietRecommendation");
const User = require("../models/User");
const generateRecommendationForUser = require("../utils/generateRecommendation");

// Utility to calculate calorie/macro needs
function calculateNeeds(weight, height) {
  const bmr = 10 * weight + 6.25 * height - 5 * 25 + 5; // Mifflin-St Jeor Formula for men
  const dailyCalories = Math.round(bmr * 1.5); // moderate activity
  const protein = Math.round(weight * 1.6); // g/day
  const fats = Math.round((0.25 * dailyCalories) / 9);
  const carbs = Math.round((dailyCalories - (protein * 4 + fats * 9)) / 4);
  const waterLiters = Math.max(2, weight * 0.03);
  return { dailyCalories, protein, carbs, fats, waterLiters };
}

// Generate recommendation (auto-create if not exists)
router.post("/recommend", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { height, weight } = user;

    if (!height || !weight) {
      return res.status(400).json({ message: "Height and weight required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already exists
    const existing = await Diet.findOne({ userId: user._id, date: today });
    if (existing) return res.json(existing);

    const { dailyCalories, protein, carbs, fats, waterLiters } = calculateNeeds(
      weight,
      height
    );

    const foodItems = await Food.find({});
    const meals = [];

    const macroTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    // Group into 4 meals
    for (let i = 0; i < 4; i++) {
      const meal = [];
      let mealCalories = 0;

      while (mealCalories < dailyCalories / 4) {
        const food = foodItems[Math.floor(Math.random() * foodItems.length)];
        const quantityG = 100;
        const cals = food.caloriesPer100g;
        if (!cals) continue;

        mealCalories += cals;
        meal.push({
          name: food.name,
          quantity: food.servingSize || "100g",
          calories: cals,
          protein: food.proteinPer100g,
          carbs: food.carbsPer100g,
          fats: food.fatsPer100g,
        });

        macroTotals.calories += cals;
        macroTotals.protein += food.proteinPer100g;
        macroTotals.carbs += food.carbsPer100g;
        macroTotals.fats += food.fatsPer100g;
      }

      meals.push(...meal);
    }

    const recommendation = new Diet({
      userId: user._id,
      date: today,
      recommendedMeals: meals,
      totalRecommendedCalories: Math.round(macroTotals.calories),
      totalRecommendedProtein: Math.round(macroTotals.protein),
      totalRecommendedCarbs: Math.round(macroTotals.carbs),
      totalRecommendedFats: Math.round(macroTotals.fats),
      waterLiters: parseFloat(waterLiters.toFixed(1)),
    });

    await recommendation.save();
    res.status(201).json(recommendation);
  } catch (err) {
    console.error("Diet generation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get today's diet
router.get("/recommend/today", requireAuth, async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  let recommendation = await Diet.findOne({
    userId: req.user.id,
    date: today,
  });

  if (recommendation) {
    return res.json(recommendation);
  }

  // 🔥 If not found, generate one
  try {
    const generated = await generateRecommendationForUser(req.user.id);
    if (!generated) {
      return res
        .status(500)
        .json({ message: "Failed to generate recommendation" });
    }
    res.json(generated);
  } catch (err) {
    console.error("Diet generation failed:", err);
    res.status(500).json({ message: "Internal error" });
  }
});

module.exports = router;
