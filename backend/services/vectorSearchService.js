const prisma = require("../db/prisma");
const embeddingService = require("./embeddingService");

/**
 * VectorSearchService - Performs semantic search using pgvector embeddings
 * Handles vector similarity search in PostgreSQL with pgvector extension
 */
class VectorSearchService {
  constructor() {
    this.defaultLimit = 20;
    this.defaultSimilarityThreshold = 0.5;
  }

  /**
   * Search schemes using vector similarity
   * @param {number[]} queryEmbedding - Query embedding vector
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of schemes with similarity scores
   */
  async searchByEmbedding(queryEmbedding, options = {}) {
    try {
      const {
        limit = this.defaultLimit,
        similarityThreshold = this.defaultSimilarityThreshold,
        schemeIds = null // Optional: filter by specific scheme IDs
      } = options;

      // Convert embedding array to pgvector format string
      const embeddingString = `[${queryEmbedding.join(',')}]`;

      // Build the WHERE clause for optional filtering
      let whereClause = 'WHERE embedding IS NOT NULL';
      if (schemeIds && Array.isArray(schemeIds) && schemeIds.length > 0) {
        const idsString = schemeIds.map(id => `'${id}'`).join(',');
        whereClause += ` AND id IN (${idsString})`;
      }

      // Perform vector similarity search using cosine distance
      // Lower distance = higher similarity
      const query = `
        SELECT 
          id,
          "schemeName",
          description,
          benefits,
          "eligibilityRules",
          "applicationUrl",
          "requiredDocuments",
          "schemeType",
          state,
          ministry,
          occupation,
          category,
          "minAge",
          "maxAge",
          "maxIncome",
          "embeddingModel",
          "createdAt",
          "updatedAt",
          1 - (embedding <=> $1::vector) as similarity
        FROM "Scheme"
        ${whereClause}
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;

      const schemes = await prisma.$queryRawUnsafe(query, embeddingString, limit);

      // Filter by similarity threshold and format results
      return schemes
        .filter(scheme => scheme.similarity >= similarityThreshold)
        .map(scheme => ({
          ...scheme,
          similarity: parseFloat(scheme.similarity.toFixed(4)),
          eligibilityRules: typeof scheme.eligibilityRules === 'string' 
            ? JSON.parse(scheme.eligibilityRules) 
            : scheme.eligibilityRules
        }));
    } catch (error) {
      console.error("Vector search error:", error.message);
      throw new Error(`Failed to perform vector search: ${error.message}`);
    }
  }

  /**
   * Search schemes by text query (generates embedding first)
   * @param {string} query - Search query text
   * @param {Object} userProfile - User profile for context
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of schemes with similarity scores
   */
  async searchByQuery(query, userProfile = null, options = {}) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateQueryEmbedding(query, userProfile);

      // Perform vector search
      return await this.searchByEmbedding(queryEmbedding, options);
    } catch (error) {
      console.error("Query-based vector search error:", error.message);
      throw error;
    }
  }

  /**
   * Find similar schemes to a given scheme
   * @param {string} schemeId - ID of the reference scheme
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of similar schemes
   */
  async findSimilarSchemes(schemeId, options = {}) {
    try {
      const { limit = 10 } = options;

      // Get the reference scheme's embedding
      const referenceScheme = await prisma.scheme.findUnique({
        where: { id: schemeId },
        select: { embedding: true }
      });

      if (!referenceScheme || !referenceScheme.embedding) {
        throw new Error("Reference scheme not found or has no embedding");
      }

      // Search for similar schemes (excluding the reference scheme itself)
      const query = `
        SELECT 
          id,
          "schemeName",
          description,
          benefits,
          "schemeType",
          state,
          ministry,
          1 - (embedding <=> $1::vector) as similarity
        FROM "Scheme"
        WHERE id != $2 AND embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `;

      const embeddingString = `[${referenceScheme.embedding.join(',')}]`;
      const schemes = await prisma.$queryRawUnsafe(query, embeddingString, schemeId, limit);

      return schemes.map(scheme => ({
        ...scheme,
        similarity: parseFloat(scheme.similarity.toFixed(4))
      }));
    } catch (error) {
      console.error("Similar schemes search error:", error.message);
      throw error;
    }
  }

  /**
   * Batch search for multiple queries
   * @param {string[]} queries - Array of search queries
   * @param {Object} userProfile - User profile for context
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Map of query to results
   */
  async batchSearch(queries, userProfile = null, options = {}) {
    try {
      const results = {};

      for (const query of queries) {
        results[query] = await this.searchByQuery(query, userProfile, options);
      }

      return results;
    } catch (error) {
      console.error("Batch search error:", error.message);
      throw error;
    }
  }

  /**
   * Get embedding statistics for monitoring
   * @returns {Promise<Object>} - Statistics about embeddings
   */
  async getEmbeddingStats() {
    try {
      const totalSchemes = await prisma.scheme.count();
      const schemesWithEmbeddings = await prisma.scheme.count({
        where: {
          embedding: { not: null }
        }
      });

      const embeddingModels = await prisma.scheme.groupBy({
        by: ['embeddingModel'],
        where: {
          embeddingModel: { not: null }
        },
        _count: true
      });

      return {
        totalSchemes,
        schemesWithEmbeddings,
        schemesWithoutEmbeddings: totalSchemes - schemesWithEmbeddings,
        coveragePercentage: totalSchemes > 0 
          ? ((schemesWithEmbeddings / totalSchemes) * 100).toFixed(2) 
          : 0,
        embeddingModels: embeddingModels.map(m => ({
          model: m.embeddingModel,
          count: m._count
        }))
      };
    } catch (error) {
      console.error("Embedding stats error:", error.message);
      throw error;
    }
  }

  /**
   * Rerank schemes based on multiple criteria
   * @param {Array} schemes - Schemes with similarity scores
   * @param {Object} userProfile - User profile for personalization
   * @returns {Array} - Reranked schemes
   */
  rerankSchemes(schemes, userProfile = null) {
    if (!userProfile) {
      return schemes;
    }

    return schemes.map(scheme => {
      let score = scheme.similarity;

      // Boost score for state match
      if (scheme.state && scheme.state === userProfile.state) {
        score += 0.1;
      }

      // Boost score for occupation match
      if (scheme.occupation && scheme.occupation === userProfile.occupation) {
        score += 0.1;
      }

      // Boost score for category match
      if (scheme.category && scheme.category === userProfile.category) {
        score += 0.1;
      }

      return {
        ...scheme,
        originalSimilarity: scheme.similarity,
        rerankScore: Math.min(score, 1.0) // Cap at 1.0
      };
    }).sort((a, b) => b.rerankScore - a.rerankScore);
  }
}

module.exports = new VectorSearchService();

//  
