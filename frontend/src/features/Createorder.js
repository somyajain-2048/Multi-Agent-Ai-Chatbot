import api from "../../utils/axios";

export const createOrder = async (payload) => {
  try {
    const { data } = await api.post("/api/billing/create", payload);
    console.log("Create order response:", data);
    return data;
  } catch (error) {
    console.error("Create order API error:", error?.response?.data || error.message || error);
    throw error;
  }
};