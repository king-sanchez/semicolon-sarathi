const { chromium } = require('playwright');
const prisma = require('../db/prisma');
const embeddingService = require('./embeddingService');
const { getEnabledSources, getStateSource } = require('../config/scrapingSources');

/**
 * AutoScrapingService - Automatically scrapes government websites when no schemes found
 * 
 * Workflow:
 * 1. Triggered when hybrid retrieval returns 0 results
 * 2. Attempts to scrape from configured sources (priority-based)
 * 3. Stores new schemes in database with embeddings
 * 4. Retries hybrid retrieval with newly scraped data
 */
class AutoScrapingService {
  constructor() {
    this.maxScrapingAttempts = 3;
    this.scrapingTimeout = 60000; // 60 seconds
    this.isScrapingInProgress = false;
    this.lastScrapingTime = null;
    this.minScrapingInterval = 300000; // 5 minutes between scraping attempts
  }

  /**
   * Check if scraping should be triggered
   */
  shouldTriggerScraping() {
    // Don't scrape if already in progress
    if (this.isScrapingInProgress) {
      console.log('⏳ Scraping already in progress, skipping...');
      return false;
    }

    // Rate limiting: Don't scrape too frequently
    if (this.lastScrapingTime) {
      const timeSinceLastScraping = Date.now() - this.lastScrapingTime;
      if (timeSinceLastScraping < this.minScrapingInterval) {
        console.log(`⏳ Too soon since last scraping (${Math.round(timeSinceLastScraping / 1000)}s ago), skipping...`);
        return false;
      }
    }

    return true;
  }

  /**
   * Scrape MyScheme.gov.in (primary source)
   */
  async scrapeMyScheme(browser) {
    console.log('🌐 Scraping MyScheme.gov.in...');
    
    const page = await browser.newPage();
    const schemes = [];

    try {
      await page.goto('https://www.myscheme.gov.in/search', {
        waitUntil: 'networkidle',
        timeout: this.scrapingTimeout
      });

      // Wait for scheme cards
      await page.waitForSelector('.scheme-card, .scheme-item, [class*="scheme"]', {
        timeout: 10000
      }).catch(() => {
        console.log('⚠️ No scheme cards found on page');
      });

      // Extract scheme data
      const schemeElements = await page.$$('.scheme-card, .scheme-item, [class*="scheme"]');
      
      for (const element of schemeElements.slice(0, 50)) { // Limit to 50 schemes per scrape
        try {
          const schemeName = await element.$eval('h2, h3, .title, [class*="title"]', el => el.textContent.trim())
            .catch(() => null);
          
          const description = await element.$eval('p, .description, [class*="desc"]', el => el.textContent.trim())
            .catch(() => null);

          const link = await element.$eval('a', el => el.href)
            .catch(() => null);

          if (schemeName && description) {
            schemes.push({
              schemeName,
              description,
              sourceUrl: link || 'https://www.myscheme.gov.in',
              ministry: 'Various',
              state: null, // Central schemes
              category: null,
              occupation: null
            });
          }
        } catch (err) {
          console.log('⚠️ Error extracting scheme:', err.message);
        }
      }

      console.log(`✅ Scraped ${schemes.length} schemes from MyScheme.gov.in`);
    } catch (error) {
      console.error('❌ Error scraping MyScheme:', error.message);
    } finally {
      await page.close();
    }

    return schemes;
  }

  /**
   * Scrape a generic government website
   */
  async scrapeGenericSource(browser, sourceConfig) {
    console.log(`🌐 Scraping ${sourceConfig.name}...`);
    
    const page = await browser.newPage();
    const schemes = [];

    try {
      await page.goto(sourceConfig.url, {
        waitUntil: 'networkidle',
        timeout: this.scrapingTimeout
      });

      // Generic selectors for scheme information
      const schemeSelectors = [
        '.scheme', '.scheme-card', '.scheme-item',
        '[class*="scheme"]', '[class*="program"]',
        'article', '.card'
      ];

      for (const selector of schemeSelectors) {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          
          for (const element of elements.slice(0, 30)) {
            try {
              const text = await element.textContent();
              if (text && text.length > 50) {
                schemes.push({
                  schemeName: text.substring(0, 200).trim(),
                  description: text.substring(0, 1000).trim(),
                  sourceUrl: sourceConfig.url,
                  ministry: sourceConfig.name,
                  state: sourceConfig.key.includes('state') ? sourceConfig.name : null
                });
              }
            } catch (err) {
              // Skip this element
            }
          }
          
          if (schemes.length > 0) break;
        }
      }

      console.log(`✅ Scraped ${schemes.length} schemes from ${sourceConfig.name}`);
    } catch (error) {
      console.error(`❌ Error scraping ${sourceConfig.name}:`, error.message);
    } finally {
      await page.close();
    }

    return schemes;
  }

  /**
   * Store scraped schemes in database with embeddings
   */
  async storeSchemes(schemes) {
    console.log(`\n💾 Storing ${schemes.length} schemes in database...`);
    
    let stored = 0;
    let skipped = 0;

    for (const scheme of schemes) {
      try {
        // Check if scheme already exists
        const existing = await prisma.scheme.findFirst({
          where: {
            schemeName: scheme.schemeName
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Generate embedding
        const embedding = await embeddingService.generateSchemeEmbedding(scheme);

        // Store in database
        await prisma.scheme.create({
          data: {
            schemeName: scheme.schemeName,
            description: scheme.description,
            sourceUrl: scheme.sourceUrl,
            ministry: scheme.ministry,
            state: scheme.state,
            category: scheme.category,
            occupation: scheme.occupation,
            embedding: embedding
          }
        });

        stored++;
      } catch (error) {
        console.error(`❌ Error storing scheme "${scheme.schemeName}":`, error.message);
      }
    }

    console.log(`✅ Stored: ${stored} | Skipped (duplicates): ${skipped}`);
    return stored;
  }

  /**
   * Main auto-scraping workflow
   * Triggered when no eligible schemes are found
   */
  async triggerAutoScraping(userProfile) {
    if (!this.shouldTriggerScraping()) {
      return { success: false, reason: 'Rate limited or already in progress' };
    }

    this.isScrapingInProgress = true;
    this.lastScrapingTime = Date.now();

    console.log('\n🤖 AUTO-SCRAPING TRIGGERED');
    console.log('═══════════════════════════════════════');
    console.log(`User Profile: ${userProfile.state}, ${userProfile.occupation}`);
    console.log('Reason: No eligible schemes found in database');
    console.log('═══════════════════════════════════════\n');

    let browser;
    let totalScraped = 0;

    try {
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // Priority 1: Scrape MyScheme.gov.in (primary source)
      const mySchemeData = await this.scrapeMyScheme(browser);
      if (mySchemeData.length > 0) {
        const stored = await this.storeSchemes(mySchemeData);
        totalScraped += stored;
      }

      // Priority 2: Scrape state-specific source if available
      if (userProfile.state) {
        const stateSource = getStateSource(userProfile.state);
        if (stateSource && stateSource.enabled) {
          const stateData = await this.scrapeGenericSource(browser, stateSource);
          if (stateData.length > 0) {
            const stored = await this.storeSchemes(stateData);
            totalScraped += stored;
          }
        }
      }

      // Priority 3: Scrape other enabled sources (limit to 2 additional sources)
      const otherSources = getEnabledSources()
        .filter(s => s.priority >= 3)
        .slice(0, 2);

      for (const source of otherSources) {
        const data = await this.scrapeGenericSource(browser, source);
        if (data.length > 0) {
          const stored = await this.storeSchemes(data);
          totalScraped += stored;
        }
      }

      console.log('\n✅ AUTO-SCRAPING COMPLETE');
      console.log(`Total new schemes added: ${totalScraped}`);

      return {
        success: true,
        schemesAdded: totalScraped,
        message: `Successfully scraped and stored ${totalScraped} new schemes`
      };

    } catch (error) {
      console.error('❌ Auto-scraping failed:', error.message);
      return {
        success: false,
        reason: error.message
      };
    } finally {
      if (browser) {
        await browser.close();
      }
      this.isScrapingInProgress = false;
    }
  }
}

// Singleton instance
const autoScrapingService = new AutoScrapingService();

module.exports = autoScrapingService;

//                                                                      
