const express = require("express");
const router = express.Router();
// const { requireAuth } = require("../middleware/authMiddleware");
const requireAuth = require("../middleware/requireAuth");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validateRequest");
const User = require("../models/User");
const Step = require("../models/Step");

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

router.put(
  "/profile",
  [
    body("age").isInt({ min: 0 }).optional(),
    body("height").isNumeric().optional(),
    body("weight").isNumeric().optional(),
    body("stepTarget").isInt({ min: 0 }).optional(),
    body("dailyCalorieGoal").isInt({ min: 0 }).optional(),
  ],
  validateRequest,
  requireAuth,
  async (req, res) => {
    const updates = { ...req.body, profileCompleted: true };
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    });
    res.json(user);
  }
);

// GET /api/user/steps?date=YYYY-MM-DD
router.get("/steps", requireAuth, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "Date required" });

  const step = await Step.findOne({
    userId: req.user.id,
    date: new Date(date),
  });

  if (!step) {
    return res.json({
      stepCount: 0,
      caloriesBurned: 0,
      distanceKm: 0,
      timeMinutes: 0,
    });
  }

  const timeMinutes = Math.floor(step.stepCount / 100);

  res.json({ ...step.toObject(), timeMinutes });
});

// GET /api/user/steps/weekly
router.get("/steps/weekly", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const steps = await Step.find({
    userId,
    date: { $gte: start, $lte: today },
  });

  const dayMap = {};
  steps.forEach((entry) => {
    const day = new Date(entry.date).toLocaleDateString("en-US", {
      weekday: "long",
    });
    dayMap[day] = entry.stepCount;
  });

  const orderedDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString("en-US", { weekday: "long" });
    orderedDays.push({ day: label, stepCount: dayMap[label] || 0 });
  }

  res.json(orderedDays);
});

// POST /api/user/steps
router.post("/steps", requireAuth, async (req, res) => {
  const { date, stepCount, caloriesBurned, distanceKm } = req.body;

  if (!date || stepCount === undefined) {
    return res.status(400).json({ message: "Missing date or step count" });
  }

  const existing = await Step.findOne({
    userId: req.user.id,
    date: new Date(date),
  });

  if (existing) {
    existing.stepCount = stepCount;
    existing.caloriesBurned = caloriesBurned || 0;
    existing.distanceKm = distanceKm || 0;
    await existing.save();
    return res.json({ message: "Step data updated" });
  }

  const newStep = new Step({
    userId: req.user.id,
    date: new Date(date),
    stepCount,
    caloriesBurned,
    distanceKm,
  });

  await newStep.save();
  res.status(201).json({ message: "Step data created" });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) return res.status(400).json({ message: "Incorrect password" });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password changed successfully" });
});

router.delete("/delete-account", requireAuth, async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.clearCookie("token");
  res.json({ message: "Account deleted" });
});

// GET current user profile
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

// UPDATE profile (excluding email & name)
router.put(
  "/edit-profile",
  [
    body("age").optional().isInt({ min: 0 }),
    body("height").optional().isFloat({ min: 0 }),
    body("weight").optional().isFloat({ min: 0 }),
    body("stepTarget").optional().isInt({ min: 0 }),
    body("dailyCalorieGoal").optional().isInt({ min: 0 }),
    body("preferences").optional().isObject(),
  ],
  validateRequest,
  requireAuth,
  async (req, res) => {
    const allowedFields = [
      "age",
      "height",
      "weight",
      "stepTarget",
      "dailyCalorieGoal",
      "preferences",
    ];
    const updates = {};
    for (let field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    });
    res.json(user);
  }
);

// Change Password
router.post(
  "/change-password",
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  validateRequest,
  requireAuth,
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const bcrypt = require("bcryptjs");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated successfully" });
  }
);

// Delete Account
router.delete("/delete-account", requireAuth, async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.clearCookie("token");
  res.json({ message: "Account deleted" });
});

module.exports = router;

router.get("/auth-test", requireAuth, (req, res) => {
  res.json({ success: true, userId: req.user.id });
});

module.exports = router;
