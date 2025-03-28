const User = require("../models/User");
const Diet = require("../models/DietRecommendation");
const Food = require("../models/Food");

function calculateNeeds(weight, height) {
  const bmr = 10 * weight + 6.25 * height - 5 * 25 + 5;
  const dailyCalories = Math.round(bmr * 1.5);
  const protein = Math.round(weight * 1.6);
  const fats = Math.round((0.25 * dailyCalories) / 9);
  const carbs = Math.round((dailyCalories - (protein * 4 + fats * 9)) / 4);
  const waterLiters = Math.max(2, weight * 0.03);
  return { dailyCalories, protein, carbs, fats, waterLiters };
}

async function generateRecommendationForUser(userId) {
  const user = await User.findById(userId);
  const { height, weight } = user;
  if (!height || !weight) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { dailyCalories, protein, carbs, fats, waterLiters } = calculateNeeds(
    weight,
    height
  );

  const foodItems = await Food.find({});
  const meals = [];
  const macroTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 };

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
  return recommendation;
}

module.exports = generateRecommendationForUser;
