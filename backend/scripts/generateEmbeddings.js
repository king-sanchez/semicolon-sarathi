const prisma = require("../db/prisma");
const embeddingService = require("../services/embeddingService");

/**
 * Script to generate embeddings for all schemes in the database
 * This should be run after:
 * 1. Running the pgvector migration
 * 2. Populating the database with schemes
 * 
 * Usage: node scripts/generateEmbeddings.js [options]
 * Options:
 *   --force: Regenerate embeddings even if they already exist
 *   --batch-size=N: Process N schemes at a time (default: 10)
 */

async function generateEmbeddings(options = {}) {
  const { force = false, batchSize = 10 } = options;

  try {
    console.log("🚀 Starting embedding generation process...\n");

    // Get schemes that need embeddings
    const whereClause = force ? {} : { embedding: null };
    
    const schemes = await prisma.scheme.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    if (schemes.length === 0) {
      console.log("✅ All schemes already have embeddings!");
      return;
    }

    console.log(`📊 Found ${schemes.length} schemes to process`);
    console.log(`⚙️  Batch size: ${batchSize}\n`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Process schemes in batches
    for (let i = 0; i < schemes.length; i += batchSize) {
      const batch = schemes.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(schemes.length / batchSize)}`);
      console.log(`   Schemes ${i + 1} to ${Math.min(i + batchSize, schemes.length)} of ${schemes.length}`);

      for (const scheme of batch) {
        try {
          console.log(`   ⏳ Processing: ${scheme.schemeName}`);

          // Generate embedding for the scheme
          const { embedding, textContent, embeddingModel } = await embeddingService.generateSchemeEmbedding(scheme);

          // Convert embedding array to pgvector format string
          const embeddingString = `[${embedding.join(',')}]`;

          // Update scheme with embedding using raw SQL
          await prisma.$executeRawUnsafe(
            `UPDATE "Scheme" SET embedding = $1::vector, "embeddingModel" = $2 WHERE id = $3`,
            embeddingString,
            embeddingModel,
            scheme.id
          );

          // Also store in SchemeEmbedding table for backup/analysis
          await prisma.$executeRawUnsafe(
            `INSERT INTO "SchemeEmbedding" (id, "schemeId", embedding, "embeddingModel", "textContent", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2::vector, $3, $4, NOW(), NOW())
             ON CONFLICT ("schemeId") DO UPDATE SET
               embedding = EXCLUDED.embedding,
               "embeddingModel" = EXCLUDED."embeddingModel",
               "textContent" = EXCLUDED."textContent",
               "updatedAt" = NOW()`,
            scheme.id,
            embeddingString,
            embeddingModel,
            textContent
          );

          succeeded++;
          console.log(`   ✅ Success: ${scheme.schemeName}`);

        } catch (error) {
          failed++;
          console.error(`   ❌ Failed: ${scheme.schemeName}`);
          console.error(`      Error: ${error.message}`);
        }

        processed++;
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < schemes.length) {
        console.log(`   ⏸️  Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📈 EMBEDDING GENERATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total processed: ${processed}`);
    console.log(`✅ Succeeded: ${succeeded}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success rate: ${((succeeded / processed) * 100).toFixed(2)}%`);
    console.log("=".repeat(60) + "\n");

    // Get final statistics
    const stats = await getEmbeddingStats();
    console.log("📊 DATABASE STATISTICS");
    console.log("=".repeat(60));
    console.log(`Total schemes: ${stats.totalSchemes}`);
    console.log(`Schemes with embeddings: ${stats.schemesWithEmbeddings}`);
    console.log(`Coverage: ${stats.coveragePercentage}%`);
    console.log("=".repeat(60) + "\n");

    if (failed > 0) {
      console.log("⚠️  Some embeddings failed to generate. Check the errors above.");
      process.exit(1);
    } else {
      console.log("✅ All embeddings generated successfully!");
      process.exit(0);
    }

  } catch (error) {
    console.error("\n❌ Fatal error during embedding generation:");
    console.error(error);
    process.exit(1);
  }
}

async function getEmbeddingStats() {
  const totalSchemes = await prisma.scheme.count();
  const schemesWithEmbeddings = await prisma.scheme.count({
    where: { embedding: { not: null } }
  });

  return {
    totalSchemes,
    schemesWithEmbeddings,
    schemesWithoutEmbeddings: totalSchemes - schemesWithEmbeddings,
    coveragePercentage: totalSchemes > 0 
      ? ((schemesWithEmbeddings / totalSchemes) * 100).toFixed(2) 
      : 0
  };
}

async function regenerateSpecificScheme(schemeId) {
  try {
    console.log(`🔄 Regenerating embedding for scheme: ${schemeId}\n`);

    const scheme = await prisma.scheme.findUnique({
      where: { id: schemeId }
    });

    if (!scheme) {
      console.error(`❌ Scheme not found: ${schemeId}`);
      process.exit(1);
    }

    console.log(`📝 Scheme: ${scheme.schemeName}`);

    const { embedding, textContent, embeddingModel } = await embeddingService.generateSchemeEmbedding(scheme);
    const embeddingString = `[${embedding.join(',')}]`;

    await prisma.$executeRawUnsafe(
      `UPDATE "Scheme" SET embedding = $1::vector, "embeddingModel" = $2 WHERE id = $3`,
      embeddingString,
      embeddingModel,
      scheme.id
    );

    console.log(`✅ Successfully regenerated embedding for: ${scheme.schemeName}\n`);
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error regenerating embedding:");
    console.error(error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  batchSize: 10
};

// Check for batch size argument
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
if (batchSizeArg) {
  options.batchSize = parseInt(batchSizeArg.split('=')[1]) || 10;
}

// Check for specific scheme ID
const schemeIdArg = args.find(arg => arg.startsWith('--scheme-id='));
if (schemeIdArg) {
  const schemeId = schemeIdArg.split('=')[1];
  regenerateSpecificScheme(schemeId);
} else {
  // Run main embedding generation
  generateEmbeddings(options);
}

//  
