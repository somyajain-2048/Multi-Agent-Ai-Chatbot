import fs from "fs";
import * as pdfParseModule from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDb.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";
import { getModel } from "../config/llmmodels.js";
import { checkAgentLimit } from "../config/agentlimit.js";

export const pdfRag = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdfRag");
        const creditRes = await deductCredits(state.userId, "pdf");
        if (!state?.file?.path) {
            return {
                ...state,
                aiResponse: "No PDF file provided for analysis."
            };
        }

        const buffer = fs.readFileSync(state.file.path);
        let text = "";
        try {
            if (pdfParseModule.PDFParse) {
                const parser = new pdfParseModule.PDFParse({ data: buffer });
                const pdfData = await parser.getText();
                text = pdfData.text || "";
                if (typeof parser.destroy === "function") await parser.destroy();
            } else if (typeof pdfParseModule.default === "function") {
                const pdfData = await pdfParseModule.default(buffer);
                text = pdfData.text || "";
            } else if (typeof pdfParseModule === "function") {
                const pdfData = await pdfParseModule(buffer);
                text = pdfData.text || "";
            }
        } catch (parseErr) {
            console.error("PDF parse error:", parseErr);
        }

        if (!text || !text.trim()) {
            return {
                ...state,
                credits: creditRes?.credits,
                aiResponse: "Unable to extract readable text from the uploaded PDF. It may be an image-only scan or password-protected."
            };
        }

        const userPrompt = state.prompt?.trim() || "Please analyze and summarize this uploaded PDF.";

        let context = "";
        try {
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200
            });

            const docs = await splitter.createDocuments([text]);
            const collectionName = `pdf-${Date.now()}`;
            const store = await vectorStore(docs, collectionName);
            const relevantDocs = await store.similaritySearch(userPrompt);
            context = relevantDocs.map(d => d.pageContent).join("\n\n");
        } catch (vectorErr) {
            console.warn("Vector search unavailable, analyzing document text directly:", vectorErr?.message || vectorErr);
            context = text.slice(0, 50000);
        }

        const llm = await getModel("pdfRag");

        const messages = [
            new SystemMessage(`You are CortexAI PDF Assistant.

Rules:
- Answer accurately based on the provided PDF content.
- If the answer cannot be found in the document, reply: "I couldn't find this information in the uploaded PDF."
- Format your response with clean Markdown.`),
            new HumanMessage(`Document Content:\n${context}\n\nUser Question:\n${userPrompt}`)
        ];

        const response = await llm.invoke(messages);

        return {
            ...state,
            credits: creditRes?.credits,
            aiResponse: response.content
        };
    } catch (error) {
        console.error("PDF RAG error:", error);
        if (error.status === 429 || error.status === 402) {
            return {
                ...state,
                aiResponse: error?.data?.message || error?.message
            };
        }
        return {
            ...state,
            aiResponse: `Failed to analyze PDF: ${error?.message || error}`
        };
    } finally {
        if (state?.file?.path && fs.existsSync(state.file.path)) {
            try {
                fs.unlinkSync(state.file.path);
            } catch (e) {
                console.warn("Failed to delete temp file:", e?.message || e);
            }
        }
    }
};