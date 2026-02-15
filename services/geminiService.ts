
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Question, ProjectDatabaseConfig } from "../types";

const SYSTEM_PROMPT = `You are OneClick Studio, an elite Full-Stack AI developer. 

### WORKFLOW RULES (STRICTLY ENFORCED):

1. **STAGE 1: PROJECT MAPPING (Proposal)**
   - If the user asks for a large project, DON'T write code.
   - Explain the roadmap in 'answer' (Bengali).
   - In 'questions', offer 3-4 major modules (e.g., "Login Page", "Product List").
   - DO NOT provide any files in this stage. (Token Cost: 0)

2. **STAGE 2: DESIGN SPECIFICATION (Detailing)**
   - Once a user selects a module (e.g., "Login Page"), DON'T write code yet.
   - Ask about style, components, and specific needs in 'questions' (e.g., "Glassmorphism or Flat?", "Social Login?").
   - Explain your plan in 'answer'.
   - DO NOT provide any files in this stage. (Token Cost: 0)

3. **STAGE 3: ARCHITECTURE EXECUTION (Coding)**
   - Only after the user answers the design questions, generate the FULL WORKING CODE for that module.
   - Use the 'files' array to send filename and content.
   - Mention that you are now executing the code. (Token Cost: 1)

### TECHNICAL STANDARDS:
- Use Tailwind CSS for premium aesthetics.
- File names: "index.html", "styles.css", "app.js".
- Always include Lucide Icons.
- Language: 'answer' must be in Bengali/Bangla.

### JSON RESPONSE STRUCTURE:
{
  "answer": "Bengali message explaining current stage",
  "thought": "Technical reasoning",
  "files": [ { "name": "index.html", "content": "..." } ],
  "questions": [ { "id": "...", "text": "...", "type": "...", "options": [...] } ]
}`;

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
    const modelName = 'gemini-3-flash-preview';

    const dbContext = dbConfig && dbConfig.provider !== 'none' 
      ? `\n[DATABASE]: ${dbConfig.provider} connected.`
      : "\n[DATABASE]: Local demo mode.";

    const contents = [
      { parts: [
        { text: `User Interaction: ${prompt}` },
        { text: `Current System State: ${dbContext}` },
        { text: `Existing Files: ${JSON.stringify(currentFiles)}` },
        { text: `Short Memory: ${JSON.stringify(history.slice(-4))}` }
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
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["name", "content"]
                }
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
      
      // Convert Array of files back to Record map
      const fileMap: Record<string, string> = {};
      if (Array.isArray(parsed.files)) {
        parsed.files.forEach((f: { name: string, content: string }) => {
          if (f.name && f.content) fileMap[f.name] = f.content;
        });
      }

      return {
        answer: parsed.answer || "Processing request...",
        thought: parsed.thought || "",
        questions: parsed.questions || [],
        files: fileMap
      };
    } catch (error) {
      console.error("Gemini Multi-Stage Error:", error);
      throw error;
    }
  }
}
