const jwt = require("jsonwebtoken");

const createToken = (payload, expiresIn = "7d") =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

const createEmailToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = {
  createToken,
  createEmailToken,
  verifyToken,
};
