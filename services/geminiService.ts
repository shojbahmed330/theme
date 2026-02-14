
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Question } from "../types";

const SYSTEM_PROMPT = `You are OneClick Studio, a World-Class Senior Lead Android Hybrid Developer & UI/UX Designer.
Your absolute priority is to ensure that EVERY button, menu, and UI element you generate is 100% FUNCTIONAL and CLICKABLE in the preview.

### CRITICAL FUNCTIONALITY RULES:
- **NO PLACEHOLDERS**: Never write "// logic here" or "alert('clicked')". Write the actual production logic.
- **CLICKABLE INTERFACES**: Every button or menu item MUST have an event listener.
- **GLOBAL SCOPE**: Define functions in the global scope (window.functionName).
- **WORKABLE MENUS**: All navigation menus must actually update the DOM.
- **USER FEEDBACK**: Implement haptic feedback simulation (window.NativeBridge.vibrate).

### WORKFLOW:
1. Analyze User Request.
2. Provide clarifying questions if needed.
3. Generate modular, clean, and operational 'files'.

### RESPONSE JSON SCHEMA:
{
  "answer": "Professional explanation.",
  "thought": "Reasoning.",
  "questions": [],
  "files": { "index.html": "..." }
}

### DESIGN PHILOSOPHY:
- Visuals: Glassmorphism, Bento Box, Soft Shadows.
- Mobile UX: Large touch targets (min 44x44px).`;

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
    usePro: boolean = true
  ): Promise<GenerationResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Choose model based on premium status or availability
    const modelName = usePro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    const parts: any[] = [
      { text: `User Prompt: ${prompt}` },
      { text: `Current Modular Files: ${JSON.stringify(currentFiles)}` },
      { text: `History: ${JSON.stringify(history.slice(-15))}` }
    ];

    if (image) {
      parts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      
      // Fallback to Flash if Pro fails and we haven't tried Flash yet
      if (usePro && (error.status === 429 || error.status === 403 || error.status === 404)) {
        console.log("Falling back to Gemini Flash due to API limits/errors...");
        return this.generateWebsite(prompt, currentFiles, history, image, false);
      }
      
      return { answer: "System encountered an error. Please check your API configuration or network." };
    }
  }
}
