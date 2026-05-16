/**
 * Fix Failed Migration Script
 * 
 * This script resolves the P3009 error by marking the failed migration
 * as rolled back, allowing Prisma to reapply it cleanly.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixFailedMigration() {
  try {
    console.log('🔧 Fixing failed migration...\n');

    // Mark the failed migration as rolled back
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "_prisma_migrations"
      SET rolled_back_at = NOW(),
          finished_at = NULL
      WHERE migration_name = '20240103000000_add_pgvector'
        AND finished_at IS NULL;
    `);

    console.log(`✅ Marked failed migration as rolled back (${result} row(s) updated)`);
    console.log('\n📋 Current migration status:');

    // Show current migration status
    const migrations = await prisma.$queryRawUnsafe(`
      SELECT migration_name, started_at, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY started_at DESC
      LIMIT 5;
    `);

    console.table(migrations);

    console.log('\n✨ Migration state fixed! You can now run:');
    console.log('   docker compose restart api');
    console.log('   OR');
    console.log('   npm run migrate:deploy');

  } catch (error) {
    console.error('❌ Error fixing migration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixFailedMigration();

//                                                                      
