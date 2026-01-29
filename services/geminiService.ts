
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Category, SmartSuggestion } from "../types";

export const getSmartSuggestion = async (content: string): Promise<SmartSuggestion> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following note content and provide a concise title, a best-fit category from [Work, Personal, Idea, Urgent, General], a 1-sentence summary, and a suggested background color name from [Yellow, Pink, Blue, Green, Orange, Purple].
      
      Content: "${content}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            summary: { type: Type.STRING },
            colorSuggestion: { type: Type.STRING },
          },
          required: ["title", "category", "summary", "colorSuggestion"],
        },
      },
    });

    const result = JSON.parse(response.text);
    return {
      title: result.title,
      category: (['Work', 'Personal', 'Idea', 'Urgent', 'General'].includes(result.category) ? result.category : 'General') as Category,
      summary: result.summary,
      colorSuggestion: result.colorSuggestion,
    };
  } catch (error) {
    console.error("Gemini suggestion failed:", error);
    return {
      title: content.substring(0, 20) + (content.length > 20 ? "..." : ""),
      category: "General",
      summary: "No summary available.",
      colorSuggestion: "Yellow"
    };
  }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm",
              data: base64Audio,
            },
          },
          { text: "Please transcribe this audio accurately. Only return the transcribed text." },
        ],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription failed:", error);
    throw error;
  }
};
