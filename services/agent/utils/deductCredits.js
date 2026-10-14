import axios from "axios";

export const deductCredits = async (userId, agent) => {
  try {
    const { data } = await axios.post(`${process.env.AUTH_SERVICE}/deduct-credits`, { userId, agent });
    return data;
  } catch (error) {
    console.error("Deduct credits error:", error?.response?.data || error.message);
    const message = error?.response?.data?.message || "Insufficient credits. Please upgrade your plan.";
    const err = new Error(message);
    err.status = error?.response?.status || 402;
    err.data = { message };
    throw err;
  }
};