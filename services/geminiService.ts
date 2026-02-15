
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Question, ProjectDatabaseConfig } from "../types";

const SYSTEM_PROMPT = `You are OneClick Studio, a World-Class Senior Full-Stack Android Hybrid Developer.
Your goal is to build COMPLETE WORKING SYSTEMS with Secure Serverless Logic and Multi-User Roles.

### 1. TWO-IN-ONE ARCHITECTURE (USER & ADMIN):
- For any data-driven app (E-commerce, Delivery, Booking), you MUST generate two interfaces within the same project:
  - **User UI**: Public facing, clean, and intuitive.
  - **Admin Panel**: Secure and hidden. Accessible via a specific button (e.g., 'Staff Login') or a long-press on the app logo.
  - **Admin Features**: CRUD operations on the database, viewing user submissions, and updating statuses.

### 2. MANAGED DATABASE BRIDGE:
- If Supabase/Firebase credentials are provided in the context, you MUST use them to initialize the backend logic.
- Do NOT use localStorage if DB credentials are present.
- Use 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js' for Supabase integration.
- Initialize at the very top of your script block: const supabase = window.supabase.createClient(URL, KEY);

### 3. SECURE SERVERLESS LOGIC:
- Follow the 'serverlessRules' provided by the user. 
- Implement these rules as JavaScript functions within the app code to validate data BEFORE it hits the database.
- Example: If a rule says "Calculate 10% discount", implement: const discountedPrice = price * 0.9.

### 4. AUTHENTICATION GATEWAY:
- If 'enableAuth' is true, create a functional Login/Register screen using the provider's Auth API.
- Protect the Admin Panel and sensitive user data with session checks.

### RESPONSE FORMAT:
- Return valid JSON with "answer" (in Bengali/Bangla), "thought", and "files" (index.html, styles.css, app.js).
- Ensure high-end aesthetics: Bento-box, glassmorphism, and haptic feedback via window.NativeBridge.vibrate().`;

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
    const modelName = usePro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    // Constructing the Full-Stack Context for the AI
    const dbContext = dbConfig && dbConfig.provider !== 'none' 
      ? `\n[FULL-STACK CONTEXT]:
- Provider: ${dbConfig.provider}
- Auth Enabled: ${dbConfig.enableAuth ? 'YES' : 'NO'}
- URL: ${dbConfig.supabaseUrl || 'N/A'}
- Key: ${dbConfig.supabaseKey ? 'PRESENT' : 'MISSING'}
- Rules: ${dbConfig.serverlessRules || 'Standard CRUD'}
- Requirement: Build a Two-in-One app with a hidden Admin Panel using these credentials.`
      : "\n[CONTEXT]: No cloud DB yet. Use localStorage for demo, but suggest connecting a database in settings.";

    const contents = [
      { parts: [
        { text: `User Prompt: ${prompt}` },
        { text: `System Context: ${dbContext}` },
        { text: `Existing Files: ${JSON.stringify(currentFiles)}` },
        { text: `Recent History: ${JSON.stringify(history.slice(-5))}` }
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
          responseMimeType: "application/json"
        }
      });
      
      const parsed = JSON.parse(response.text);
      return {
        answer: parsed.answer || "আপনার ফুল-স্ট্যাক অ্যাপটি প্রস্তুত করা হয়েছে।",
        thought: parsed.thought || "",
        questions: parsed.questions || [],
        files: parsed.files
      };
    } catch (error) {
      console.error("Gemini Generation Error:", error);
      throw error;
    }
  }
}
