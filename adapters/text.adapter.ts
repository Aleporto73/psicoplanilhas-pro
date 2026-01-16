
import { callGemini } from '../services/llm.service';
import { ExtractedResult } from '../core/types';
import { Type } from "@google/genai";

export const extractFromText = async (content: string): Promise<ExtractedResult[]> => {
  const response = await callGemini({
    model: 'gemini-3-flash-preview',
    contents: `Extraia os dados técnicos desta planilha/resultado de teste para JSON. 
    Seja fidedigno aos nomes de escalas e pontuações.
    TEXTO: ${content}`,
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
