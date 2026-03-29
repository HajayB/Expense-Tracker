const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { signup, login, logout, profile } = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { signupSchema, loginSchema } = require("../validators/userValidators");

// Rate limiter: max 10 attempts per 15 minutes per IP on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);

// Protected routes
router.post("/logout", protect, logout);
router.get("/profile", protect, profile);

module.exports = router;
