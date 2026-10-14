import { getModel } from "../config/llmmodels.js";
import { generatePdf } from "../utils/generatePdf.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentlimit.js";

export const pdfAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf");
        const creditRes = await deductCredits(state.userId, "pdf");
        const llm = await getModel("pdf");
        const prompt = `You are an expert document writer.
Return ONLY valid JSON matching this exact structure:
{
  "title": "Document Title",
  "subtitle": "Subtitle description",
  "sections": [
    {
      "heading": "Section Heading",
      "points": [
        "Point 1",
        "Point 2"
      ]
    }
  ]
}

Do not return markdown formatting, code block markers (such as \`\`\`json), or explanations.

Generate 4-8 sections. Each section should have 3-6 concise bullet points.

Topic:
${state.prompt}`;

        const res = await llm.invoke(prompt);
        let rawContent = typeof res.content === "string" ? res.content.trim() : "";
        if (rawContent.startsWith("```json")) {
            rawContent = rawContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (rawContent.startsWith("```")) {
            rawContent = rawContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const data = JSON.parse(rawContent);
        const pdfBuffer = await generatePdf(data);
        const filename = `pdf-${Date.now()}.pdf`;
        const uploadResult = await uploadToS3(filename, pdfBuffer, "application/pdf");
        const downloadUrl = await getFromS3(filename, 24 * 60 * 60, uploadResult?.isS3);
        return {
            ...state,
            credits: creditRes?.credits,
            aiResponse: `# PDF Generated

**${data.title}**

📁 [Download PDF](${downloadUrl})

_Link expires in 24 hours._`
        };

    } catch (error) {
        console.error("PDF Agent error:", error);
        if (error.status === 429 || error.status === 402) {
            return {
                ...state,
                aiResponse: error?.data?.message || error?.message
            };
        }
        return {
            ...state,
            aiResponse: `Failed to generate PDF: ${error?.message || error}`
        };
    }
};
