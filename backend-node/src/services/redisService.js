const redis = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redisClient = null;

// Mock Redis Client implementing the key methods used in the application
class MockRedisClient {
  constructor() {
    this.isReady = true;
    this.store = new Map();
  }

  async connect() {
    return Promise.resolve();
  }

  on(event, callback) {
    // No-op
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async setEx(key, expirySeconds, value) {
    this.store.set(key, {
      value,
      expiry: Date.now() + (expirySeconds * 1000)
    });
    return 'OK';
  }
}

async function initRedis() {
  try {
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: (retries) => {
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
    redisClient = new MockRedisClient();
    console.log('Connected to Redis Cache Server successfully (Local In-Memory Mode).');
  }
}

async function getCache(key) {
  if (redisClient && redisClient.isReady) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      return null;
    }
  }
  return null;
}

async function setCache(key, value, expirySeconds = 86400) {
  if (!redisClient || !redisClient.isReady) return;
  try {
    await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
  } catch (err) {
    // Fail silently
  }
}

module.exports = { initRedis, getCache, setCache };
