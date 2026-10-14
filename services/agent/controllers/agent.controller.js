import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";
import redis from "../../../shared/redis/redis.js";

export const agent = async (req, res,next) => {
    try {
        const { prompt, conversationId, agent } = req.body;
        const file = req.file;
        const userId = req.headers["x-user-id"];

        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        if (conversationId) {
            await addMessage(conversationId, "user", prompt);

            try {


                await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
                    conversationId,
                    role: "user",
                    content: prompt
                });
            } catch (chatErr) {
                console.warn("Warning saving user message to chat service:", chatErr?.message || chatErr);
            }
        }

        const result = await graph.invoke({
            prompt,
            conversationId,
            agent,
            userId,
            file
        });

        const response = result.aiResponse;

        if (response && conversationId) {
            const formattedContent = typeof response === "string" ? response : JSON.stringify(response);
            await addMessage(conversationId, "assistant", formattedContent);
            try {
                await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
                    conversationId,
                    role: "assistant",
                    content: formattedContent,
                    images: result.images
                });
            } catch (chatErr) {
                console.warn("Warning saving assistant message to chat service:", chatErr?.message || chatErr);
            }
        }

        return res.status(200).json({
            answer: result.aiResponse,
            aiResponse: result.aiResponse,
            images: result.images,
            credits: result.credits
        });
    } catch (error) {
        console.error("Agent controller error:", error?.message || error);
        if (error.status) {
            return res.status(error.status).json(error.data || { message: error.message });
        }
        return res.status(500).json({ message: `Agent error: ${error?.message || error}` });
    }
};