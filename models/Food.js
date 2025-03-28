const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  caloriesPer100g: Number,
  proteinPer100g: Number,
  carbsPer100g: Number,
  fatsPer100g: Number,
  servingSize: String,
  dietType: String,
});

const Food = mongoose.model("Food", foodSchema);
module.exports = Food;
