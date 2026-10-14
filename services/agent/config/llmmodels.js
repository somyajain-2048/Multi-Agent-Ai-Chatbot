import dotenv from "dotenv";
// import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

dotenv.config();

// let groq;
let gemini;

export const getModel = async (agent) => {
  // if (!groq) {
  //   groq = new ChatGroq({
  //     model: "whisper-large-v3",
  //     apiKey: process.env.GROQ_API_KEY,
  //   });
  // }

  if (!gemini) {
    gemini = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }

  switch (agent) {
    case "chat":
    case "search":
    default:
      return gemini;
  }
};