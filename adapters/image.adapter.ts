
import { callGemini } from '../services/llm.service';
import { ExtractedResult } from '../core/types';
import { Type } from "@google/genai";

export const extractFromImage = async (base64: string): Promise<ExtractedResult[]> => {
  const response = await callGemini({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64.split(',')[1] || base64 } },
        { text: "AJA COMO UM ESPECIALISTA EM OCR CLÍNICO. Extraia os resultados da planilha para JSON fidedigno." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            instrument: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Cognitivo', 'TDAH', 'TEA', 'Aprendizagem', 'Linguagem', 'Emocional', 'Outro'] },
            scores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            },
            classification: { type: Type.STRING }
          },
          required: ["instrument", "scores", "category"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};
