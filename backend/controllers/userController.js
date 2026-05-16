const prisma = require("../db/prisma");
const { searchGovernmentSchemes, generateRecommendation } = require("../services/aiService");
const { getCachedSchemes, setCachedSchemes, clearCachedSchemes } = require("../services/schemeStore");
const hybridRetrievalService = require("../services/hybridRetrievalService");
const aiSchemeParserService = require("../services/aiSchemeParserService");
const { filterEligibleSchemesBySQL, countEligibleSchemes } = require("../eligibility/eligibilityEngine");

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
    const useHybrid = req.query.hybrid !== "false"; // Default to true
    const query = req.query.query || null;
    const limit = parseInt(req.query.limit) || 20;

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

    // Check cache if not forcing refresh
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
          updatedAt: cachedResult.updatedAt,
          method: cachedResult.method || 'legacy'
        });
      }
    }

    console.log(`Searching schemes for user: ${user.id} (method: ${useHybrid ? 'hybrid' : 'legacy'})`);

    let schemes, metadata, method;

    if (useHybrid) {
      // Use hybrid retrieval (SQL filtering + vector search)
      // Enable auto-scraping and chatbot fallback
      const result = await hybridRetrievalService.hybridSearch(user, query, {
        limit,
        enableAutoScraping: true,
        enableChatbotFallback: true
      });
      
      schemes = result.schemes;
      metadata = result.metadata;
      method = result.metadata?.method || 'hybrid';

      // Handle AI chatbot fallback response
      if (result.aiRecommendations) {
        // AI chatbot was used as fallback
        return res.json({
          user: {
            name: user.name,
            age: user.age,
            state: user.state,
            occupation: user.occupation,
            category: user.category,
            annualIncome: user.annualIncome
          },
          schemes: [],
          parsedSchemes: result.parsedSchemes || [],
          aiRecommendations: result.aiRecommendations,
          metadata,
          cached: false,
          updatedAt: new Date().toISOString(),
          method: 'ai-chatbot-fallback',
          message: 'No schemes found in database. AI-generated recommendations provided.'
        });
      }

      // Generate AI recommendation based on hybrid results
      if (schemes.length > 0) {
        const schemesText = schemes.map(s =>
          `${s.schemeName}: ${s.description || ''}`
        ).join('\n\n');
        
        const recommendation = await generateRecommendation(user, schemesText);
        metadata.aiRecommendation = recommendation;
      }
    } else {
      // Legacy: Use AI to search for eligible government schemes
      schemes = await searchGovernmentSchemes(user);
      method = 'legacy';
      metadata = { method: 'legacy' };
    }

    // Cache the results
    const cacheEntry = setCachedSchemes(user.id, { schemes, metadata, method });

    res.json({
      user: {
        name: user.name,
        age: user.age,
        state: user.state,
        occupation: user.occupation,
        category: user.category,
        annualIncome: user.annualIncome
      },
      schemes,
      metadata,
      cached: false,
      updatedAt: cacheEntry.updatedAt,
      method
    });

  } catch (err) {
    console.error("Get Eligible Schemes Error:", err);
    console.error("Error stack:", err.stack);
    
    // Even on error, try to provide AI recommendations as fallback
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id }
      });
      
      if (user) {
        console.log("Attempting AI fallback due to error...");
        const aiService = require("../services/aiService");
        const aiRecommendations = await aiService.generateRecommendation(user, "");
        const parsedSchemes = aiSchemeParserService.parseForDisplay(aiRecommendations);
        
        return res.json({
          user: {
            name: user.name,
            age: user.age,
            state: user.state,
            occupation: user.occupation,
            category: user.category,
            annualIncome: user.annualIncome
          },
          schemes: [],
          parsedSchemes,
          aiRecommendations,
          metadata: {
            method: 'ai-chatbot-fallback-error',
            fallbackUsed: 'ai-chatbot',
            totalRetrieved: parsedSchemes.length,
            totalParsed: parsedSchemes.length,
            error: err.message,
            message: 'Error occurred during scheme retrieval. AI-generated recommendations provided.'
          },
          cached: false,
          updatedAt: new Date().toISOString(),
          method: 'ai-chatbot-fallback-error'
        });
      }
    } catch (fallbackErr) {
      console.error("AI fallback also failed:", fallbackErr);
    }
    
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

async function getPersonalizedRecommendations(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;

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

    console.log(`Getting personalized recommendations for user: ${user.id}`);

    // Get personalized recommendations using hybrid retrieval
    const result = await hybridRetrievalService.getPersonalizedRecommendations(user, { limit });

    res.json(result);

  } catch (err) {
    console.error("Get Personalized Recommendations Error:", err);
    res.status(500).json({
      error: err.message || "Failed to fetch personalized recommendations"
    });
  }
}

async function searchSchemes(req, res) {
  try {
    const { query } = req.body;
    const limit = parseInt(req.query.limit) || 20;

    if (!query) {
      return res.status(400).json({
        error: "Search query is required"
      });
    }

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

    console.log(`Searching schemes for user ${user.id} with query: "${query}"`);

    // Perform hybrid search with custom query
    const result = await hybridRetrievalService.hybridSearch(user, query, { limit });

    res.json(result);

  } catch (err) {
    console.error("Search Schemes Error:", err);
    res.status(500).json({
      error: err.message || "Failed to search schemes"
    });
  }
}

async function getEligibilityStats(req, res) {
  try {
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

    // Get eligibility statistics
    const eligibleCount = await countEligibleSchemes(user);
    const totalSchemes = await prisma.scheme.count();

    res.json({
      userId: user.id,
      totalSchemes,
      eligibleSchemes: eligibleCount,
      eligibilityRate: totalSchemes > 0
        ? ((eligibleCount / totalSchemes) * 100).toFixed(2)
        : 0,
      userProfile: {
        state: user.state,
        occupation: user.occupation,
        category: user.category,
        age: user.age,
        annualIncome: user.annualIncome
      }
    });

  } catch (err) {
    console.error("Get Eligibility Stats Error:", err);
    res.status(500).json({
      error: err.message || "Failed to fetch eligibility statistics"
    });
  }
}

module.exports = {
  createUser,
  loginUser,
  getEligibleSchemes,
  getUserProfile,
  clearEligibleSchemesCache,
  getPersonalizedRecommendations,
  searchSchemes,
  getEligibilityStats
};

//  
