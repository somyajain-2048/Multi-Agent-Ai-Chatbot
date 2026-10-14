import redis from "../../../shared/redis/redis.js";
import { getMessages } from "../utils/getMessages.js";

export const getMemory = async (conversationId) => {
    if (!conversationId) return [];
    const key = `messages:${conversationId}`;
    try {
        try {
            const cached = await redis.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (redisErr) {
            console.warn("Redis unavailable in getMemory, falling back to chat service:", redisErr?.message || redisErr);
        }

        const messages = (await getMessages(conversationId)) || [];
        if (Array.isArray(messages) && messages.length > 0) {
            try {
                await redis.set(key, JSON.stringify(messages), "EX", 24 * 60 * 60);
            } catch (_) {}
        }

        return Array.isArray(messages) ? messages : [];
    } catch (error) {
        console.error("getMemory error:", error?.message || error);
        return [];
    }
};

export const addMessage = async (conversationId, role, content) => {
    if (!conversationId || !content) return;
    const key = `messages:${conversationId}`;
    try {
        const rawMessages = await redis.get(key);
        const messages = rawMessages ? JSON.parse(rawMessages) : [];
        messages.push({
            role,
            content
        });

        if (messages.length > 20) {
            messages.shift();
        }

        await redis.set(key, JSON.stringify(messages), "EX", 24 * 60 * 60);
    } catch (error) {
        console.warn("addMessage Redis cache skipped:", error?.message || error);
    }
};