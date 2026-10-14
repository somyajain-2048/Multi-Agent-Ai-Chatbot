import axios from "axios";

export const getMessages = async (conversationId) => {
    try {
        const { data } = await axios.post(`${process.env.CHAT_SERVICE}/get-messages/${conversationId}`);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error fetching messages in agent service:", error?.message || error);
        return [];
    }
};