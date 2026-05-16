const axios = require("axios");

/**
 * EmbeddingService - Generates embeddings for text using Google's text-embedding model
 * Uses text-embedding-004 model which produces 768-dimensional embeddings
 */
class EmbeddingService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = "gemini-embedding-2";
    this.embeddingDimension = 3072;
    // Use v1 API for text-embedding-004 model
    this.baseUrl = "https://generativelanguage.googleapis.com/v1/models";
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to generate embedding for
   * @returns {Promise<number[]>} - 768-dimensional embedding vector
   */
  async generateEmbedding(text) {
    try {
      if (!text || typeof text !== "string") {
        throw new Error("Invalid text input for embedding generation");
      }

      const response = await axios.post(
        `${this.baseUrl}/${this.model}:embedContent?key=${this.apiKey}`,
        {
          model: `models/${this.model}`,
          content: {
            parts: [{ text }]
          }
        }
      );

      const embedding = response.data.embedding.values;
      
      if (!Array.isArray(embedding) || embedding.length !== this.embeddingDimension) {
        throw new Error(`Invalid embedding dimension: expected ${this.embeddingDimension}, got ${embedding?.length}`);
      }

      return embedding;
    } catch (error) {
      console.error("Embedding generation error:", error.response?.data || error.message);
      throw new Error(`Failed to generate embedding: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param {string[]} texts - Array of texts to generate embeddings for
   * @returns {Promise<number[][]>} - Array of 768-dimensional embedding vectors
   */
  async generateBatchEmbeddings(texts) {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error("Invalid texts array for batch embedding generation");
      }

      // Process in batches to avoid rate limits
      const batchSize = 10;
      const embeddings = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.generateEmbedding(text));
        const batchEmbeddings = await Promise.all(batchPromises);
        embeddings.push(...batchEmbeddings);

        // Add small delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return embeddings;
    } catch (error) {
      console.error("Batch embedding generation error:", error.message);
      throw error;
    }
  }

  /**
   * Generate embedding for a scheme by combining its key fields
   * @param {Object} scheme - Scheme object with name, description, benefits, etc.
   * @returns {Promise<{embedding: number[], textContent: string}>}
   */
  async generateSchemeEmbedding(scheme) {
    try {
      // Combine relevant scheme fields into a comprehensive text representation
      const textParts = [];

      if (scheme.schemeName) {
        textParts.push(`Scheme Name: ${scheme.schemeName}`);
      }

      if (scheme.description) {
        textParts.push(`Description: ${scheme.description}`);
      }

      if (scheme.benefits) {
        textParts.push(`Benefits: ${scheme.benefits}`);
      }

      if (scheme.ministry) {
        textParts.push(`Ministry: ${scheme.ministry}`);
      }

      if (scheme.schemeType) {
        textParts.push(`Type: ${scheme.schemeType}`);
      }

      if (scheme.state) {
        textParts.push(`State: ${scheme.state}`);
      }

      if (scheme.occupation) {
        textParts.push(`Target Occupation: ${scheme.occupation}`);
      }

      if (scheme.category) {
        textParts.push(`Target Category: ${scheme.category}`);
      }

      // Add eligibility information
      if (scheme.eligibilityRules) {
        const rules = typeof scheme.eligibilityRules === 'string' 
          ? JSON.parse(scheme.eligibilityRules) 
          : scheme.eligibilityRules;
        
        const eligibilityParts = [];
        if (rules.minAge) eligibilityParts.push(`Minimum Age: ${rules.minAge}`);
        if (rules.maxAge) eligibilityParts.push(`Maximum Age: ${rules.maxAge}`);
        if (rules.maxIncome) eligibilityParts.push(`Maximum Income: ${rules.maxIncome}`);
        if (rules.state) eligibilityParts.push(`State: ${rules.state}`);
        if (rules.category) eligibilityParts.push(`Category: ${rules.category}`);
        
        if (eligibilityParts.length > 0) {
          textParts.push(`Eligibility: ${eligibilityParts.join(', ')}`);
        }
      }

      const textContent = textParts.join('\n');
      const embedding = await this.generateEmbedding(textContent);

      return {
        embedding,
        textContent,
        embeddingModel: this.model
      };
    } catch (error) {
      console.error("Scheme embedding generation error:", error.message);
      throw error;
    }
  }

  /**
   * Generate embedding for a user query
   * @param {string} query - User's search query
   * @param {Object} userProfile - User profile for context
   * @returns {Promise<number[]>}
   */
  async generateQueryEmbedding(query, userProfile = null) {
    try {
      let queryText = query;

      // Enhance query with user context if available
      if (userProfile) {
        const contextParts = [query];
        
        if (userProfile.state) contextParts.push(`State: ${userProfile.state}`);
        if (userProfile.occupation) contextParts.push(`Occupation: ${userProfile.occupation}`);
        if (userProfile.category) contextParts.push(`Category: ${userProfile.category}`);
        if (userProfile.age) contextParts.push(`Age: ${userProfile.age}`);
        
        queryText = contextParts.join(', ');
      }

      return await this.generateEmbedding(queryText);
    } catch (error) {
      console.error("Query embedding generation error:", error.message);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {number[]} embedding1 
   * @param {number[]} embedding2 
   * @returns {number} - Similarity score between -1 and 1
   */
  cosineSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error("Embeddings must have the same dimension");
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

module.exports = new EmbeddingService();

//  
