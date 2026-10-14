import api from "../../utils/axios";

export const getMessages = async (conversationId) => {
  if (!conversationId) return [];
  try {
    const { data } = await api.post(`/api/chat/get-messages/${conversationId}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};
