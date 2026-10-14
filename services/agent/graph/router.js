import { getModel } from "../config/llmmodels.js";

export const router = async (state) => {

if (state?.file?.path || state?.file?.mimetype === "application/pdf" || state?.agent === "pdfRag") {
  return {
    ...state,
    agent: "pdfRag"
  };
}

if (state?.agent && state?.agent !== "auto") {
  return {
    ...state,
    agent: state.agent
  };
}

  const llm = await getModel("router");

  const prompt = `You are an intent router. Classify the user query into EXACTLY ONE of the following agent categories:

- chat: Coding, software development, debugging, script generation, algorithms, technical questions, general conversations, or Q&A.
- search: Real-time news, live facts, weather, sports scores, or current event lookups.
- pdf: Document/PDF generation requests.
- ppt: Presentation/PowerPoint slide deck generation requests.

Return ONLY ONE word: chat, search, pdf, or ppt.

User Query:
${state.prompt}`;

  const response = await llm.invoke(prompt);
  let route = response.content.trim().toLowerCase();

  if (route.includes("code") || route.includes("coding")) {
    route = "chat";
  }

  return {
    ...state,
    agent: route,
  };
};
