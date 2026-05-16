/**
 * Seed Sample Government Schemes
 * 
 * This script populates the database with sample government schemes
 * for testing and demonstration purposes.
 */

const prisma = require('../db/prisma');
const embeddingService = require('../services/embeddingService');

const sampleSchemes = [
  {
    schemeName: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    description: "Financial assistance of Rs. 6000 per year to all farmer families across the country in three equal installments. The scheme aims to supplement the financial needs of farmers for procuring various inputs related to agriculture and allied activities.",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    state: null, // Central scheme
    sourceUrl: "https://pmkisan.gov.in/",
    category: "All",
    occupation: "Farmer",
    minAge: 18,
    maxAge: null,
    maxIncome: null,
    benefits: "Rs. 6000 per year in three installments"
  },
  {
    schemeName: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
    description: "World's largest health insurance scheme providing health cover of Rs. 5 lakhs per family per year for secondary and tertiary care hospitalization. Covers over 10 crore poor and vulnerable families.",
    ministry: "Ministry of Health and Family Welfare",
    state: null,
    sourceUrl: "https://pmjay.gov.in/",
    category: "BPL",
    occupation: "All",
    minAge: null,
    maxAge: null,
    maxIncome: 500000,
    benefits: "Health cover of Rs. 5 lakhs per family per year"
  },
  {
    schemeName: "Pradhan Mantri Awas Yojana (PMAY)",
    description: "Housing for All scheme providing financial assistance for construction of pucca houses with basic amenities to eligible beneficiaries. Aims to provide affordable housing to urban and rural poor.",
    ministry: "Ministry of Housing and Urban Affairs",
    state: null,
    sourceUrl: "https://pmaymis.gov.in/",
    category: "EWS",
    occupation: "All",
    minAge: 18,
    maxAge: null,
    maxIncome: 300000,
    benefits: "Subsidy up to Rs. 2.67 lakhs for house construction"
  },
  {
    schemeName: "Kisan Credit Card (KCC)",
    description: "Credit facility for farmers to meet their agricultural needs including crop production, post-harvest expenses, and consumption requirements. Provides timely and adequate credit support.",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    state: null,
    sourceUrl: "https://www.india.gov.in/spotlight/kisan-credit-card-kcc",
    category: "All",
    occupation: "Farmer",
    minAge: 18,
    maxAge: 75,
    maxIncome: null,
    benefits: "Credit facility with low interest rates"
  },
  {
    schemeName: "Pradhan Mantri Mudra Yojana (PMMY)",
    description: "Provides loans up to Rs. 10 lakh to non-corporate, non-farm small/micro enterprises. Categorized into Shishu (up to Rs. 50,000), Kishore (Rs. 50,000 to Rs. 5 lakh), and Tarun (Rs. 5 lakh to Rs. 10 lakh).",
    ministry: "Ministry of Finance",
    state: null,
    sourceUrl: "https://www.mudra.org.in/",
    category: "All",
    occupation: "Business",
    minAge: 18,
    maxAge: null,
    maxIncome: null,
    benefits: "Loans up to Rs. 10 lakh for business"
  },
  {
    schemeName: "National Social Assistance Programme (NSAP)",
    description: "Provides financial assistance to elderly, widows, and persons with disabilities belonging to Below Poverty Line households. Includes Old Age Pension, Widow Pension, and Disability Pension.",
    ministry: "Ministry of Rural Development",
    state: null,
    sourceUrl: "https://nsap.nic.in/",
    category: "BPL",
    occupation: "All",
    minAge: 60,
    maxAge: null,
    maxIncome: 200000,
    benefits: "Monthly pension of Rs. 200-500"
  },
  {
    schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    description: "Crop insurance scheme providing financial support to farmers suffering crop loss/damage arising from unforeseen events. Covers all food & oilseed crops and annual commercial/horticultural crops.",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    state: null,
    sourceUrl: "https://pmfby.gov.in/",
    category: "All",
    occupation: "Farmer",
    minAge: 18,
    maxAge: null,
    maxIncome: null,
    benefits: "Crop insurance with low premium"
  },
  {
    schemeName: "Beti Bachao Beti Padhao",
    description: "Aims to address declining Child Sex Ratio and related issues of empowerment of girls and women. Focuses on prevention of gender biased sex selection and ensuring survival, protection and education of girl child.",
    ministry: "Ministry of Women and Child Development",
    state: null,
    sourceUrl: "https://wcd.nic.in/bbbp-schemes",
    category: "All",
    occupation: "All",
    minAge: null,
    maxAge: 18,
    maxIncome: null,
    benefits: "Financial incentives and education support for girl child"
  },
  {
    schemeName: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
    description: "Maternity benefit programme providing cash incentive of Rs. 5000 to pregnant women and lactating mothers for first living child. Aims to compensate for wage loss and ensure proper nutrition.",
    ministry: "Ministry of Women and Child Development",
    state: null,
    sourceUrl: "https://pmmvy.wcd.gov.in/",
    category: "All",
    occupation: "All",
    minAge: 19,
    maxAge: 45,
    maxIncome: null,
    benefits: "Rs. 5000 cash incentive for first child"
  },
  {
    schemeName: "National Rural Employment Guarantee Act (NREGA/MGNREGA)",
    description: "Provides at least 100 days of guaranteed wage employment in a financial year to every rural household whose adult members volunteer to do unskilled manual work.",
    ministry: "Ministry of Rural Development",
    state: null,
    sourceUrl: "https://nrega.nic.in/",
    category: "All",
    occupation: "All",
    minAge: 18,
    maxAge: null,
    maxIncome: null,
    benefits: "100 days guaranteed employment per year"
  },
  // State-specific schemes
  {
    schemeName: "West Bengal Krishak Bandhu Scheme",
    description: "Financial assistance to farmers in West Bengal. Provides Rs. 5000 per acre per year in two installments for cultivation support and life insurance coverage.",
    ministry: "Government of West Bengal",
    state: "West Bengal",
    sourceUrl: "https://krishakbandhu.net/",
    category: "All",
    occupation: "Farmer",
    minAge: 18,
    maxAge: 60,
    maxIncome: null,
    benefits: "Rs. 5000 per acre per year"
  },
  {
    schemeName: "Maharashtra Mahatma Jyotiba Phule Jan Arogya Yojana",
    description: "Health insurance scheme for families below poverty line in Maharashtra. Provides cashless treatment up to Rs. 1.5 lakhs per family per year.",
    ministry: "Government of Maharashtra",
    state: "Maharashtra",
    sourceUrl: "https://www.jeevandayee.gov.in/",
    category: "BPL",
    occupation: "All",
    minAge: null,
    maxAge: null,
    maxIncome: 100000,
    benefits: "Health insurance up to Rs. 1.5 lakhs"
  },
  {
    schemeName: "Karnataka Krishi Aranya Protsaha Yojane (KAPY)",
    description: "Agroforestry promotion scheme in Karnataka providing financial assistance for planting trees on agricultural lands. Aims to increase green cover and farmer income.",
    ministry: "Government of Karnataka",
    state: "Karnataka",
    sourceUrl: "https://kapy.karnataka.gov.in/",
    category: "All",
    occupation: "Farmer",
    minAge: 18,
    maxAge: null,
    maxIncome: null,
    benefits: "Financial assistance for agroforestry"
  },
  {
    schemeName: "Tamil Nadu Chief Minister's Comprehensive Health Insurance Scheme",
    description: "Provides health insurance coverage up to Rs. 5 lakhs per family per year for families in Tamil Nadu. Covers a wide range of medical procedures and treatments.",
    ministry: "Government of Tamil Nadu",
    state: "Tamil Nadu",
    sourceUrl: "https://www.cmchistn.com/",
    category: "All",
    occupation: "All",
    minAge: null,
    maxAge: null,
    maxIncome: 72000,
    benefits: "Health insurance up to Rs. 5 lakhs"
  },
  {
    schemeName: "Uttar Pradesh Mukhyamantri Kisan Evam Sarvhit Bima Yojana",
    description: "Accidental insurance scheme for farmers and other citizens of Uttar Pradesh. Provides coverage for accidental death and disability.",
    ministry: "Government of Uttar Pradesh",
    state: "Uttar Pradesh",
    sourceUrl: "https://balrampur.nic.in/scheme/mukhyamantri-kisan-evam-sarvhit-bima-yojana/",
    category: "All",
    occupation: "Farmer",
    minAge: 18,
    maxAge: 70,
    maxIncome: null,
    benefits: "Accidental insurance coverage"
  }
];

async function seedSchemes() {
  console.log('\n🌱 SEEDING SAMPLE GOVERNMENT SCHEMES');
  console.log('═══════════════════════════════════════════════════════════\n');

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const schemeData of sampleSchemes) {
    try {
      // Check if scheme already exists
      const existing = await prisma.scheme.findFirst({
        where: { schemeName: schemeData.schemeName }
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${schemeData.schemeName} (already exists)`);
        skipped++;
        continue;
      }

      // Generate embedding
      console.log(`🔄 Processing: ${schemeData.schemeName}`);
      const embedding = await embeddingService.generateSchemeEmbedding(schemeData);

      // Create scheme with embedding
      await prisma.scheme.create({
        data: {
          ...schemeData,
          embedding: embedding
        }
      });

      console.log(`✅ Created: ${schemeData.schemeName}`);
      created++;

    } catch (error) {
      console.error(`❌ Failed: ${schemeData.schemeName} - ${error.message}`);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SEEDING COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Created: ${created}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📦 Total: ${created + skipped + failed}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Show final statistics
  const total = await prisma.scheme.count();
  // Count schemes with embeddings using raw SQL since Prisma doesn't support vector field queries
  const withEmbeddingsResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "Scheme" WHERE embedding IS NOT NULL
  `;
  const withEmbeddings = Number(withEmbeddingsResult[0].count);
  const coverage = total > 0 ? ((withEmbeddings / total) * 100).toFixed(2) : 0;

  console.log('📊 DATABASE STATISTICS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total schemes: ${total}`);
  console.log(`With embeddings: ${withEmbeddings}`);
  console.log(`Coverage: ${coverage}%`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (coverage === '100.00') {
    console.log('✅ All schemes have embeddings! Vector search is ready.\n');
  }
}

// Run seeding
seedSchemes()
  .catch(error => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

//                                                                      
