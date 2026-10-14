import dotenv from "dotenv";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

dotenv.config();

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: process.env.EMBEDDING_MODEL || "text-embedding-004",
  apiKey: process.env.GOOGLE_API_KEY,
});