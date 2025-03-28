const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const {
  createEmailToken,
  verifyToken,
  createToken,
} = require("../utils/tokenUtils");
const { sendVerificationEmail, sendResetEmail } = require("../utils/email");

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already in use" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    await user.save();
    const emailToken = createEmailToken({ userId: user._id });
    await sendVerificationEmail(user.email, emailToken);
    res
      .status(201)
      .json({ message: "User registered. Check email to verify account." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ message: "Invalid token" });
    if (user.isVerified) return res.json({ message: "Email already verified" });
    user.isVerified = true;
    await user.save();
    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("LOGIN REQUEST:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password does not match");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // if (!user.isVerified) {
    //   console.log("User not verified");
    //   return res
    //     .status(403)
    //     .json({ message: "Please verify your email first" });
    // }

    const token = createToken({ id: user._id });
    console.log("Token created:", token);
    user.token = token;
    await user.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log("Login successful");
    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user || !await bcrypt.compare(password, user.password)) return res.status(400).json({ message: 'Invalid credentials' });
//     if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });
//     const token = createToken({ id: user._id });
//     user.token = token;
//     await user.save();
//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });
//     res.json({ message: 'Login successful', token });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

exports.socialLogin = async (req, res) => {
  try {
    const { email, firstName, lastName, socialId, provider } = req.body;
    if (!["google", "apple"].includes(provider))
      return res.status(400).json({ message: "Invalid provider" });
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        firstName,
        lastName,
        isVerified: true,
        [`${provider}Id`]: socialId,
      });
    } else {
      user[`${provider}Id`] = socialId;
    }
    const token = createToken({ id: user._id });
    user.token = token;
    await user.save();
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: `${provider} login successful`, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    const link = `${process.env.CLIENT_URL}/reset-password?token=${token}&email=${email}`;
    await sendResetEmail(email, link);
    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
