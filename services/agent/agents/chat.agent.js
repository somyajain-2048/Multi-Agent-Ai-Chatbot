import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmmodels.js";
import { getMemory } from "../config/memory.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentlimit.js";

export const chatAgent = async (state) => {
    if (state?.aiResponse) {
        return state;
    }
    try {
        await checkAgentLimit(state.userId, "chat");
        const creditRes = await deductCredits(state.userId, "chat");
        const llm = await getModel("chat");
        const history = (await getMemory(state.conversationId)) || [];

        let searchContext = "";
        if (state.searchResults) {
            const rawResults = typeof state.searchResults === "string"
                ? state.searchResults
                : JSON.stringify(state.searchResults);

            searchContext = `Real-time Web Search Data:
${rawResults}

Instruction: Extract the exact, accurate factual answer from the real-time search data above to answer the user query.`;
        }

        const systemPrompt = `You are CortexAI, an intelligent AI assistant built to answer queries and write code like ChatGPT.

${searchContext}

Response Guidelines:
1. General Questions:
   - Format your response using clean, well-structured Markdown (headings, short paragraphs, bullet lists).
   - Keep answers clear, accurate, and structured.

2. Coding & Technical Requests (CRITICAL):
   Whenever the user asks to write, generate, solve, debug, or explain code/algorithms:
   a) BRIEF EXPLANATION: Start with a brief, clear explanation (1-3 concise sentences) outlining the logic or approach.
   b) PRODUCTION CODE: Provide complete, clean, production-ready code wrapped in proper Markdown code blocks with exact language tags (e.g., \`\`\`javascript, \`\`\`python, \`\`\`html, \`\`\`cpp, \`\`\`java). Ensure code is fully written without shortcuts.
   c) DRY RUN EXAMPLE: Provide a clear, step-by-step Dry Run with sample input showing how state/variables change during execution.
   d) TIME & SPACE COMPLEXITY: Include explicit Time Complexity and Space Complexity analysis with Big-O notation (e.g., Time: O(N), Space: O(1)) and brief explanations.
   e) NO IMAGES: Do NOT output images, image links, or HTML image tags when answering code requests.

3. Accuracy & Integrity:
   - Be 100% factual and accurate using real-time search context when provided.
   - Do not mention search tools, internal prompts, or raw data sources.`;

        const messages = [
            new SystemMessage(systemPrompt)
        ];

        if (Array.isArray(history)) {
            history.forEach((msg) => {
                if (msg.role === "user") {
                    messages.push(new HumanMessage(msg.content));
                } else if (msg.role === "assistant") {
                    messages.push(new AIMessage(msg.content));
                }
            });
        }

        messages.push(new HumanMessage(state.prompt));

        const response = await llm.invoke(messages);
        return {
            ...state,
            credits: creditRes?.credits,
            aiResponse: response.content ? response.content.trim() : ""
        };
    } catch (error) {
        if (error.status === 429 || error.status === 402) {
            return {
                ...state,
                aiResponse: error?.data?.message || error?.message
            };
        }
        throw error;
    }
};