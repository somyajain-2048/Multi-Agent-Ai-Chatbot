import api from "../../utils/axios";

export const deleteConversationAsync = async (id) => {
  try {
    const { data } = await api.delete(`/api/chat/delete-conversation/${id}`);
    return data;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return null;
  }
};
