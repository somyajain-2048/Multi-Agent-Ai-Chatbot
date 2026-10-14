import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 0,       // fail fast — don't hang requests waiting for Redis
    lazyConnect: true,             // don't connect until first command
    enableOfflineQueue: false,     // reject commands immediately when disconnected
    retryStrategy: (times) => {
        // Reconnect every 5s, but don't block in-flight requests
        return Math.min(times * 1000, 5000);
    }
});

redis.on("connect", () => {
    console.log("redis connected");
});

redis.on("error", (err) => {
    console.error("redis connection error:", err.message);
});

export default redis;