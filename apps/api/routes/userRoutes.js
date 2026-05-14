const express = require("express");
const router = express.Router();
const {
  createUser,
  loginUser,
  getEligibleSchemes,
  getUserProfile,
  clearEligibleSchemesCache,
} = require("../controllers/userController");

// Authentication routes
router.post("/login", loginUser);
router.post("/register", createUser);

// User routes
router.post("/", createUser); // Keep for backward compatibility
router.get("/:id", getUserProfile);
router.get("/:id/schemes", getEligibleSchemes);
router.delete("/:id/schemes/cache", clearEligibleSchemesCache);

module.exports = router;

//  
