
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const EMBEDDING_MODEL = "text-embedding-004";
const MODEL_NAME = "gemini-3-flash-preview";

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: { parts: [{ text }] }
    });
    
    // The SDK returns embedding.values as number[]
    if (!result.embedding || !result.embedding.values) {
      throw new Error("Failed to generate embedding");
    }
    
    return result.embedding.values;
  } catch (error) {
    console.error("Embedding Error:", error);
    return []; // Fail gracefully
  }
}

export async function analyzeMediaArtifacts(
  base64Data: string,
  mimeType: string,
  context?: string
): Promise<AnalysisResult> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analyze this media carefully for signs of deepfake manipulation or AI-generated artifacts.
    
    Context provided by user: "${context || 'None'}"
    
    Check for:
    1. Facial inconsistencies (irregular blinking, unnatural eye movement).
    2. Blending artifacts (blurring at face/hair boundaries).
    3. Texture mismatches (unnatural skin smoothing, inconsistent noise).
    4. Lighting and shadow anomalies.
    5. Structural flickering (especially in videos).
    
    For each detected artifact, provide:
    - The type and severity.
    - A description.
    - Confidence level.
    - If applicable (especially for videos or specific regions in images), provide the start and end timestamps (in seconds) and the bounding box [ymin, xmin, ymax, xmax] (normalized 0-1) where the artifact is most visible.

    Determine if the media is:
    - 'natural': Authentic, no AI manipulation.
    - 'ai-edited': Real media with AI edits (e.g., background change, retouching).
    - 'ai-generated': Fully AI-generated.

    Provide a detailed technical analysis in Markdown format. Use headers (##), bullet points (-), and bold text (**bold**) for clarity.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            integrityScore: { 
              type: Type.INTEGER, 
              description: "Integrity score from 0 (Deepfake) to 100 (Authentic)." 
            },
            isDeepfake: { type: Type.BOOLEAN },
            classification: {
              type: Type.STRING,
              enum: ['natural', 'ai-edited', 'ai-generated'],
              description: "Classification of the media: 'natural', 'ai-edited', or 'ai-generated'."
            },
            artifacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  timestampStart: { type: Type.NUMBER, description: "Start time in seconds (optional)" },
                  timestampEnd: { type: Type.NUMBER, description: "End time in seconds (optional)" },
                  boundingBox: { 
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: "[ymin, xmin, ymax, xmax] normalized coordinates (optional)"
                  }
                },
                required: ["type", "severity", "description", "confidence"]
              }
            },
            detailedAnalysis: { type: Type.STRING }
          },
          required: ["integrityScore", "isDeepfake", "classification", "artifacts", "detailedAnalysis"]
        }
      }
    });

    const resultStr = response.text;

    if (!resultStr) {
      throw new Error("The analysis was blocked by safety filters. The media may contain content that violates safety policies.");
    }

    try {
      const parsed = JSON.parse(resultStr);
      return {
          ...parsed,
          timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.error("JSON Parse Error", resultStr);
      throw new Error("Received an invalid response format from the AI model. Please try again.");
    }
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // Pass through our manually thrown errors or specific messages
    if (error.message && (
        error.message.includes("safety filters") || 
        error.message.includes("invalid response format") ||
        error.message.includes("API Key is missing")
    )) {
        throw error;
    }

    let errorMessage = "An unexpected error occurred during analysis.";
    const msg = (error.message || error.toString()).toLowerCase();

    if (msg.includes("400")) {
        errorMessage = "Invalid request. The image/video format might be unsupported or corrupted.";
    } else if (msg.includes("401") || msg.includes("403") || msg.includes("api key")) {
        errorMessage = "Authentication failed. Please check your API Key configuration.";
    } else if (msg.includes("429") || msg.includes("quota")) {
        errorMessage = "Usage limit exceeded. Please try again in a few moments.";
    } else if (msg.includes("500") || msg.includes("503") || msg.includes("overloaded")) {
        errorMessage = "The AI service is currently overloaded. Please try again later.";
    } else if (msg.includes("safety")) {
         errorMessage = "The media analysis was blocked due to safety concerns.";
    } else if (msg.includes("candidate")) {
        errorMessage = "No analysis could be generated. The media might be unclear or blocked.";
    } else if (msg.includes("fetch failed") || msg.includes("network")) {
        errorMessage = "Network error. Please check your internet connection.";
    }

    throw new Error(errorMessage);
  }
}
