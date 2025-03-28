const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

router.post('/register', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name required'),
  body('lastName').notEmpty().withMessage('Last name required'),
], validateRequest, auth.register);

router.get('/verify-email', auth.verifyEmail);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], validateRequest, auth.login);

router.post('/social-login', auth.socialLogin);
router.post('/logout', auth.logout);

router.post('/request-password-reset', [
  body('email').isEmail().withMessage('Valid email required'),
], validateRequest, auth.requestPasswordReset);

router.post('/reset-password', [
  body('email').isEmail().withMessage('Valid email required'),
  body('token').notEmpty().withMessage('Token required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
], validateRequest, auth.resetPassword);

module.exports = router;