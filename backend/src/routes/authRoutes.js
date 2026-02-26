const express = require("express");
const router = express.Router();
const { requestOtp, verifyOtp, getMe, updateProfile } = require("../controllers/authController");
const { authenticate, requireAuth } = require("../middleware/auth");

// Public
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

// Protected
router.get("/me", authenticate, requireAuth, getMe);
router.patch("/profile", authenticate, requireAuth, updateProfile);

module.exports = router;
