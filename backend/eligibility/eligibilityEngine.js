const prisma = require("../db/prisma");

/**
 * EligibilityEngine - SQL-based eligibility filtering
 * Uses PostgreSQL queries with indexed columns for efficient filtering
 */

/**
 * Check if a user is eligible for a scheme (legacy in-memory check)
 * @param {Object} user - User profile
 * @param {Object} scheme - Scheme object
 * @returns {boolean} - True if eligible
 */
function isEligible(user, scheme) {
  // Check age eligibility
  if (scheme.minAge !== null && user.age < scheme.minAge) {
    return false;
  }

  if (scheme.maxAge !== null && user.age > scheme.maxAge) {
    return false;
  }

  // Check income eligibility
  if (scheme.maxIncome !== null && user.annualIncome > scheme.maxIncome) {
    return false;
  }

  // Check state eligibility (null means central scheme - eligible for all states)
  if (scheme.state !== null && scheme.state !== 'All States' && scheme.state !== user.state) {
    return false;
  }

  // Check category eligibility (null means all categories)
  if (scheme.category !== null && scheme.category !== 'All' && scheme.category !== user.category) {
    return false;
  }

  // Check occupation eligibility (null means all occupations)
  if (scheme.occupation !== null && scheme.occupation !== 'All' && scheme.occupation !== user.occupation) {
    return false;
  }

  // Check legacy eligibilityRules JSON field if present
  if (scheme.eligibilityRules) {
    const rules = typeof scheme.eligibilityRules === 'string'
      ? JSON.parse(scheme.eligibilityRules)
      : scheme.eligibilityRules;

    if (rules.minAge && user.age < rules.minAge) {
      return false;
    }

    if (rules.maxAge && user.age > rules.maxAge) {
      return false;
    }

    if (rules.maxIncome && user.annualIncome > rules.maxIncome) {
      return false;
    }

    if (rules.state && rules.state !== user.state) {
      return false;
    }

    if (rules.category && rules.category !== user.category) {
      return false;
    }

    if (rules.occupation && rules.occupation !== user.occupation) {
      return false;
    }
  }

  return true;
}

/**
 * Compute eligible schemes using in-memory filtering (legacy)
 * @param {Object} user - User profile
 * @param {Array} schemes - Array of schemes
 * @returns {Array} - Filtered eligible schemes
 */
function computeEligibleSchemes(user, schemes) {
  return schemes.filter((scheme) => isEligible(user, scheme));
}

/**
 * Build SQL WHERE clause for eligibility filtering
 * @param {Object} user - User profile
 * @returns {Object} - Prisma where clause
 */
function buildEligibilityWhereClause(user) {
  const conditions = [];

  // State filter: match user's state OR central schemes (state = null)
  if (user.state) {
    conditions.push({
      OR: [
        { state: user.state },
        { state: null },
        { state: 'All States' }
      ]
    });
  }

  // Age filter: user age must be within scheme's age range
  if (user.age) {
    conditions.push({
      OR: [
        { minAge: null },
        { minAge: { lte: user.age } }
      ]
    });
    conditions.push({
      OR: [
        { maxAge: null },
        { maxAge: { gte: user.age } }
      ]
    });
  }

  // Income filter: user income must be below scheme's maximum
  if (user.annualIncome) {
    conditions.push({
      OR: [
        { maxIncome: null },
        { maxIncome: { gte: user.annualIncome } }
      ]
    });
  }

  // Category filter: match user's category OR schemes for all categories
  if (user.category) {
    conditions.push({
      OR: [
        { category: user.category },
        { category: null },
        { category: 'All' }
      ]
    });
  }

  // Occupation filter: match user's occupation OR schemes for all occupations
  if (user.occupation) {
    conditions.push({
      OR: [
        { occupation: user.occupation },
        { occupation: null },
        { occupation: 'All' }
      ]
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Filter eligible schemes using SQL queries (optimized with indexes)
 * @param {Object} user - User profile
 * @returns {Promise<Array>} - Array of eligible schemes
 */
async function filterEligibleSchemesBySQL(user) {
  try {
    const whereClause = buildEligibilityWhereClause(user);

    const eligibleSchemes = await prisma.scheme.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return eligibleSchemes;
  } catch (error) {
    console.error("SQL eligibility filtering error:", error.message);
    throw new Error(`Failed to filter eligible schemes: ${error.message}`);
  }
}

/**
 * Get count of eligible schemes for a user
 * @param {Object} user - User profile
 * @returns {Promise<number>} - Count of eligible schemes
 */
async function countEligibleSchemes(user) {
  try {
    const whereClause = buildEligibilityWhereClause(user);
    return await prisma.scheme.count({ where: whereClause });
  } catch (error) {
    console.error("Count eligible schemes error:", error.message);
    throw error;
  }
}

/**
 * Get eligible scheme IDs only (for hybrid retrieval)
 * @param {Object} user - User profile
 * @returns {Promise<Array>} - Array of scheme IDs
 */
async function getEligibleSchemeIds(user) {
  try {
    const whereClause = buildEligibilityWhereClause(user);

    const schemes = await prisma.scheme.findMany({
      where: whereClause,
      select: { id: true }
    });

    return schemes.map(s => s.id);
  } catch (error) {
    console.error("Get eligible scheme IDs error:", error.message);
    throw error;
  }
}

module.exports = {
  isEligible,
  computeEligibleSchemes,
  buildEligibilityWhereClause,
  filterEligibleSchemesBySQL,
  countEligibleSchemes,
  getEligibleSchemeIds
};
