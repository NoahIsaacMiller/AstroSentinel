import { GoogleGenAI } from "@google/genai";
import { SpaceTarget, Language } from '../types';

// Initialize GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateTargetAnalysis = async (
  target: SpaceTarget,
  language: Language
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key missing. Cannot generate analysis.";
  }

  const langName = language === Language.CN ? 'Chinese' : language === Language.JP ? 'Japanese' : 'English';
  
  const prompt = `
    You are an advanced AI orbital defense system. 
    Analyze the following space target and provide a concise tactical situation report (max 80 words).
    Tone: Military, Scientific, High-tech, Urgent.
    Output Language: ${langName}.

    Target Data:
    - Name: ${target.name}
    - Type: ${target.type}
    - Risk Level: ${target.riskLevel}
    - Orbital Eccentricity: ${target.orbit.eccentricity}
    - Inclination: ${target.orbit.inclination}
    
    Provide:
    1. Brief orbital description.
    2. Potential threats or strategic importance.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to establish uplink with Intelligence Core.";
  }
};
