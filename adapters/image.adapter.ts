
import { callGemini } from '../services/llm.service';
import { ExtractedResult } from '../core/types';
import { Type } from "@google/genai";

export const extractFromImage = async (base64: string): Promise<ExtractedResult[]> => {
  // Ensure we strip the data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

  const response = await callGemini({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { 
          text: `AGIR COMO ESPECIALISTA EM PSICOMETRIA E OCR CLÍNICO.
          OBJETIVO: Extrair dados estruturados de tabelas de avaliação.
          INSTRUÇÕES: 
          1. Identifique o nome do teste/instrumento.
          2. Capture todos os subtestes/índices e seus respectivos scores (Bruto, Padrão, Percentil, etc).
          3. Identifique a classificação (ex: Médio, Superior, Deficitário).
          4. Se houver múltiplos instrumentos na mesma imagem, extraia todos como itens separados no array.
          5. IGNORE textos informativos laterais, foque nos DADOS NUMÉRICOS E TABULARES.`
        }
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

  try {
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    console.error("Erro ao parsear extração de imagem:", e);
    return [];
  }
};
