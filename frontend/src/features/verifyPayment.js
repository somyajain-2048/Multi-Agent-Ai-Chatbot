import api from "../../utils/axios";

export const verifyPayment = async (payload) => {
  try {
    const { data } = await api.post("/api/billing/verify", payload);
    console.log("Verify payment response:", data);
    return data;
  } catch (error) {
    console.error("Verify payment API error:", error?.response?.data || error.message || error);
    throw error;
  }
};