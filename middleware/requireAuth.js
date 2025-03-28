const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // Debug

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("User not found for ID:", decoded.id); // Debug
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { id: user._id, email: user.email };
    next();
  } catch (err) {
    console.error("JWT decode error:", err.message);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

module.exports = requireAuth;
