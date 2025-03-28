// seedFood.js

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const Food = require("./models/Food");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const seedFood = async () => {
  try {
    await connectDB();

    const filePath = path.join(__dirname, "food_data.json");
    const foodJson = fs.readFileSync(filePath, "utf-8");
    const foodItems = JSON.parse(foodJson);

    // Remove existing data
    await Food.deleteMany({});
    console.log("Cleared existing food data");

    // Save new data (convert _id strings to ObjectId-like format)
    const formattedItems = foodItems.map(({ _id, ...rest }) => ({ ...rest }));
    await Food.insertMany(formattedItems);
    console.log("Food items seeded:", formattedItems.length);

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
};

seedFood();
