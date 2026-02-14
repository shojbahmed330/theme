
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
    usePro: boolean = false
  ): Promise<GenerationResult> {
    const key = process.env.API_KEY;
    
    if (!key || key === "undefined") {
      throw new Error("API_KEY not found in environment. Please redeploy the app on Vercel after setting the environment variable.");
    }

    // Always use new instance to ensure the latest key from context is used
    const ai = new GoogleGenAI({ apiKey: key });
    
    const modelName = usePro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    const parts: any[] = [
      { text: `User Prompt: ${prompt}` },
      { text: `Current Modular Files: ${JSON.stringify(currentFiles)}` },
      { text: `History: ${JSON.stringify(history.slice(-10))}` }
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
      
      const text = response.text;
      if (!text) throw new Error("Empty response from AI.");

      try {
        return JSON.parse(text);
      } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error("Failed to parse AI response as JSON.");
      }
    // Fix: Removed extra parenthesis in catch clause to correctly scope the error variable
    } catch (error: any) {
      console.error(`Gemini Service Error (${modelName}):`, error);
      
      // Auto-fallback if Pro fails
      if (usePro && !error.message?.includes('API_KEY_INVALID')) {
        console.warn("Retrying with Flash fallback...");
        return this.generateWebsite(prompt, currentFiles, history, image, false);
      }
      
      const errMsg = error.message || "";
      if (errMsg.includes('401') || errMsg.includes('API_KEY_INVALID')) {
        throw new Error("Invalid API Key. Please update it in your Vercel/Project settings.");
      } else if (errMsg.includes('429')) {
        throw new Error("Quota exceeded. Please wait a moment or upgrade your Gemini plan.");
      }
      
      throw error;
    }
  }
}
