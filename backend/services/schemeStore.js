const schemeCache = new Map();

function buildCacheKey(userId) {
  return String(userId);
}

function getCachedSchemes(userId) {
  const cacheKey = buildCacheKey(userId);

  if (!schemeCache.has(cacheKey)) {
    return null;
  }

  return schemeCache.get(cacheKey);
}

function setCachedSchemes(userId, schemes) {
  const cacheKey = buildCacheKey(userId);

  const payload = {
    schemes,
    updatedAt: new Date().toISOString(),
  };

  schemeCache.set(cacheKey, payload);

  return payload;
}

function clearCachedSchemes(userId) {
  const cacheKey = buildCacheKey(userId);
  schemeCache.delete(cacheKey);
}

module.exports = {
  getCachedSchemes,
  setCachedSchemes,
  clearCachedSchemes,
};

//  
