require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const userRoutes = require("./routes/userRoutes");
const { sendEmail } = require("./notifications/emailService");

const app = express();

// CORS configuration - MUST be before routes
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// User routes
app.use("/api/users", userRoutes);

// Chat endpoint for AI recommendations
app.post("/api/chat", async (req, res) => {
  try {
    const prompt = req.body.message;

    if (!prompt) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY not configured"
      });
    }

    console.log("Calling Gemini API...");

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `
You are an Indian Government Scheme Eligibility AI Assistant.

Help users discover:
- Central government schemes
- State government schemes
- Scholarships
- Pension schemes
- Farmer schemes

User Query:
${prompt}

Provide:
1. Relevant schemes
2. Eligibility criteria
3. Benefits
4. Required documents
5. Application process

Format your response in a clear, structured manner with proper headings and bullet points.
`
              }
            ]
          }
        ]
      }
    );

    const reply = response.data.candidates[0].content.parts[0].text;

    res.json({ reply });

  } catch (err) {
    console.error("Chat API Error:", err.response?.data || err.message);

    res.status(500).json({
      error: err.response?.data?.error?.message || err.message || "Failed to generate response"
    });
  }
});

// Test email endpoint
app.get("/test-email", async (req, res) => {
  try {
    await sendEmail(
      "test@example.com",
      [
        {
          schemeName: "PM Kisan Samman Nidhi"
        }
      ]
    );

    res.json({ message: "Email sent successfully" });

  } catch (err) {
    console.error("Email Error:", err);
    res.status(500).json({
      error: err.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    error: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

//  
