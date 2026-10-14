import { searchTool } from "../config/tavily.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentlimit.js";
export const searchAgent = async (state) => {
   try {
    await checkAgentLimit(state.userId, "search");
    const creditRes = await deductCredits(state.userId, "search");
    const results = await searchTool.invoke({
        query: state.prompt
    });
    console.log("Search results:", results);

    const isExplicitImageQuery = /image|photo|picture|diagram|logo|illustration|wallpaper|draw/i.test(state.prompt);

    return {
        ...state,
        credits: creditRes?.credits,
        searchResults: results,
        images: isExplicitImageQuery ? (results?.images || []) : []
    };
   } catch (error) {
    console.error("Search agent error:", error);
    if (error.status === 429 || error.status === 402) {
        return {
            ...state,
            aiResponse: error?.data?.message || error?.message,
            searchResults: [],
            images: []
        };
    }
    return {
        ...state,
        searchResults: [],
        images: []
    };
   }
};
