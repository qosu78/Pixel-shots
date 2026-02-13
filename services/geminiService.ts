
import { GoogleGenAI, Type } from "@google/genai";

// Always use the process.env.API_KEY for initialization.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a dynamic tactical battle cry or commentary using Gemini 3.
 */
export const generateBattleComm = async (event: string, playerName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, cool tactical battle cry or commentary (max 10 words) for a pixel-art shooter game called 'Pixel Shots'. 
      The event that just happened is: '${event}'. 
      The player involved is: '${playerName}'. 
      Keep it brief, immersive, and high-tech sounding.`,
    });
    // Property access .text directly.
    return response.text?.trim() || "Tactical advantage maintained.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Tactical advantage maintained.";
  }
};

/**
 * Retrieves a list of unique, futuristic bot names using Gemini 3 with structured JSON output.
 */
export const getBotNames = async (count: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of ${count} unique, futuristic, one-word bot names for a tactical shooter game.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            names: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'A futuristic bot name.'
              }
            }
          },
          required: ["names"],
        },
      },
    });

    const data = JSON.parse(response.text || '{"names": []}');
    if (data.names && Array.isArray(data.names) && data.names.length > 0) {
      return data.names.slice(0, count);
    }
  } catch (error) {
    console.error("Gemini Error:", error);
  }

  // Robust fallback for bot names.
  const STATIC_BOT_NAMES = [
    'Viper', 'Ghost', 'Phantom', 'Iron', 'Titan', 
    'Hunter', 'Rex', 'Shadow', 'Ace', 'Specter',
    'Blade', 'Wolf', 'Hawk', 'Neon', 'Zero'
  ];
  return STATIC_BOT_NAMES.slice(0, count);
};
