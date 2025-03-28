const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (to, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Verify Your EatFitGo Account",
    html: `<h2>Welcome to EatFitGo</h2><p>Click <a href="${link}">here</a> to verify your email.</p>`,
  });
};

const sendResetEmail = async (to, link) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Reset Your EatFitGo Password",
    html: `<h2>Password Reset</h2><p>Click <a href="${link}">here</a> to reset your password.</p>`,
  });
};

module.exports = { sendVerificationEmail, sendResetEmail };