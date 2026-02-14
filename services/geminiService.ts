
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
    // Dynamic initialization inside the method to ensure we get the latest process.env
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
      
      const text = response.text || '{}';
      try {
        return JSON.parse(text);
      } catch (e) {
        // Handle cases where model returns text around JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error("Invalid JSON response from AI");
      }
    } catch (error: any) {
      console.error(`Gemini Error (${modelName}):`, error);
      
      // Fallback logic for various API issues
      if (usePro) {
        console.warn("Attempting fallback to Gemini 3 Flash...");
        return this.generateWebsite(prompt, currentFiles, history, image, false);
      }
      
      throw error;
    }
  }
}
