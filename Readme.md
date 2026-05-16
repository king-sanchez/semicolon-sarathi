# Government Scheme Backend - Architecture & Working

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Key Features](#key-features)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [Retrieval System](#retrieval-system)
10. [Fallback Mechanisms](#fallback-mechanisms)
11. [Deployment](#deployment)

---

## System Overview

This is an AI-powered government scheme recommendation system that helps Indian citizens discover eligible government schemes (Central and State) based on their profile. The system uses a sophisticated **hybrid retrieval architecture** combining deterministic SQL filtering with semantic vector search for optimal accuracy and relevance.

### Key Capabilities
- **Personalized Recommendations**: Matches users with eligible schemes based on age, income, state, occupation, and category
- **Semantic Search**: Uses AI embeddings for contextual understanding of user queries
- **Auto-Scraping**: Automatically expands knowledge base when no schemes are found
- **Multi-Level Fallbacks**: Ensures users always get recommendations through intelligent fallback mechanisms
- **Real-time Chat**: AI-powered chatbot for scheme discovery and guidance

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                    (Frontend Application)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│                      (Express.js Server)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ User Routes  │  │ Chat Routes  │  │ Health Check │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    CONTROLLER LAYER                              │
│                   (Business Logic)                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           User Controller                                 │  │
│  │  • createUser()      • loginUser()                       │  │
│  │  • getEligibleSchemes()  • searchSchemes()               │  │
│  │  • getPersonalizedRecommendations()                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     SERVICE LAYER                                │
│                  (Core Business Logic)                           │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Hybrid Retrieval Service (MAIN ENGINE)          │   │
│  │                                                           │   │
│  │  Stage 1: SQL Eligibility Filtering                     │   │
│  │  ├─ buildEligibilityFilter()                            │   │
│  │  └─ filterEligibleSchemes()                             │   │
│  │                                                           │   │
│  │  Stage 2: Semantic Vector Retrieval                     │   │
│  │  ├─ semanticRetrieval()                                 │   │
│  │  └─ rerankSchemes()                                     │   │
│  │                                                           │   │
│  │  Fallback Workflows:                                     │   │
│  │  ├─ Auto-Scraping (when no schemes found)               │   │
│  │  └─ AI Chatbot (when scraping fails)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Embedding   │  │   Vector     │  │  Eligibility │         │
│  │   Service    │  │   Search     │  │    Engine    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auto-Scraping│  │  AI Service  │  │  AI Parser   │         │
│  │   Service    │  │  (Gemini)    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      DATA LAYER                                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                         │   │
│  │                                                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │   │
│  │  │  Users   │  │ Schemes  │  │  SchemeEmbeddings    │  │   │
│  │  │  Table   │  │  Table   │  │  (pgvector)          │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────────┘  │   │
│  │                                                           │   │
│  │  Indexes: state, occupation, category, age, income      │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Google Gemini│  │  MyScheme    │  │   Nodemailer │         │
│  │  AI API      │  │  Gov Portal  │  │   (Email)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. **Hybrid Retrieval Service** (`services/hybridRetrievalService.js`)
The heart of the system - combines deterministic and semantic search.

**Stage 1: SQL Eligibility Filtering**
- Filters schemes based on structured criteria (state, age, income, occupation, category)
- Uses PostgreSQL indexes for fast querying
- Reduces search space to only eligible schemes

**Stage 2: Semantic Vector Retrieval**
- Performs vector similarity search on eligible schemes
- Uses 3072-dimensional embeddings (Gemini embedding model)
- Ranks results by semantic relevance to user query

**Key Methods:**
- `hybridSearch()` - Main entry point for scheme retrieval
- `filterEligibleSchemes()` - SQL-based eligibility filtering
- `semanticRetrieval()` - Vector similarity search
- `getPersonalizedRecommendations()` - Profile-based recommendations

### 2. **Eligibility Engine** (`eligibility/eligibilityEngine.js`)
Deterministic rule-based filtering system.

**Features:**
- SQL-based filtering with indexed columns
- Supports complex eligibility rules (age ranges, income limits, state/category matching)
- Efficient query building with Prisma ORM

**Key Methods:**
- `buildEligibilityWhereClause()` - Constructs SQL WHERE conditions
- `filterEligibleSchemesBySQL()` - Executes filtered query
- `countEligibleSchemes()` - Returns count of eligible schemes
- `getEligibleSchemeIds()` - Returns only IDs for hybrid retrieval

### 3. **Embedding Service** (`services/embeddingService.js`)
Generates vector embeddings for semantic search.

**Features:**
- Uses Google Gemini `gemini-embedding-2` model
- Generates 3072-dimensional embeddings
- Batch processing support
- Combines multiple scheme fields for comprehensive representation

**Key Methods:**
- `generateEmbedding()` - Single text embedding
- `generateBatchEmbeddings()` - Batch processing
- `generateSchemeEmbedding()` - Scheme-specific embedding
- `generateQueryEmbedding()` - User query embedding with context

### 4. **Vector Search Service** (`services/vectorSearchService.js`)
Performs semantic similarity search using pgvector.

**Features:**
- Cosine similarity search using PostgreSQL pgvector extension
- Configurable similarity thresholds
- Result reranking based on additional criteria
- Filters by eligible scheme IDs

### 5. **Auto-Scraping Service** (`services/autoScrapingService.js`)
Automatically expands knowledge base when no schemes are found.

**Features:**
- Scrapes from MyScheme.gov.in and state portals
- Triggered automatically when no eligible schemes found
- Parses and stores schemes with AI assistance
- Generates embeddings for newly scraped schemes

### 6. **AI Service** (`services/aiService.js`)
Integrates with Google Gemini for AI-powered recommendations.

**Features:**
- Generates comprehensive scheme recommendations
- Provides personalized guidance
- Fallback mechanism when database is empty
- Structured prompt engineering for accurate results

### 7. **AI Scheme Parser Service** (`services/aiSchemeParserService.js`)
Parses AI-generated text into structured scheme data.

**Features:**
- Extracts scheme details from AI responses
- Stores parsed schemes in database
- Generates embeddings for AI-generated schemes
- Formats schemes for frontend display

---

## Data Flow

### User Registration & Login Flow
```
1. User submits profile → createUser()
2. Generate username & password
3. Store in PostgreSQL (Users table)
4. Return credentials to user
```

### Scheme Retrieval Flow (Hybrid Search)
```
1. User requests schemes → getEligibleSchemes()
2. Check cache (if not force refresh)
3. Execute Hybrid Search:
   
   Stage 1: SQL Filtering
   ├─ Build eligibility WHERE clause
   ├─ Query PostgreSQL with indexes
   └─ Get eligible scheme IDs
   
   Stage 2: Semantic Retrieval
   ├─ Generate query embedding
   ├─ Perform vector similarity search (pgvector)
   ├─ Filter by eligible IDs from Stage 1
   └─ Rerank by relevance
   
4. Return ranked schemes
5. Cache results
```

### Fallback Workflow (No Schemes Found)
```
1. No eligible schemes found
2. Trigger Auto-Scraping:
   ├─ Scrape MyScheme.gov.in
   ├─ Parse with AI
   ├─ Store in database
   ├─ Generate embeddings
   └─ Retry hybrid search
   
3. If scraping fails → AI Chatbot Fallback:
   ├─ Call Gemini API with user profile
   ├─ Parse AI response
   ├─ Store schemes in database
   └─ Return AI recommendations
   
4. If all fails → Return helpful message
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript

### Database
- **Primary DB**: PostgreSQL 15+
- **ORM**: Prisma
- **Vector Extension**: pgvector (for semantic search)

### AI & ML
- **LLM**: Google Gemini 2.5 Flash Lite
- **Embeddings**: Gemini Embedding Model (3072-dim)
- **Vector Search**: pgvector with cosine similarity

### Web Scraping
- **Browser Automation**: Playwright
- **HTML Parsing**: Cheerio

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Email**: Nodemailer
- **Job Queue**: BullMQ + Redis (for background tasks)
- **Cron Jobs**: node-cron (for scheduled scraping)

---

## Key Features

### 1. **Hybrid Retrieval Architecture**
Combines the precision of SQL filtering with the flexibility of semantic search:
- **Precision**: SQL ensures only eligible schemes are considered
- **Relevance**: Vector search ranks by semantic similarity
- **Performance**: Indexed queries + reduced search space

### 2. **Multi-Level Fallback System**
Ensures users always get recommendations:
1. **Primary**: Hybrid search on database
2. **Fallback 1**: Auto-scraping from government portals
3. **Fallback 2**: AI-generated recommendations
4. **Final**: Helpful guidance message

### 3. **Intelligent Caching**
- In-memory cache for frequently accessed schemes
- Cache invalidation on user profile updates
- Configurable TTL and refresh strategies

### 4. **Comprehensive Eligibility Rules**
Supports complex eligibility criteria:
- Age ranges (min/max)
- Income limits
- State-specific schemes
- Occupation-based filtering
- Category-based filtering (SC/ST/OBC/General)
- Gender-specific schemes

### 5. **Semantic Understanding**
Vector embeddings capture contextual meaning:
- Understands synonyms and related terms
- Handles natural language queries
- Context-aware search with user profile

### 6. **Auto-Expanding Knowledge Base**
System automatically grows its knowledge:
- Scrapes 50+ government portals
- Parses schemes with AI assistance
- Generates embeddings automatically
- Scheduled updates via cron jobs

---

## API Endpoints

### User Management
```
POST   /api/users/register          - Create new user
POST   /api/users/login             - User login
GET    /api/users/:id/profile       - Get user profile
```

### Scheme Retrieval
```
GET    /api/users/:id/schemes       - Get eligible schemes (hybrid search)
       Query params:
       - refresh=true               - Force refresh cache
       - hybrid=false               - Use legacy AI search
       - query=<text>               - Custom search query
       - limit=<number>             - Result limit (default: 20)

GET    /api/users/:id/recommendations - Personalized recommendations
       Query params:
       - limit=<number>             - Result limit (default: 10)

POST   /api/users/:id/search        - Search with custom query
       Body: { query: "search text" }

GET    /api/users/:id/stats         - Eligibility statistics
```

### Cache Management
```
DELETE /api/users/:id/schemes/cache - Clear scheme cache
```

### Chat & General
```
POST   /api/chat                    - AI chatbot for general queries
       Body: { message: "user query" }

GET    /health                      - Health check endpoint
```

---

## Database Schema

### Users Table
```sql
User {
  id            String   @id @default(uuid())
  name          String
  email         String?  @unique
  username      String   @unique
  password      String
  age           Int
  gender        String
  state         String
  occupation    String
  annualIncome  Int
  category      String   -- SC/ST/OBC/General/EWS
  familySize    Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Schemes Table
```sql
Scheme {
  id                String   @id @default(uuid())
  schemeName        String
  description       String?
  benefits          String?
  eligibilityRules  Json
  applicationUrl    String?
  requiredDocuments String?
  schemeType        String   -- "central" or "state"
  state             String?  -- null for central schemes
  ministry          String?
  occupation        String?
  category          String?
  minAge            Int?
  maxAge            Int?
  maxIncome         Int?
  embedding         vector(3072)?  -- pgvector
  embeddingModel    String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([state, occupation, category, minAge, maxIncome])
}
```

### SchemeEmbeddings Table
```sql
SchemeEmbedding {
  id              String   @id @default(uuid())
  schemeId        String   @unique
  embedding       vector(3072)
  embeddingModel  String
  textContent     String   @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([schemeId])
}
```

---

## Retrieval System

### Hybrid Retrieval Algorithm

```javascript
function hybridSearch(userProfile, query, options) {
  // Stage 1: SQL Eligibility Filtering
  const eligibleIds = await filterBySQL({
    state: userProfile.state,
    age: userProfile.age,
    income: userProfile.annualIncome,
    occupation: userProfile.occupation,
    category: userProfile.category
  });
  
  // If no eligible schemes found → Trigger fallback
  if (eligibleIds.length === 0) {
    return await fallbackWorkflow(userProfile);
  }
  
  // Stage 2: Semantic Vector Search
  const queryEmbedding = await generateEmbedding(query, userProfile);
  const results = await vectorSearch({
    embedding: queryEmbedding,
    schemeIds: eligibleIds,  // Only search eligible schemes
    limit: options.limit,
    threshold: options.similarityThreshold
  });
  
  // Stage 3: Reranking
  return rerank(results, userProfile);
}
```

### Vector Search Query (PostgreSQL + pgvector)
```sql
SELECT 
  s.*,
  1 - (s.embedding <=> $1::vector) AS similarity
FROM schemes s
WHERE 
  s.id = ANY($2::uuid[])  -- Filter by eligible IDs
  AND s.embedding IS NOT NULL
  AND 1 - (s.embedding <=> $1::vector) >= $3  -- Similarity threshold
ORDER BY similarity DESC
LIMIT $4;
```

---

## Fallback Mechanisms

### 1. Auto-Scraping Fallback
**Trigger**: No eligible schemes found in database

**Process**:
1. Identify relevant scraping sources based on user profile
2. Scrape MyScheme.gov.in and state portals
3. Parse HTML with Cheerio
4. Extract scheme details with AI assistance
5. Store in database with eligibility rules
6. Generate embeddings for new schemes
7. Retry hybrid search

**Sources**: 50+ government portals configured in `config/scrapingSources.js`

### 2. AI Chatbot Fallback
**Trigger**: Auto-scraping fails or returns no results

**Process**:
1. Call Google Gemini API with user profile
2. Request comprehensive scheme recommendations
3. Parse AI response into structured format
4. Store parsed schemes in database
5. Generate embeddings
6. Return AI recommendations to user

**Prompt Engineering**:
```javascript
const prompt = `
You are an expert on Indian Government Schemes.
Based on this user profile, provide ALL eligible schemes:

User Profile:
- Age: ${age}
- State: ${state}
- Occupation: ${occupation}
- Income: ₹${income}
- Category: ${category}

Provide:
1. Scheme Name
2. Type (Central/State)
3. Eligibility Criteria
4. Benefits
5. Required Documents
6. Application Process
`;
```

### 3. Graceful Degradation
**Trigger**: All fallbacks fail

**Response**:
```json
{
  "schemes": [],
  "metadata": {
    "message": "No eligible schemes found. Please try manual scraping or check back later.",
    "fallbackUsed": "none",
    "suggestions": [
      "Update your profile",
      "Try different search terms",
      "Check back after database update"
    ]
  }
}
```

---

## Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Services:
# - API Server (Port 8000)
# - PostgreSQL (Port 5432)
# - Redis (Port 6379)
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/govscheme

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# Server
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Generate embeddings
npm run embeddings:generate
```

### Production Deployment
See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for detailed production deployment instructions.

---

## Performance Characteristics

### Query Performance
- **SQL Filtering**: ~10-50ms (with indexes)
- **Vector Search**: ~50-200ms (depends on candidate set size)
- **Total Hybrid Search**: ~100-300ms
- **Cache Hit**: ~1-5ms

### Scalability
- **Database**: Handles 100K+ schemes efficiently
- **Concurrent Users**: 1000+ with proper infrastructure
- **Vector Search**: O(n) where n = eligible schemes (reduced search space)

### Optimization Strategies
1. **Indexed Columns**: state, occupation, category, age, income
2. **Reduced Search Space**: SQL filtering before vector search
3. **Caching**: In-memory cache for frequent queries
4. **Batch Processing**: Embedding generation in batches
5. **Connection Pooling**: Prisma connection pool

---

## Future Enhancements

1. **Machine Learning Ranking**: Train ML model for better reranking
2. **User Feedback Loop**: Learn from user interactions
3. **Multi-language Support**: Support regional languages
4. **Mobile App**: Native mobile applications
5. **Real-time Notifications**: Push notifications for new schemes
6. **Application Tracking**: Track scheme application status
7. **Document Upload**: Help users prepare required documents
8. **Chatbot Improvements**: More conversational AI assistant

---

## Contributing

See [`README.md`](./README.md) for contribution guidelines.

## License

This project is part of a government initiative to improve citizen access to welfare schemes.

---

**Last Updated**: 2026-05-16
**Version**: 1.0.0


# 🇮🇳 Government Scheme Eligibility Assistant

A Next.js-based web application that helps Indian citizens discover government schemes they're eligible for through an interactive conversational interface.

## 📋 Overview

This frontend application provides a user-friendly chatbot interface that collects user information and displays personalized government scheme recommendations. It integrates with a backend API to create user profiles, authenticate users, and fetch eligible schemes based on user demographics.

## ✨ Features

- **Interactive Onboarding**: Conversational chatbot interface for collecting user information
- **User Profile Management**: Create and update user profiles with demographic details
- **Personalized Dashboard**: View schemes tailored to user eligibility criteria
- **Session Management**: Secure session handling with automatic heartbeat monitoring
- **Responsive Design**: Modern, gradient-based UI with smooth animations
- **Docker Support**: Containerized deployment for easy setup

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.0.0](https://nextjs.org/) (React 18.3.1)
- **Language**: TypeScript 5.6.2
- **HTTP Client**: Axios 1.7.2
- **Styling**: Inline styles with CSS-in-JS
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
gov-scheme-frontend/
├── app/
│   ├── layout.tsx              # Root layout with session heartbeat
│   ├── page.tsx                # Home page with onboarding chatbot
│   ├── chat/
│   │   └── page.tsx            # Chat interface
│   ├── dashboard/
│   │   └── page.tsx            # User dashboard with schemes
│   └── login/
│       └── page.tsx            # Login page
├── components/
│   ├── SessionHeartbeat.tsx    # Session monitoring component
│   └── UserProfileForm.tsx     # User profile form component
├── lib/
│   ├── api.ts                  # API client and endpoints
│   └── session.ts              # Session management utilities
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Docker build configuration
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Backend API running (default: `http://localhost:8000`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gov-scheme-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your backend API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Deployment

### Using Docker Compose

1. **Build and run**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

### Using Docker directly

1. **Build the image**
   ```bash
   docker build -t gov-scheme-frontend .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8000 gov-scheme-frontend
   ```

## 📝 Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build production bundle
- `npm start` - Start production server on port 3000

## 🔌 API Integration

The application integrates with a backend API through the [`lib/api.ts`](lib/api.ts) module:

### Endpoints Used

- **POST** `/api/users` - Create new user profile
- **POST** `/api/users/login` - User authentication
- **GET** `/api/users/:userId/schemes` - Fetch eligible schemes
- **GET** `/api/users/:userId` - Get user profile
- **PUT** `/api/users/:userId` - Update user profile
- **DELETE** `/api/users/:userId/schemes/cache` - Clear scheme cache
- **POST** `/api/chat` - Chat interactions
- **GET** `/api/schemes` - Get all schemes
- **GET** `/api/schemes/:schemeId` - Get specific scheme
- **GET** `/api/schemes/search` - Search schemes

## 🎨 User Flow

1. **Landing Page** (`/`)
   - Interactive chatbot collects user information
   - Questions include: name, email, age, gender, state, occupation, income, category, family size
   - Auto-generates username and password
   - Redirects to dashboard after profile creation

2. **Login Page** (`/login`)
   - Existing users can log in with credentials
   - Session-based authentication

3. **Dashboard** (`/dashboard`)
   - Displays personalized government schemes
   - Shows scheme details: benefits, eligibility, documents, application URL
   - Refresh functionality to update scheme recommendations
   - Profile management options

## 🔐 Session Management

The application uses session storage for authentication:

- Sessions are stored in browser's `sessionStorage`
- [`SessionHeartbeat`](components/SessionHeartbeat.tsx) component monitors session validity
- Automatic logout on session expiration
- Session data includes: `userId`, `userName`, `username`

## 🎯 Key Features Explained

### Conversational Onboarding
The home page uses a step-by-step chatbot interface to collect user information naturally, making the registration process engaging and user-friendly.

### Dynamic Scheme Display
The dashboard normalizes scheme data from various sources and presents it in a consistent, easy-to-read format with expandable details.

### Session Persistence
Sessions are maintained across page refreshes but are cleared when the browser tab is closed, ensuring security while maintaining convenience.

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` |

## 🔧 Configuration

### Next.js Configuration ([`next.config.js`](next.config.js))
- Standalone output for optimized Docker builds
- Environment variable exposure for client-side access

### TypeScript Configuration ([`tsconfig.json`](tsconfig.json))
- Target: ES2020
- Strict mode disabled for flexibility
- Module resolution: bundler

## 📦 Dependencies

### Production
- `next`: 15.0.0 - React framework
- `react`: 18.3.1 - UI library
- `react-dom`: 18.3.1 - React DOM renderer
- `axios`: ^1.7.2 - HTTP client

### Development
- `typescript`: ^5.6.2 - TypeScript compiler
- `@types/react`: ^18.3.3 - React type definitions
- `@types/node`: ^22.7.4 - Node.js type definitions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of a government scheme eligibility system.

## 🐛 Troubleshooting

### Common Issues

**Issue**: Cannot connect to backend API
- **Solution**: Ensure backend is running and `NEXT_PUBLIC_API_URL` is correctly set

**Issue**: Session expires immediately
- **Solution**: Check browser's sessionStorage is enabled and not being cleared

**Issue**: Docker build fails
- **Solution**: Ensure Docker has sufficient memory allocated (minimum 2GB recommended)

## 📞 Support

For issues and questions, please open an issue in the repository.

---

