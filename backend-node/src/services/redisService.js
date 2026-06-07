const redis = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redisClient = null;

async function initRedis() {
  try {
    redisClient = redis.createClient({ url: redisUrl });
    redisClient.on('error', (err) => {
      // Catch silently to avoid polluting server startup logs with poll connection failures
    });
    await redisClient.connect();
    console.log('Connected to Redis Cache Server successfully.');
  } catch (error) {
    console.warn('Redis Cache Server offline. Continuing scanner without local caching layer.');
    redisClient = null;
  }
}

async function getCache(key) {
  if (!redisClient || !redisClient.isOpen) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    return null;
  }
}

async function setCache(key, value, expirySeconds = 86400) {
  if (!redisClient || !redisClient.isOpen) return;
  try {
    await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
  } catch (err) {
    // Fail silently
  }
}

module.exports = { initRedis, getCache, setCache };
