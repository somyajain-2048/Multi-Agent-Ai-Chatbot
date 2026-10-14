import api from "../../utils/axios";

export const sendMessage = async (formData) => {
  try {
    const { data } = await api.post("/api/agent/chat", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } catch (error) {
    console.error("Error communicating with AI Agent:", error);
    throw error;
  }
};

export const sendMessageToAgent = async (prompt, conversationId, agent, file = null) => {
  try {
    const formData = new FormData();
    if (prompt) formData.append("prompt", prompt);
    if (conversationId) formData.append("conversationId", conversationId);
    if (agent) formData.append("agent", agent);
    if (file) formData.append("file", file);

    return await sendMessage(formData);
  } catch (error) {
    console.error("Error communicating with AI Agent:", error);
    throw error;
  }
};
