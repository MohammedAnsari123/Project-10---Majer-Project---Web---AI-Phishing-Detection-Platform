const redis = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redisClient = null;

// Local in-memory fallback cache
const localCache = new Map();

function getLocalCacheItem(key) {
  const item = localCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    localCache.delete(key);
    return null;
  }
  return item.value;
}

function setLocalCacheItem(key, value, expirySeconds) {
  localCache.set(key, {
    value,
    expiry: Date.now() + (expirySeconds * 1000)
  });
}

async function initRedis() {
  try {
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: (retries) => {
          // Retry connection every 3 seconds, up to 3 times, then stop retrying to avoid memory leaks
          if (retries > 3) return false;
          return 3000;
        }
      }
    });
    redisClient.on('error', (err) => {
      // Catch silently
    });
    await redisClient.connect();
    console.log('Connected to Redis Cache Server successfully.');
  } catch (error) {
    console.warn('Redis Cache Server offline. Continuing scanner with local in-memory fallback cache.');
    redisClient = null;
  }
}

async function getCache(key) {
  if (redisClient && redisClient.isReady) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      return getLocalCacheItem(key);
    }
  }
  return getLocalCacheItem(key);
}

async function setCache(key, value, expirySeconds = 86400) {
  // Always update local cache as fallback/secondary layer
  setLocalCacheItem(key, value, expirySeconds);

  if (!redisClient || !redisClient.isReady) return;
  try {
    await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
  } catch (err) {
    // Fail silently
  }
}

module.exports = { initRedis, getCache, setCache };
