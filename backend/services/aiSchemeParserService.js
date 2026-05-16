const prisma = require('../db/prisma');
const embeddingService = require('./embeddingService');

/**
 * AI Scheme Parser Service
 * 
 * Extracts structured scheme data from AI-generated text recommendations
 * and stores them in the database with embeddings for future semantic search.
 */
class AISchemeParserService {
  /**
   * Parse AI-generated text and extract individual schemes
   * @param {string} aiText - AI-generated recommendations text
   * @returns {Array} Array of parsed scheme objects
   */
  parseAIRecommendations(aiText) {
    const schemes = [];
    
    // Split by numbered sections (1., 2., etc.) or scheme headers
    const schemeBlocks = aiText.split(/(?=(?:\*\*)?\d+\.\s+)|(?=###\s+\*\*)/);
    
    schemeBlocks.forEach((block) => {
      if (!block.trim() || block.length < 50) return;
      
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return;
      
      let schemeName = '';
      let schemeType = '';
      let description = '';
      let benefits = '';
      let eligibility = '';
      let documents = '';
      let applicationUrl = '';
      let ministry = '';
      let occupation = '';
      let category = '';
      
      let currentSection = '';
      
      lines.forEach((line, idx) => {
        // Extract scheme name (first line with **)
        const isNumberedSchemeLine = line.match(/^(?:\*\*)?\d+\.\s+/);
        const isHeadingLine = line.startsWith('###');

        if ((isNumberedSchemeLine || (idx === 0 && !isHeadingLine)) && !schemeName) {
          const nameMatch = line.match(/(?:\*\*)?\d+\.\s+([^*]+?)(?:\*\*)?$/) || line.match(/\*\*([^*]+)\*\*/);
          if (nameMatch) {
            schemeName = nameMatch[1].trim();
          }
        }
        
        // Detect type
        if (line.includes('**Type:**') || line.includes('Type:')) {
          const normalizedLine = line.toLowerCase();
          
          if (normalizedLine.includes('state government') || normalizedLine.includes('state scheme')) {
            schemeType = 'State Government';
          } else if (
            normalizedLine.includes('central government') ||
            normalizedLine.includes('centrally sponsored') ||
            normalizedLine.includes('central sector')
          ) {
            schemeType = 'Central Government';
          } else {
            schemeType = line.replace(/.*Type:\*?\*?/i, '').replace(/\*\*/g, '').trim();
          }
        }
        
        // Detect ministry
        if (line.includes('**Ministry:**') || line.includes('Ministry:')) {
          ministry = line.replace(/.*Ministry:\*?\*?/i, '').replace(/\*\*/g, '').trim();
        }
        
        // Detect sections
        if (line.includes('**Eligibility') || line.includes('Eligibility Criteria')) {
          currentSection = 'eligibility';
        } else if (line.includes('**Benefits') || line.includes('Benefits:')) {
          currentSection = 'benefits';
        } else if (line.includes('**Required Documents') || line.includes('Documents:')) {
          currentSection = 'documents';
        } else if (line.includes('**How to Apply') || line.includes('Official Website') || line.includes('Application:')) {
          currentSection = 'application';
        } else if (currentSection) {
          // Add content to current section
          const content = line.replace(/^\*\s+/, '').replace(/^-\s+/, '').trim();
          if (content && !content.includes('**')) {
            if (currentSection === 'eligibility') {
              eligibility += content + '\n';
              
              // Extract occupation hints
              if (content.toLowerCase().includes('farmer')) occupation = 'Farmer';
              else if (content.toLowerCase().includes('student')) occupation = 'Student';
              else if (content.toLowerCase().includes('women')) occupation = 'Women';
              
              // Extract category hints
              if (content.toLowerCase().includes('sc/st')) category = 'SC';
              else if (content.toLowerCase().includes('obc')) category = 'OBC';
              else if (content.toLowerCase().includes('ews')) category = 'EWS';
            } else if (currentSection === 'benefits') {
              benefits += content + '\n';
            } else if (currentSection === 'documents') {
              documents += content + '\n';
            } else if (currentSection === 'application') {
              applicationUrl += content + ' ';
              // Extract URL if present
              const urlMatch = content.match(/\[(.*?)\]\((.*?)\)/);
              if (urlMatch) applicationUrl = urlMatch[2];
              else {
                const httpMatch = content.match(/(https?:\/\/[^\s]+)/);
                if (httpMatch) applicationUrl = httpMatch[1];
              }
            }
          }
        } else if (!description && line && !line.includes('**') && !line.match(/^\d+\./)) {
          description = line;
        }
      });
      
      if (schemeName) {
        schemes.push({
          schemeName: schemeName,
          schemeType: schemeType || 'Government Scheme',
          description: description || 'Government scheme for eligible citizens',
          benefits: benefits.trim() || 'Financial and social benefits',
          eligibility: eligibility.trim() || 'Check official website for eligibility',
          documents: documents.trim() || 'Standard documents required',
          applicationUrl: applicationUrl.trim() || 'Visit official government portal',
          ministry: ministry || 'Government of India',
          occupation: occupation || null,
          category: category || null
        });
      }
    });
    
    return schemes;
  }

  /**
   * Store AI-generated schemes in database with embeddings
   * @param {string} aiText - AI-generated recommendations text
   * @param {Object} userProfile - User profile for context
   * @returns {Array} Array of created scheme records
   */
  async storeAISchemes(aiText, userProfile) {
    try {
      console.log('\n📝 Parsing AI recommendations...');
      const parsedSchemes = this.parseAIRecommendations(aiText);
      console.log(`✅ Parsed ${parsedSchemes.length} schemes from AI recommendations`);
      
      if (parsedSchemes.length === 0) {
        console.log('⚠️ No schemes could be parsed from AI text');
        return [];
      }

      const createdSchemes = [];
      
      for (const scheme of parsedSchemes) {
        try {
          // Check if scheme already exists
          const existing = await prisma.scheme.findFirst({
            where: {
              schemeName: scheme.schemeName
            }
          });

          if (existing) {
            console.log(`⏭️ Scheme already exists: ${scheme.schemeName}`);
            createdSchemes.push(existing);
            continue;
          }

          // Generate embedding for the scheme
          console.log(`🔄 Generating embedding for: ${scheme.schemeName}`);
          const schemeText = `${scheme.schemeName} ${scheme.description} ${scheme.benefits} ${scheme.eligibility}`;
          
          let embedding = null;
          try {
            embedding = await embeddingService.generateEmbedding(schemeText);
          } catch (embError) {
            console.warn(`⚠️ Failed to generate embedding for ${scheme.schemeName}:`, embError.message);
            // Continue without embedding - scheme will still be stored
          }

          // Create scheme in database
          const created = await prisma.scheme.create({
            data: {
              schemeName: scheme.schemeName,
              description: scheme.description,
              benefits: scheme.benefits,
              eligibility: scheme.eligibility,
              requiredDocuments: scheme.documents,
              applicationUrl: scheme.applicationUrl,
              ministry: scheme.ministry,
              occupation: scheme.occupation,
              category: scheme.category,
              state: userProfile.state || null,
              minAge: null,
              maxAge: null,
              minIncome: null,
              maxIncome: null,
              gender: null,
              embedding: embedding,
              sourceUrl: 'AI Generated',
              isActive: true
            }
          });

          console.log(`✅ Stored scheme: ${created.schemeName} (ID: ${created.id})`);
          createdSchemes.push(created);

        } catch (schemeError) {
          console.error(`❌ Failed to store scheme ${scheme.schemeName}:`, schemeError.message);
          // Continue with next scheme
        }
      }

      console.log(`\n✅ Successfully stored ${createdSchemes.length}/${parsedSchemes.length} AI-generated schemes\n`);
      return createdSchemes;

    } catch (error) {
      console.error('❌ Error storing AI schemes:', error);
      throw error;
    }
  }

  /**
   * Parse and return structured scheme data without storing
   * @param {string} aiText - AI-generated recommendations text
   * @returns {Array} Array of parsed scheme objects with full details
   */
  parseForDisplay(aiText) {
    const schemes = this.parseAIRecommendations(aiText);
    
    // Return in format expected by frontend
    return schemes.map(scheme => ({
      name: scheme.schemeName,
      type: scheme.schemeType,
      description: scheme.description,
      benefits: scheme.benefits,
      eligibility: scheme.eligibility,
      documents: scheme.documents,
      applicationUrl: scheme.applicationUrl
    }));
  }
}

module.exports = new AISchemeParserService();

//                                                                      
