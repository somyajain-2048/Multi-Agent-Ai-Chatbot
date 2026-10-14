import axios from "axios";
import redis from "../../shared/redis/redis.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    if (userId) {
      try {
        const { data } = await axios.get(`${process.env.AUTH_SERVICE}/user/${userId}`);
        if (data) {
          const sessionId = req.cookies?.session;
          if (sessionId) {
            try {
              const ttl = await redis.ttl(`session:${sessionId}`);
              await redis.set(`session:${sessionId}`, JSON.stringify(data), "EX", ttl > 0 ? ttl : 7 * 24 * 60 * 60);
            } catch (_) {}
          }
          return res.status(200).json(data);
        }
      } catch (authErr) {
        // Fall back to cached session if auth request fails
      }
    }
    return res.status(200).json(req.user);
  } catch (error) {
    return res.status(500).json({ message: `get current user error ${error}` });
  }
};
