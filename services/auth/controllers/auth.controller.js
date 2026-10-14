import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import redis from "../../../shared/redis/redis.js";

export const login = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = await getAuth(app).verifyIdToken(token);
    let user = await User.findOne({
      firebaseUid: decoded.uid
    });

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture
      });
    }

    const sessionId = crypto.randomUUID();

    const sessionData = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan || "free",
      credits: user.credits !== undefined ? user.credits : 100,
      totalCredits: user.totalCredits !== undefined ? user.totalCredits : 100,
      planExpiresAt: user.planExpiresAt
    };

    await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), "EX", 7 * 24 * 60 * 60);

    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: `Login error: ${error.message || error}` });
  }
};

export const logOut = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;
    if (sessionId) {
      await redis.del(`session:${sessionId}`);
    }

    res.clearCookie("session");
    return res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: `Logout error: ${error.message || error}` });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      userId: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan || "free",
      credits: user.credits !== undefined ? user.credits : 100,
      totalCredits: user.totalCredits !== undefined ? user.totalCredits : 100,
      planExpiresAt: user.planExpiresAt
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: `Get user error: ${error.message || error}` });
  }
};

export const updateUserPayment = async (req, res) => {
  try {
    const { plan, credits, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.plan = plan;
    user.credits = (user.credits || 0) + Number(credits || 0);
    user.totalCredits = (user.totalCredits || 0) + Number(credits || 0);
    user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    // Update active Redis sessions for this user
    try {
      const keys = await redis.keys("session:*");
      for (const key of keys) {
        const raw = await redis.get(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.userId === userId || parsed.userId === user._id.toString()) {
            parsed.plan = user.plan;
            parsed.credits = user.credits;
            parsed.totalCredits = user.totalCredits;
            parsed.planExpiresAt = user.planExpiresAt;
            const ttl = await redis.ttl(key);
            await redis.set(key, JSON.stringify(parsed), "EX", ttl > 0 ? ttl : 7 * 24 * 60 * 60);
          }
        }
      }
    } catch (redisErr) {
      console.warn("Failed to update active sessions in Redis:", redisErr);
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Update user payment error:", error);
    return res.status(500).json({ message: `Update user payment error: ${error.message || error}` });
  }
};


export const deductCredits = async (req, res) => {
  try {
    const { userId, agent } = req.body;

    const COST = {
      chat: 1,
      search: 5,
      coding: 10,
      pdf: 10,
      ppt: 10,
      vision: 10
    };

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requiredCredits = COST[agent] || 1;
    if (user.credits < requiredCredits) {
      return res.status(402).json({ message: "Insufficient credits. Please upgrade your plan." });
    }

    user.credits -= requiredCredits;
    await user.save();

    // Update active Redis sessions for this user
    try {
      const keys = await redis.keys("session:*");
      for (const key of keys) {
        const raw = await redis.get(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.userId === userId || parsed.userId === user._id.toString()) {
            parsed.credits = user.credits;
            const ttl = await redis.ttl(key);
            await redis.set(key, JSON.stringify(parsed), "EX", ttl > 0 ? ttl : 7 * 24 * 60 * 60);
          }
        }
      }
    } catch (redisErr) {
      console.warn("Failed to update active sessions in Redis:", redisErr);
    }

    return res.status(200).json({ success: true, credits: user.credits });

  } catch (error) {
    console.error("Deduct credits error:", error);
    return res.status(500).json({ message: `Deduct credits error: ${error.message || error}` });
  }
};
