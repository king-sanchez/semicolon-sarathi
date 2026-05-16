const prisma = require("../db/prisma");
const { chromium } = require("playwright");
const embeddingService = require("../services/embeddingService");

/**
 * Enhanced Scheme Scraper and Importer
 * 
 * Usage:
 *   node scripts/scrapeAndImport.js
 *   node scripts/scrapeAndImport.js --source=myscheme
 *   node scripts/scrapeAndImport.js --source=all --generate-embeddings
 */

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  source: 'myscheme',
  generateEmbeddings: true,
  skipExisting: true
};

args.forEach(arg => {
  if (arg.startsWith('--source=')) {
    options.source = arg.split('=')[1];
  }
  if (arg === '--no-embeddings') {
    options.generateEmbeddings = false;
  }
  if (arg === '--force') {
    options.skipExisting = false;
  }
});

/**
 * Scrape schemes from multiple government websites
 */
async function scrapeMultipleSources() {
  console.log("🌐 Scraping Multiple Government Websites...\n");
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Define multiple pages to scrape
  const pages = [
    {
      url: "https://www.myscheme.gov.in/search/category/Agriculture,Rural%20&%20Environment",
      name: "Agriculture, Rural & Environment",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Banking,Financial%20Services%20and%20Insurance",
      name: "Banking, Financial Services and Insurance",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Business%20&%20Entrepreneurship",
      name: "Business & Entrepreneurship",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Education%20&%20Learning",
      name: "Education & Learning",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Health%20&%20Wellness",
      name: "Health & Wellness",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Housing%20&%20Shelter",
      name: "Housing & Shelter",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Public%20Safety,Law%20&%20Justice",
      name: "Public Safety, Law & Justice",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Science,%20IT%20&%20Communications",
      name: "Science, IT & Communications",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Skills%20&%20Employment",
      name: "Skills & Employment",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Social%20welfare%20&%20Empowerment",
      name: "Social Welfare & Empowerment",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Sports%20&%20Culture",
      name: "Sports & Culture",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Transport%20&%20Infrastructure",
      name: "Transport & Infrastructure",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Travel%20&%20Tourism",
      name: "Travel & Tourism",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Utility%20&%20Sanitation",
      name: "Utility & Sanitation",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    },
    {
      url: "https://www.myscheme.gov.in/search/category/Women%20and%20Child",
      name: "Women and Child",
      selectors: {
        card: ".scheme-card, .card, [class*='scheme']",
        title: "h3, h2, .scheme-title, [class*='title']",
        description: ".scheme-description, p, [class*='desc']",
        benefits: ".benefits, [class*='benefit']",
        link: "a[href*='scheme'], a.apply-link"
      }
    }
  ];
  
  const allSchemes = [];
  
  try {
    for (const pageConfig of pages) {
      console.log(`\n📄 Scraping ${pageConfig.name}...`);
      console.log(`   URL: ${pageConfig.url}`);
      
      try {
        // Navigate to page with longer timeout
        await page.goto(pageConfig.url, {
          waitUntil: "domcontentloaded",
          timeout: 60000
        });
        
        // Wait for JavaScript to render content
        await page.waitForTimeout(5000);
        
        // Try multiple strategies to find content
        const schemes = await page.evaluate(() => {
          const results = [];
          const uniqueSchemes = new Set();
          
          // Helper: Check if element is in navigation/header/footer
          function isNavigationElement(element) {
            const navSelectors = ['nav', 'header', 'footer', '[role="navigation"]', '[class*="menu"]', '[class*="nav"]', '[class*="sidebar"]'];
            for (const selector of navSelectors) {
              if (element.closest(selector)) return true;
            }
            return false;
          }
          
          // Helper: Check if element is in main content area
          function isMainContent(element) {
            const mainSelectors = ['main', '[role="main"]', '[class*="content"]', '[class*="result"]', '[id*="result"]'];
            for (const selector of mainSelectors) {
              if (element.closest(selector)) return true;
            }
            return false;
          }
          
          // Strategy 1: Look for scheme cards in main content area only
          const possibleContainers = [
            ...document.querySelectorAll('main [class*="scheme"]'),
            ...document.querySelectorAll('main [class*="card"]'),
            ...document.querySelectorAll('[role="main"] [class*="scheme"]'),
            ...document.querySelectorAll('[role="main"] [class*="card"]'),
            ...document.querySelectorAll('[class*="result"] [class*="scheme"]'),
            ...document.querySelectorAll('[class*="result"] [class*="card"]')
          ];
          
          // Strategy 2: Look for structured data (JSON-LD)
          const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
          jsonLdScripts.forEach(script => {
            try {
              const data = JSON.parse(script.textContent);
              if (data.name && data.description) {
                results.push({
                  schemeName: data.name,
                  description: data.description,
                  schemeType: 'central',
                  benefits: data.benefits || null,
                  applicationUrl: data.url || null
                });
              }
            } catch (e) {}
          });
          
          // Strategy 3: Extract from visible containers (excluding navigation)
          possibleContainers.forEach(element => {
            try {
              // Skip navigation elements
              if (isNavigationElement(element)) return;
              
              const inMainContent = isMainContent(element);
              
              // Find title
              let title = '';
              const titleSelectors = ['h1', 'h2', 'h3', 'h4', '[class*="title"]', '[class*="name"]', '[class*="heading"]'];
              for (const selector of titleSelectors) {
                const titleEl = element.querySelector(selector);
                if (titleEl && titleEl.textContent.trim()) {
                  title = titleEl.textContent.trim();
                  break;
                }
              }
              
              // Find description
              let description = '';
              const descSelectors = ['p', '[class*="desc"]', '[class*="summary"]', '[class*="content"]'];
              for (const selector of descSelectors) {
                const descEl = element.querySelector(selector);
                if (descEl && descEl.textContent.trim().length > 50) {
                  description = descEl.textContent.trim();
                  break;
                }
              }
              
              // Find link
              const linkEl = element.querySelector('a[href*="scheme"], a[href*="apply"], a');
              const link = linkEl?.href || null;
              
              // Validate and add
              if (title && description && description.length > 50 && !uniqueSchemes.has(title)) {
                if (description.toLowerCase() !== title.toLowerCase()) {
                  uniqueSchemes.add(title);
                  results.push({
                    schemeName: title,
                    description: description.substring(0, 500),
                    schemeType: 'central',
                    benefits: null,
                    applicationUrl: link,
                    inMainContent: inMainContent
                  });
                }
              }
            } catch (error) {
              // Skip this element
            }
          });
          
          // Prioritize main content results
          if (results.length > 0) {
            const mainContentResults = results.filter(r => r.inMainContent);
            if (mainContentResults.length > 0) {
              return mainContentResults;
            }
          }
          
          return results;
        });
        
        if (schemes.length > 0) {
          console.log(`   ✅ Found ${schemes.length} schemes`);
          allSchemes.push(...schemes);
        } else {
          console.log(`   ⚠️ No schemes found on page`);
          
          // Debug: Get page title and some content
          try {
            const title = await page.title();
            const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
            console.log(`   Page title: ${title}`);
            console.log(`   Page preview: ${bodyText}...`);
          } catch (e) {}
        }
        
        // Add delay between requests
        await page.waitForTimeout(3000);
        
      } catch (error) {
        console.log(`   ⚠️ Failed to scrape ${pageConfig.name}: ${error.message}`);
        continue; // Continue with next source
      }
    }
    
    await browser.close();
    
    console.log(`\n✅ Total schemes scraped: ${allSchemes.length}\n`);
    return allSchemes;
    
  } catch (error) {
    await browser.close();
    console.error("❌ Scraping failed:", error.message);
    return [];
  }
}

/**
 * Legacy function - now calls scrapeMultipleSources
 */
async function scrapeMyScheme() {
  return scrapeMultipleSources();
}

/**
 * Parse eligibility rules from scheme description
 */
function parseEligibilityRules(scheme) {
  const rules = {};
  const text = (scheme.description || "").toLowerCase();
  
  // Extract age range
  const ageMatch = text.match(/age[:\s]+(\d+)[\s-]+(\d+)|(\d+)[\s-]+(\d+)\s+years/i);
  if (ageMatch) {
    rules.minAge = parseInt(ageMatch[1] || ageMatch[3]);
    rules.maxAge = parseInt(ageMatch[2] || ageMatch[4]);
  }
  
  // Extract income limit
  const incomeMatch = text.match(/income[:\s]+(?:below|up to|less than)[:\s]+₹?\s*(\d+(?:,\d+)*)/i);
  if (incomeMatch) {
    rules.maxIncome = parseInt(incomeMatch[1].replace(/,/g, ''));
  }
  
  // Extract category
  if (text.includes('sc/st')) {
    rules.category = 'SC/ST';
  } else if (text.includes('obc')) {
    rules.category = 'OBC';
  } else if (text.includes('ews')) {
    rules.category = 'EWS';
  }
  
  // Extract occupation
  if (text.includes('farmer')) {
    rules.occupation = 'Farmer';
  } else if (text.includes('student')) {
    rules.occupation = 'Student';
  } else if (text.includes('women') || text.includes('woman')) {
    rules.gender = 'Female';
  }
  
  return rules;
}

/**
 * Import schemes to database
 */
async function importSchemes(schemes) {
  console.log(`📥 Importing ${schemes.length} schemes to database...\n`);
  
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const scheme of schemes) {
    try {
      // Check if scheme already exists
      if (options.skipExisting) {
        const existing = await prisma.scheme.findFirst({
          where: { schemeName: scheme.schemeName }
        });
        
        if (existing) {
          console.log(`⏭️  Skipped (exists): ${scheme.schemeName}`);
          skipped++;
          continue;
        }
      }
      
      // Parse eligibility rules
      const eligibilityRules = parseEligibilityRules(scheme);
      
      // Create scheme in database
      const created = await prisma.scheme.create({
        data: {
          schemeName: scheme.schemeName,
          description: scheme.description,
          benefits: scheme.benefits,
          schemeType: scheme.schemeType || "central",
          state: scheme.state || null,
          ministry: scheme.ministry || null,
          applicationUrl: scheme.applicationUrl,
          requiredDocuments: scheme.requiredDocuments || null,
          eligibilityRules: eligibilityRules,
          minAge: eligibilityRules.minAge || null,
          maxAge: eligibilityRules.maxAge || null,
          maxIncome: eligibilityRules.maxIncome || null,
          category: eligibilityRules.category || null,
          occupation: eligibilityRules.occupation || null
        }
      });
      
      // Generate embedding if enabled
      if (options.generateEmbeddings) {
        try {
          const { embedding, textContent, embeddingModel } = 
            await embeddingService.generateSchemeEmbedding(created);
          
          const embeddingString = `[${embedding.join(',')}]`;
          
          await prisma.$executeRawUnsafe(
            `UPDATE "Scheme" SET embedding = $1::vector, "embeddingModel" = $2 WHERE id = $3`,
            embeddingString,
            embeddingModel,
            created.id
          );
          
          // Also store in SchemeEmbedding table
          await prisma.$executeRawUnsafe(
            `INSERT INTO "SchemeEmbedding" (id, "schemeId", embedding, "embeddingModel", "textContent", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2::vector, $3, $4, NOW(), NOW())
             ON CONFLICT ("schemeId") DO UPDATE SET
               embedding = EXCLUDED.embedding,
               "embeddingModel" = EXCLUDED."embeddingModel",
               "textContent" = EXCLUDED."textContent",
               "updatedAt" = NOW()`,
            created.id,
            embeddingString,
            embeddingModel,
            textContent
          );
          
          console.log(`✅ Imported with embedding: ${scheme.schemeName}`);
        } catch (embError) {
          console.log(`⚠️  Imported without embedding: ${scheme.schemeName}`);
          console.error(`   Embedding error: ${embError.message}`);
        }
      } else {
        console.log(`✅ Imported: ${scheme.schemeName}`);
      }
      
      imported++;
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Failed: ${scheme.schemeName}`);
      console.error(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  return { imported, skipped, failed };
}

/**
 * Get statistics
 */
async function getStats() {
  const totalSchemes = await prisma.scheme.count();
  const schemesWithEmbeddings = await prisma.scheme.count({
    where: { embedding: { not: null } }
  });
  
  return {
    totalSchemes,
    schemesWithEmbeddings,
    coveragePercentage: totalSchemes > 0 
      ? ((schemesWithEmbeddings / totalSchemes) * 100).toFixed(2) 
      : 0
  };
}

/**
 * Main execution
 */
async function main() {
  console.log("=" .repeat(60));
  console.log("🚀 SCHEME SCRAPER AND IMPORTER");
  console.log("=" .repeat(60));
  console.log(`Source: ${options.source}`);
  console.log(`Generate Embeddings: ${options.generateEmbeddings}`);
  console.log(`Skip Existing: ${options.skipExisting}`);
  console.log("=" .repeat(60) + "\n");
  
  try {
    // Scrape schemes
    let schemes = [];
    
    if (options.source === 'myscheme' || options.source === 'all') {
      const mySchemeData = await scrapeMyScheme();
      schemes.push(...mySchemeData);
    }
    
    if (schemes.length === 0) {
      console.log("⚠️  No schemes found to import");
      process.exit(0);
    }
    
    // Import schemes
    const { imported, skipped, failed } = await importSchemes(schemes);
    
    // Get final statistics
    const stats = await getStats();
    
    // Print summary
    console.log("\n" + "=" .repeat(60));
    console.log("📊 IMPORT SUMMARY");
    console.log("=" .repeat(60));
    console.log(`Total scraped: ${schemes.length}`);
    console.log(`✅ Imported: ${imported}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("=" .repeat(60));
    console.log("\n📈 DATABASE STATISTICS");
    console.log("=" .repeat(60));
    console.log(`Total schemes: ${stats.totalSchemes}`);
    console.log(`Schemes with embeddings: ${stats.schemesWithEmbeddings}`);
    console.log(`Coverage: ${stats.coveragePercentage}%`);
    console.log("=" .repeat(60) + "\n");
    
    if (failed > 0) {
      console.log("⚠️  Some imports failed. Check the errors above.");
      process.exit(1);
    } else {
      console.log("✅ Import completed successfully!");
      process.exit(0);
    }
    
  } catch (error) {
    console.error("\n❌ Fatal error:");
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();

//  
