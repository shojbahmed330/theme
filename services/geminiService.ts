
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Question, ProjectDatabaseConfig } from "../types";

const SYSTEM_PROMPT = `You are OneClick Studio, an expert AI developer.
Follow this 3-stage workflow:
1. STAGE 1 (Map): Roadmap only. Explain the plan in Bengali. Offer 3-4 modules in 'questions'. No code.
2. STAGE 2 (Plan): Detail a specific module. Ask 3-4 design questions in 'questions'. No code.
3. STAGE 3 (Code): Generate full working code (Tailwind, Lucide).

Rules:
- Language: 'answer' must be Bengali.
- Output: Strict JSON only. No text before or after.
- If truncated, ensure valid JSON.

JSON Schema:
{
  "answer": "Bengali description",
  "thought": "Internal reasoning",
  "files": [ { "name": "filename", "content": "code" } ],
  "questions": [ { "id": "q1", "text": "Q?", "type": "single", "options": [{"id":"o1", "label":"L"}] } ]
}`;

export interface GenerationResult {
  files?: Record<string, string>;
  answer: string;
  questions?: Question[];
  thought?: string;
}

export class GeminiService {
  private cleanJsonResponse(rawText: string): any {
    try {
      // 1. Find the first '{' and the last '}' to extract the JSON block
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      
      if (start === -1 || end === -1) {
        throw new Error("No JSON object found in response");
      }

      let jsonString = rawText.substring(start, end + 1);

      // 2. Remove common markdown artifacts if present
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');

      try {
        return JSON.parse(jsonString);
      } catch (parseError) {
        // 3. Fallback: If it's a truncation error (unterminated string), 
        // we try to extract at least the "answer" using regex as a last resort
        const answerMatch = rawText.match(/"answer"\s*:\s*"([^"]+)"/);
        if (answerMatch && answerMatch[1]) {
           return {
             answer: answerMatch[1] + "... (রেসপন্সটি অনেক বড় হওয়ায় সম্পূর্ণ আসেনি, দয়া করে ছোট মডিউলে চেষ্টা করুন)",
             files: [],
             questions: []
           };
        }
        throw parseError;
      }
    } catch (e) {
      console.error("Cleanup Error:", e, "Raw:", rawText);
      throw new Error("AI ডেটা প্রসেস করতে ব্যর্থ হয়েছে। দয়া করে ছোট কমান্ড দিন।");
    }
  }

  async generateWebsite(
    prompt: string, 
    currentFiles: Record<string, string> = {}, 
    history: ChatMessage[] = [],
    image?: { data: string; mimeType: string },
    dbConfig?: ProjectDatabaseConfig,
    usePro: boolean = false
  ): Promise<GenerationResult> {
    const key = process.env.API_KEY;
    if (!key || key === "undefined") throw new Error("API_KEY missing.");

    const ai = new GoogleGenAI({ apiKey: key });
    const modelName = 'gemini-3-flash-preview';

    const contents = [
      { parts: [
        { text: `CONTEXT:
User Prompt: ${prompt}
Existing Files: ${Object.keys(currentFiles).join(', ')}
History: ${JSON.stringify(history.slice(-2))}
Database: ${dbConfig?.provider || 'none'}` }
      ]}
    ];

    if (image) {
      contents[0].parts.push({
        inlineData: { data: image.data, mimeType: image.mimeType }
      } as any);
    }

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          // Flash model can loop if max tokens is too high or low. 
          // We let it breathe but use thinking to keep it logical.
          thinkingConfig: { thinkingBudget: 0 } 
        }
      });
      
      const parsed = this.cleanJsonResponse(response.text || "{}");
      
      const fileMap: Record<string, string> = {};
      if (Array.isArray(parsed.files)) {
        parsed.files.forEach((f: any) => {
          if (f.name && f.content) fileMap[f.name] = f.content;
        });
      }

      return {
        answer: parsed.answer || "প্রসেসিং শেষ...",
        thought: parsed.thought || "",
        questions: parsed.questions || [],
        files: fileMap
      };
    } catch (error: any) {
      console.error("Generation Error:", error);
      const isQuota = error.message?.includes("429");
      return { 
        answer: isQuota 
          ? "কোটা শেষ। ১ মিনিট পর চেষ্টা করুন।" 
          : "AI অনেক বড় টেক্সট জেনারেট করে ফেলেছে। দয়া করে 'লগইন পেজ' বা 'কার্ট' এর মতো ছোট ছোট মডিউল আলাদাভাবে বানাতে বলুন।", 
        files: {} 
      };
    }
  }
}
