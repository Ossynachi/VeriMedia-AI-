
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";

export async function analyzeMediaArtifacts(
  base64Data: string,
  mimeType: string
): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    Analyze this media carefully for signs of deepfake manipulation or AI-generated artifacts.
    Check for:
    1. Facial inconsistencies (irregular blinking, unnatural eye movement).
    2. Blending artifacts (blurring at face/hair boundaries).
    3. Texture mismatches (unnatural skin smoothing, inconsistent noise).
    4. Lighting and shadow anomalies.
    5. Structural flickering (especially in videos).
    
    Provide a detailed technical analysis.
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
            artifacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING },
                  confidence: { type: Type.NUMBER }
                },
                required: ["type", "severity", "description", "confidence"]
              }
            },
            detailedAnalysis: { type: Type.STRING }
          },
          required: ["integrityScore", "isDeepfake", "artifacts", "detailedAnalysis"]
        }
      }
    });

    const resultStr = response.text || "{}";
    return {
        ...JSON.parse(resultStr),
        timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze media integrity.");
  }
}
