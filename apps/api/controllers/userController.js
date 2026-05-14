const prisma = require("../db/prisma");
const { searchGovernmentSchemes } = require("../services/aiService");
const { getCachedSchemes, setCachedSchemes, clearCachedSchemes } = require("../services/schemeStore");

// Helper function to generate username from name
function generateUsername(name) {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${randomNum}`;
}

// Helper function to generate temporary password
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createUser(req, res) {
  try {
    // Validate required fields
    const { name, age, gender, state, occupation, annualIncome, category } = req.body;
    
    if (!name || !age || !gender || !state || !occupation || !annualIncome || !category) {
      return res.status(400).json({
        error: "Missing required fields: name, age, gender, state, occupation, annualIncome, category"
      });
    }

    // Generate username and password
    let username = generateUsername(name);
    const password = generatePassword();

    // Ensure username is unique
    let existingUser = await prisma.user.findUnique({ where: { username } });
    while (existingUser) {
      username = generateUsername(name);
      existingUser = await prisma.user.findUnique({ where: { username } });
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name,
        email: req.body.email || null,
        username,
        password, // In production, this should be hashed
        age: parseInt(age),
        gender,
        state,
        occupation,
        annualIncome: parseInt(annualIncome),
        category,
        familySize: req.body.familySize ? parseInt(req.body.familySize) : null
      },
    });

    console.log("User created:", user.id);
    
    // Return user with credentials
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      password: password, // Send password only once during registration
      message: "Profile created successfully! Please save your credentials."
    });

  } catch (err) {
    console.error("Create User Error:", err);
    res.status(500).json({
      error: err.message || "Failed to create user"
    });
  }
}

async function loginUser(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required"
      });
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password"
      });
    }

    // Check password (in production, use bcrypt.compare)
    if (user.password !== password) {
      return res.status(401).json({
        error: "Invalid username or password"
      });
    }

    // Return user data (excluding password)
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      message: "Login successful"
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      error: err.message || "Failed to login"
    });
  }
}

async function getEligibleSchemes(req, res) {
  try {
    const forceRefresh = req.query.refresh === "true";

    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    if (!forceRefresh) {
      const cachedResult = getCachedSchemes(user.id);

      if (cachedResult?.schemes) {
        return res.json({
          user: {
            name: user.name,
            age: user.age,
            state: user.state,
            occupation: user.occupation
          },
          schemes: cachedResult.schemes,
          cached: true,
          updatedAt: cachedResult.updatedAt
        });
      }
    }

    console.log("Searching schemes for user:", user.id);

    // Use AI to search for eligible government schemes
    const schemes = await searchGovernmentSchemes(user);
    const cacheEntry = setCachedSchemes(user.id, schemes);

    res.json({
      user: {
        name: user.name,
        age: user.age,
        state: user.state,
        occupation: user.occupation
      },
      schemes,
      cached: false,
      updatedAt: cacheEntry.updatedAt
    });

  } catch (err) {
    console.error("Get Eligible Schemes Error:", err);
    res.status(500).json({
      error: err.message || "Failed to fetch eligible schemes"
    });
  }
}

async function getUserProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        age: true,
        gender: true,
        state: true,
        occupation: true,
        annualIncome: true,
        category: true,
        familySize: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json(user);

  } catch (err) {
    console.error("Get User Profile Error:", err);
    res.status(500).json({
      error: err.message || "Failed to fetch user profile"
    });
  }
}

async function clearEligibleSchemesCache(req, res) {
  try {
    clearCachedSchemes(req.params.id);

    res.json({
      message: "Eligible schemes cache cleared"
    });
  } catch (err) {
    console.error("Clear Eligible Schemes Cache Error:", err);
    res.status(500).json({
      error: err.message || "Failed to clear schemes cache"
    });
  }
}

module.exports = {
  createUser,
  loginUser,
  getEligibleSchemes,
  getUserProfile,
  clearEligibleSchemesCache,
};

//  
