
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Question, ProjectDatabaseConfig } from "../types";

const SYSTEM_PROMPT = `You are OneClick Studio, an elite Full-Stack developer AI. 

### YOUR STRATEGY:
1. **Clarification First**: If the user's prompt is short or lacks specific details (e.g., "build a shopping app"), you MUST NOT generate the full code yet. Instead, return a helpful 'answer' and a list of 'questions' to understand their needs (features, color theme, etc.).
2. **Complete Projects**: When generating code, provide ALL necessary files (index.html, styles.css, app.js).
3. **Aesthetics**: Use Tailwind CSS for a professional, premium look.
4. **Admin Panel**: Always include a way to access a hidden admin panel (like long-pressing the logo) for management.

### RESPONSE STRUCTURE:
- You must respond in valid JSON format.
- 'answer': Your message to the user in Bengali/Bangla.
- 'thought': Your technical plan.
- 'files': An object where keys are filenames (e.g., "index.html") and values are the code content.
- 'questions': An array of question objects (id, text, type, options) if you need more info.`;

export interface GenerationResult {
  files?: Record<string, string>;
  answer: string;
  questions?: Question[];
  thought?: string;
}

export class GeminiService {
  async generateWebsite(
    prompt: string, 
    currentFiles: Record<string, string> = {}, 
    history: ChatMessage[] = [],
    image?: { data: string; mimeType: string },
    dbConfig?: ProjectDatabaseConfig,
    usePro: boolean = false
  ): Promise<GenerationResult> {
    const key = process.env.API_KEY;
    if (!key || key === "undefined") throw new Error("API_KEY not found.");

    const ai = new GoogleGenAI({ apiKey: key });
    // Always using flash-preview as requested to avoid quota issues
    const modelName = 'gemini-3-flash-preview';

    const dbContext = dbConfig && dbConfig.provider !== 'none' 
      ? `\n[DB CONTEXT]: Provider: ${dbConfig.provider}, Auth: ${dbConfig.enableAuth ? 'Enabled' : 'Disabled'}`
      : "\n[DB CONTEXT]: Using localStorage for now.";

    const contents = [
      { parts: [
        { text: `User Prompt: ${prompt}` },
        { text: `Current Environment: ${dbContext}` },
        { text: `Existing Project Files: ${JSON.stringify(currentFiles)}` },
        { text: `Context History: ${JSON.stringify(history.slice(-3))}` }
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
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: { type: Type.STRING },
              thought: { type: Type.STRING },
              files: { 
                type: Type.OBJECT,
                additionalProperties: { type: Type.STRING },
                description: "Map of filenames to their string content."
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    type: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          label: { type: Type.STRING }
                        }
                      }
                    }
                  },
                  required: ["id", "text", "type"]
                }
              }
            },
            required: ["answer"]
          }
        }
      });
      
      const parsed = JSON.parse(response.text);
      return {
        answer: parsed.answer || "প্রসেসিং সম্পন্ন হয়েছে।",
        thought: parsed.thought || "",
        questions: parsed.questions || [],
        files: parsed.files || {}
      };
    } catch (error) {
      console.error("Gemini Service Error:", error);
      throw error;
    }
  }
}
