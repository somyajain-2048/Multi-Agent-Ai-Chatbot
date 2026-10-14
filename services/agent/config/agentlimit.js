import redis from "../../../shared/redis/redis.js";

const Limits = {
    chat: 20,
    coding: 5,
    pdf: 2,
    ppt: 5,
    image: 5,
    search: 5
};

const AgentActionMap = {
    pdf: "Unable to generate PDF",
    pdfRag: "Unable to generate PDF",
    ppt: "Unable to generate PPT",
    image: "Unable to generate image",
    coding: "Unable to generate code",
    search: "Unable to perform search",
    chat: "Unable to respond"
};

export const checkAgentLimit = async (userId, agent) => {
    const max = Limits[agent] || Limits["chat"];
    const key = `rate:${userId}:${agent}`;

    let count = 0;
    let ttl = 60;

    try {
        count = await redis.incr(key);

        if (count === 1) {
            await redis.expire(key, 60);
        }

        ttl = await redis.ttl(key);
    } catch (redisErr) {
        console.warn("Redis unavailable for rate limiting, skipping check:", redisErr?.message || redisErr);
        return {
            remaining: max,
            limit: max
        };
    }

    if (count > max) {
        const minutes = Math.floor(ttl / 60);
        const seconds = ttl % 60;
        const timeStr = minutes > 0 ? `${minutes}m ${seconds}` : `${seconds}`;
        const actionText = AgentActionMap[agent] || `Unable to process ${agent}`;
        const userMessage = `${actionText}. Try again in ${timeStr} sec.`;

        const error = new Error(userMessage);
        error.status = 429;
        error.data = {
            success: false,
            agent,
            limit: max,
            remainingTime: ttl,
            retryAfter: `${timeStr} sec`,
            message: userMessage
        };
        throw error;
    }

    return {
        remaining: max - count,
        limit: max
    };
};