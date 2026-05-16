const prisma = require("../db/prisma");
const embeddingService = require("./embeddingService");
const vectorSearchService = require("./vectorSearchService");
const autoScrapingService = require("./autoScrapingService");
const aiService = require("./aiService");
const aiSchemeParserService = require("./aiSchemeParserService");

/**
 * HybridRetrievalService - Combines deterministic SQL filtering with semantic vector retrieval
 * 
 * Architecture:
 * 1. First Stage: SQL-based eligibility filtering (deterministic)
 *    - Filters by state, occupation, income, age, category
 *    - Reduces candidate search space to eligible schemes only
 * 
 * 2. Second Stage: Semantic vector retrieval (contextual)
 *    - Performs vector similarity search on eligible schemes
 *    - Ranks by semantic relevance to user query/profile
 * 
 * This hybrid approach combines precision of structured filtering with 
 * flexibility of semantic understanding for improved retrieval quality.
 */
class HybridRetrievalService {
  constructor() {
    this.defaultVectorLimit = 20;
    this.defaultSimilarityThreshold = 0.5;
  }

  /**
   * Build SQL WHERE conditions for eligibility filtering
   * @param {Object} userProfile - User profile with eligibility criteria
   * @returns {Object} - Prisma where clause
   */
  buildEligibilityFilter(userProfile) {
    const conditions = [];

    // State filter: match user's state OR central schemes (state = null)
    if (userProfile.state) {
      conditions.push({
        OR: [
          { state: userProfile.state },
          { state: null }, // Central schemes
          { state: 'All States' }
        ]
      });
    }

    // Age filter: user age must be within scheme's age range
    if (userProfile.age) {
      conditions.push({
        OR: [
          { minAge: null }, // No minimum age restriction
          { minAge: { lte: userProfile.age } }
        ]
      });
      conditions.push({
        OR: [
          { maxAge: null }, // No maximum age restriction
          { maxAge: { gte: userProfile.age } }
        ]
      });
    }

    // Income filter: user income must be below scheme's maximum
    if (userProfile.annualIncome) {
      conditions.push({
        OR: [
          { maxIncome: null }, // No income restriction
          { maxIncome: { gte: userProfile.annualIncome } }
        ]
      });
    }

    // Category filter: match user's category OR schemes for all categories
    if (userProfile.category) {
      conditions.push({
        OR: [
          { category: userProfile.category },
          { category: null }, // No category restriction
          { category: 'All' }
        ]
      });
    }

    // Occupation filter: match user's occupation OR schemes for all occupations
    if (userProfile.occupation) {
      conditions.push({
        OR: [
          { occupation: userProfile.occupation },
          { occupation: null }, // No occupation restriction
          { occupation: 'All' }
        ]
      });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  /**
   * Stage 1: SQL-based eligibility filtering
   * @param {Object} userProfile - User profile
   * @returns {Promise<Array>} - Array of eligible scheme IDs
   */
  async filterEligibleSchemes(userProfile) {
    try {
      const whereClause = this.buildEligibilityFilter(userProfile);

      const eligibleSchemes = await prisma.scheme.findMany({
        where: whereClause,
        select: {
          id: true,
          schemeName: true,
          state: true,
          occupation: true,
          category: true,
          minAge: true,
          maxAge: true,
          maxIncome: true
        }
      });

      console.log(`SQL Filtering: Found ${eligibleSchemes.length} eligible schemes for user`);
      return eligibleSchemes.map(s => s.id);
    } catch (error) {
      console.error("SQL eligibility filtering error:", error.message);
      throw error;
    }
  }

  /**
   * Stage 2: Semantic vector retrieval on eligible schemes
   * @param {string} query - User query or search intent
   * @param {Array} eligibleSchemeIds - IDs of eligible schemes from Stage 1
   * @param {Object} userProfile - User profile for context
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Ranked schemes with similarity scores
   */
  async semanticRetrieval(query, eligibleSchemeIds, userProfile, options = {}) {
    try {
      const {
        limit = this.defaultVectorLimit,
        similarityThreshold = this.defaultSimilarityThreshold
      } = options;

      if (eligibleSchemeIds.length === 0) {
        console.log("No eligible schemes to perform semantic search on");
        return [];
      }

      // Perform vector search only on eligible schemes
      const results = await vectorSearchService.searchByQuery(
        query,
        userProfile,
        {
          limit,
          similarityThreshold,
          schemeIds: eligibleSchemeIds
        }
      );

      console.log(`Semantic Retrieval: Found ${results.length} relevant schemes from ${eligibleSchemeIds.length} eligible schemes`);
      return results;
    } catch (error) {
      console.error("Semantic retrieval error:", error.message);
      throw error;
    }
  }

  /**
   * Hybrid retrieval: Combines SQL filtering + Vector search
   * @param {Object} userProfile - User profile
   * @param {string} query - Optional search query (defaults to profile-based query)
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Results with metadata
   */
  async hybridSearch(userProfile, query = null, options = {}) {
    try {
      const startTime = Date.now();
      const { enableAutoScraping = true, enableChatbotFallback = true } = options;

      // Stage 1: SQL-based eligibility filtering
      const eligibleSchemeIds = await this.filterEligibleSchemes(userProfile);

      // FALLBACK WORKFLOW: No eligible schemes found
      if (eligibleSchemeIds.length === 0) {
        console.log('\n⚠️ NO ELIGIBLE SCHEMES FOUND - Initiating fallback workflow...\n');

        // Fallback Step 1: Try auto-scraping
        if (enableAutoScraping) {
          console.log('🤖 Attempting auto-scraping from government websites...');
          const scrapingResult = await autoScrapingService.triggerAutoScraping(userProfile);
          
          if (scrapingResult.success && scrapingResult.schemesAdded > 0) {
            console.log(`✅ Auto-scraping successful! Added ${scrapingResult.schemesAdded} new schemes`);
            console.log('🔄 Retrying hybrid search with newly scraped data...\n');
            
            // Retry hybrid search with newly scraped schemes
            const retryIds = await this.filterEligibleSchemes(userProfile);
            
            if (retryIds.length > 0) {
              // Continue with semantic retrieval on newly found schemes
              const filteringTime = Date.now() - startTime;
              const searchQuery = query || this.generateDefaultQuery(userProfile);
              const retrievalStart = Date.now();
              const schemes = await this.semanticRetrieval(searchQuery, retryIds, userProfile, options);
              
              return {
                schemes,
                metadata: {
                  totalEligible: retryIds.length,
                  totalRetrieved: schemes.length,
                  filteringTime,
                  retrievalTime: Date.now() - retrievalStart,
                  totalTime: Date.now() - startTime,
                  method: 'hybrid',
                  fallbackUsed: 'auto-scraping',
                  schemesScraped: scrapingResult.schemesAdded
                }
              };
            }
          } else {
            console.log('⚠️ Auto-scraping did not find new schemes or failed');
          }
        }

        // Fallback Step 2: Use AI chatbot for general recommendations
        if (enableChatbotFallback) {
          console.log('🤖 Falling back to AI chatbot for general scheme recommendations...\n');
          
          try {
            const aiResponse = await aiService.searchGovernmentSchemes(userProfile);
            console.log('✅ Received AI response, length:', aiResponse?.length || 0);
            
            let parsedSchemes = [];
            try {
              parsedSchemes = aiSchemeParserService.parseForDisplay(aiResponse);
              console.log('✅ Parsed schemes for display:', parsedSchemes.length);
            } catch (parseError) {
              console.error('⚠️ Failed to parse AI response:', parseError.message);
              // Continue with empty parsedSchemes - frontend will parse from aiRecommendations
            }
            
            return {
              schemes: [],
              parsedSchemes,
              aiRecommendations: aiResponse,
              metadata: {
                totalEligible: 0,
                totalRetrieved: parsedSchemes.length,
                totalParsed: parsedSchemes.length,
                filteringTime: Date.now() - startTime,
                retrievalTime: 0,
                totalTime: Date.now() - startTime,
                method: 'ai-chatbot-fallback',
                fallbackUsed: 'ai-chatbot',
                message: 'No schemes found in database. AI-generated recommendations provided.'
              }
            };
          } catch (aiError) {
            console.error('❌ AI chatbot fallback failed:', aiError.message);
          }
        }

        // Final fallback: Return empty with helpful message
        return {
          schemes: [],
          metadata: {
            totalEligible: 0,
            totalRetrieved: 0,
            filteringTime: Date.now() - startTime,
            retrievalTime: 0,
            totalTime: Date.now() - startTime,
            method: 'hybrid',
            fallbackUsed: 'none',
            message: 'No eligible schemes found. Please try manual scraping or check back later.'
          }
        };
      }

      const filteringTime = Date.now() - startTime;

      // Generate default query if not provided
      const searchQuery = query || this.generateDefaultQuery(userProfile);

      // Stage 2: Semantic vector retrieval
      const retrievalStart = Date.now();
      const schemes = await this.semanticRetrieval(
        searchQuery,
        eligibleSchemeIds,
        userProfile,
        options
      );
      const retrievalTime = Date.now() - retrievalStart;

      // FALLBACK: If semantic retrieval returns 0 results (e.g., no embeddings), use AI chatbot
      if (schemes.length === 0 && enableChatbotFallback) {
        console.log('\n⚠️ SEMANTIC RETRIEVAL RETURNED 0 RESULTS - Falling back to AI chatbot...\n');
        
        try {
          const aiResponse = await aiService.searchGovernmentSchemes(userProfile);
          console.log('✅ Received AI response, length:', aiResponse?.length || 0);
          
          // Parse AI recommendations and store in database
          let storedSchemes = [];
          let parsedSchemes = [];
          
          try {
            console.log('📝 Parsing and storing AI-generated schemes...');
            storedSchemes = await aiSchemeParserService.storeAISchemes(aiResponse, userProfile);
            parsedSchemes = aiSchemeParserService.parseForDisplay(aiResponse);
            console.log(`✅ Stored ${storedSchemes.length} schemes, parsed ${parsedSchemes.length} for display`);
          } catch (parseError) {
            console.error('⚠️ Failed to parse/store AI schemes:', parseError.message);
            // Continue with AI text response even if parsing fails
            // Frontend will parse from aiRecommendations text
          }
          
          return {
            schemes: storedSchemes, // Return stored database schemes
            parsedSchemes: parsedSchemes, // Return parsed schemes for immediate display
            aiRecommendations: aiResponse,
            metadata: {
              totalEligible: eligibleSchemeIds.length,
              totalRetrieved: storedSchemes.length,
              totalParsed: parsedSchemes.length,
              filteringTime,
              retrievalTime,
              totalTime: Date.now() - startTime,
              method: 'ai-chatbot-fallback',
              fallbackUsed: 'ai-chatbot',
              aiSchemesStored: storedSchemes.length,
              message: `Found ${eligibleSchemeIds.length} eligible schemes but semantic search returned no results. Generated and stored ${storedSchemes.length} AI recommendations.`
            }
          };
        } catch (aiError) {
          console.error('❌ AI chatbot fallback failed:', aiError.message);
          // Continue with empty results
        }
      }

      // Rerank based on additional criteria
      const rerankedSchemes = vectorSearchService.rerankSchemes(schemes, userProfile);

      return {
        schemes: rerankedSchemes,
        metadata: {
          totalEligible: eligibleSchemeIds.length,
          totalRetrieved: rerankedSchemes.length,
          filteringTime,
          retrievalTime,
          totalTime: Date.now() - startTime,
          method: 'hybrid',
          query: searchQuery
        }
      };
    } catch (error) {
      console.error("Hybrid search error:", error.message);
      throw error;
    }
  }

  /**
   * Generate a default search query based on user profile
   * @param {Object} userProfile - User profile
   * @returns {string} - Generated query
   */
  generateDefaultQuery(userProfile) {
    const queryParts = ["Government schemes for"];

    if (userProfile.occupation) {
      queryParts.push(userProfile.occupation);
    }

    if (userProfile.category) {
      queryParts.push(userProfile.category);
    }

    if (userProfile.gender) {
      queryParts.push(userProfile.gender);
    }

    if (userProfile.age) {
      queryParts.push(`age ${userProfile.age}`);
    }

    if (userProfile.state) {
      queryParts.push(`in ${userProfile.state}`);
    }

    return queryParts.join(" ");
  }

  /**
   * Get personalized scheme recommendations
   * @param {Object} userProfile - User profile
   * @param {Object} options - Options
   * @returns {Promise<Object>} - Personalized recommendations
   */
  async getPersonalizedRecommendations(userProfile, options = {}) {
    try {
      const { limit = 10 } = options;

      // Perform hybrid search with profile-based query
      const result = await this.hybridSearch(userProfile, null, { limit });

      // Group schemes by category for better presentation
      const groupedSchemes = this.groupSchemesByType(result.schemes);

      return {
        recommendations: result.schemes,
        groupedByType: groupedSchemes,
        metadata: result.metadata,
        userProfile: {
          state: userProfile.state,
          occupation: userProfile.occupation,
          category: userProfile.category,
          age: userProfile.age,
          annualIncome: userProfile.annualIncome
        }
      };
    } catch (error) {
      console.error("Personalized recommendations error:", error.message);
      throw error;
    }
  }

  /**
   * Group schemes by type for organized presentation
   * @param {Array} schemes - Array of schemes
   * @returns {Object} - Schemes grouped by type
   */
  groupSchemesByType(schemes) {
    const grouped = {
      central: [],
      state: []
    };

    schemes.forEach(scheme => {
      if (scheme.schemeType === 'central') {
        grouped.central.push(scheme);
      } else if (scheme.schemeType === 'state') {
        grouped.state.push(scheme);
      }
    });

    return grouped;
  }

  /**
   * Search with custom query and filters
   * @param {string} query - Search query
   * @param {Object} userProfile - User profile
   * @param {Object} filters - Additional filters
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results
   */
  async searchWithFilters(query, userProfile, filters = {}, options = {}) {
    try {
      // Merge user profile with additional filters
      const enhancedProfile = { ...userProfile, ...filters };

      // Perform hybrid search
      return await this.hybridSearch(enhancedProfile, query, options);
    } catch (error) {
      console.error("Search with filters error:", error.message);
      throw error;
    }
  }

  /**
   * Compare hybrid vs pure vector search performance
   * @param {Object} userProfile - User profile
   * @param {string} query - Search query
   * @returns {Promise<Object>} - Comparison results
   */
  async compareSearchMethods(userProfile, query) {
    try {
      // Hybrid search
      const hybridStart = Date.now();
      const hybridResults = await this.hybridSearch(userProfile, query);
      const hybridTime = Date.now() - hybridStart;

      // Pure vector search (no SQL filtering)
      const vectorStart = Date.now();
      const vectorResults = await vectorSearchService.searchByQuery(query, userProfile);
      const vectorTime = Date.now() - vectorStart;

      return {
        hybrid: {
          results: hybridResults.schemes.length,
          time: hybridTime,
          eligible: hybridResults.metadata.totalEligible
        },
        vector: {
          results: vectorResults.length,
          time: vectorTime
        },
        improvement: {
          precision: hybridResults.schemes.length > 0 
            ? ((hybridResults.metadata.totalEligible / vectorResults.length) * 100).toFixed(2) 
            : 0,
          speedup: vectorTime > 0 ? (vectorTime / hybridTime).toFixed(2) : 0
        }
      };
    } catch (error) {
      console.error("Search comparison error:", error.message);
      throw error;
    }
  }
}

module.exports = new HybridRetrievalService();

//  
